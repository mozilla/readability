/* eslint-env node, mocha */

var JSDOM = require("jsdom").JSDOM;
var xmlNameValidator = require("xml-name-validator").name;
var chai = require("chai");
var sinon = require("sinon");
chai.config.includeStack = true;
var expect = chai.expect;

var Readability = require("../index").Readability;
var JSDOMParser = require("../JSDOMParser");
var prettyPrint = require("./utils").prettyPrint;

var testPages = require("./utils").getTestPages();

function reformatError(err) {
  var formattedError = new Error(err.message);
  formattedError.stack = err.stack;
  return formattedError;
}

function inOrderTraverse(fromNode) {
  if (fromNode.firstChild) {
    return fromNode.firstChild;
  }
  while (fromNode && !fromNode.nextSibling) {
    fromNode = fromNode.parentNode;
  }
  return fromNode ? fromNode.nextSibling : null;
}

function inOrderIgnoreEmptyTextNodes(fromNode) {
  do {
    fromNode = inOrderTraverse(fromNode);
  } while (fromNode && fromNode.nodeType == 3 && !fromNode.textContent.trim());
  return fromNode;
}

function traverseDOM(callback, expectedDOM, actualDOM) {
  var actualNode = actualDOM.documentElement || actualDOM.childNodes[0];
  var expectedNode = expectedDOM.documentElement || expectedDOM.childNodes[0];
  while (actualNode || expectedNode) {
    // We'll stop if we don't have both actualNode and expectedNode
    if (!callback(actualNode, expectedNode)) {
      break;
    }
    actualNode = inOrderIgnoreEmptyTextNodes(actualNode);
    expectedNode = inOrderIgnoreEmptyTextNodes(expectedNode);
  }
}

// Collapse subsequent whitespace like HTML:
function htmlTransform(str) {
  return str.replace(/\s+/g, " ");
}

function runTestsWithItems(
  label,
  domGenerationFn,
  source,
  expectedContent,
  expectedMetadata
) {
  describe(label, function () {
    this.timeout(30000);

    var result;

    before(function () {
      try {
        var doc = domGenerationFn(source);
        // Provide one class name to preserve, which we know appears in a few
        // of the test documents.
        var myReader = new Readability(doc, { classesToPreserve: ["caption"] });
        result = myReader.parse();
      } catch (err) {
        throw reformatError(err);
      }
    });

    it("should return a result object", function () {
      expect(result).to.include.keys("content", "title", "excerpt", "byline");
    });

    it("should extract expected content", function () {
      function nodeStr(n) {
        if (!n) {
          return "(no node)";
        }
        if (n.nodeType == 3) {
          return "#text(" + htmlTransform(n.textContent) + ")";
        }
        if (n.nodeType != 1) {
          return "some other node type: " + n.nodeType + " with data " + n.data;
        }
        var rv = n.localName;
        if (n.id) {
          rv += "#" + n.id;
        }
        if (n.className) {
          rv += ".(" + n.className + ")";
        }
        return rv;
      }

      function genPath(node) {
        if (node.id) {
          return "#" + node.id;
        }
        if (node.tagName == "BODY") {
          return "body";
        }
        var parent = node.parentNode;
        var parentPath = genPath(parent);
        var index = Array.prototype.indexOf.call(parent.childNodes, node) + 1;
        return parentPath + " > " + nodeStr(node) + ":nth-child(" + index + ")";
      }

      function findableNodeDesc(node) {
        return genPath(node) + "(in: ``" + node.parentNode.innerHTML + "``)";
      }

      function attributesForNode(node) {
        return Array.from(node.attributes)
          .filter(function (attr) {
            return xmlNameValidator(attr.name);
          })
          .map(function (attr) {
            return attr.name + "=" + attr.value;
          });
      }

      var actualDOM = domGenerationFn(prettyPrint(result.content));
      var expectedDOM = domGenerationFn(prettyPrint(expectedContent));

      traverseDOM(
        function (actualNode, expectedNode) {
          if (actualNode && expectedNode) {
            var actualDesc = nodeStr(actualNode);
            var expectedDesc = nodeStr(expectedNode);
            if (actualDesc != expectedDesc) {
              expect(actualDesc, findableNodeDesc(actualNode)).eql(
                expectedDesc
              );
              return false;
            }
            // Compare text for text nodes:
            if (actualNode.nodeType == 3) {
              var actualText = htmlTransform(actualNode.textContent);
              var expectedText = htmlTransform(expectedNode.textContent);
              expect(actualText, findableNodeDesc(actualNode)).eql(
                expectedText
              );
              if (actualText != expectedText) {
                return false;
              }
              // Compare attributes for element nodes:
            } else if (actualNode.nodeType == 1) {
              var actualNodeAttributes = attributesForNode(actualNode);
              var expectedNodeAttributes = attributesForNode(expectedNode);
              var desc =
                "node " +
                nodeStr(actualNode) +
                " attributes (" +
                actualNodeAttributes.join(",") +
                ") should match (" +
                expectedNodeAttributes.join(",") +
                ") 1";
              expect(actualNodeAttributes.length, desc).eql(
                expectedNodeAttributes.length
              );
              for (var i = 0; i < actualNodeAttributes.length; i++) {
                var attr = actualNodeAttributes[i].name;
                var actualValue = actualNode.getAttribute(attr);
                var expectedValue = expectedNode.getAttribute(attr);
                expect(
                  expectedValue,
                  "node (" +
                    findableNodeDesc(actualNode) +
                    ") attribute " +
                    attr +
                    " should match"
                ).eql(actualValue);
              }
            }
          } else {
            expect(
              nodeStr(actualNode),
              "Should have a node from both DOMs"
            ).eql(nodeStr(expectedNode));
            return false;
          }
          return true;
        },
        actualDOM,
        expectedDOM
      );
    });

    it("should extract expected title", function () {
      expect(result.title).eql(expectedMetadata.title);
    });

    it("should extract expected byline", function () {
      expect(result.byline).eql(expectedMetadata.byline);
    });

    it("should extract expected excerpt", function () {
      expect(result.excerpt).eql(expectedMetadata.excerpt);
    });

    it("should extract expected site name", function () {
      expect(result.siteName).eql(expectedMetadata.siteName);
    });

    expectedMetadata.dir &&
      it("should extract expected direction", function () {
        expect(result.dir).eql(expectedMetadata.dir);
      });

    expectedMetadata.lang &&
      it("should extract expected language", function () {
        expect(result.lang).eql(expectedMetadata.lang);
      });

    expectedMetadata.publishedTime &&
      it("should extract expected published time", function () {
        expect(result.publishedTime).eql(expectedMetadata.publishedTime);
      });
  });
}

function removeCommentNodesRecursively(node) {
  for (var i = node.childNodes.length - 1; i >= 0; i--) {
    var child = node.childNodes[i];
    if (child.nodeType === child.COMMENT_NODE) {
      node.removeChild(child);
    } else if (child.nodeType === child.ELEMENT_NODE) {
      removeCommentNodesRecursively(child);
    }
  }
}

describe("Readability API", function () {
  describe("#constructor", function () {
    var doc = new JSDOMParser().parse("<html><div>yo</div></html>");
    it("should accept a debug option", function () {
      expect(new Readability(doc)._debug).eql(false);
      expect(new Readability(doc, { debug: true })._debug).eql(true);
    });

    it("should accept a nbTopCandidates option", function () {
      expect(new Readability(doc)._nbTopCandidates).eql(5);
      expect(
        new Readability(doc, { nbTopCandidates: 42 })._nbTopCandidates
      ).eql(42);
    });

    it("should accept a maxElemsToParse option", function () {
      expect(new Readability(doc)._maxElemsToParse).eql(0);
      expect(
        new Readability(doc, { maxElemsToParse: 42 })._maxElemsToParse
      ).eql(42);
    });

    it("should accept a keepClasses option", function () {
      expect(new Readability(doc)._keepClasses).eql(false);
      expect(new Readability(doc, { keepClasses: true })._keepClasses).eql(
        true
      );
      expect(new Readability(doc, { keepClasses: false })._keepClasses).eql(
        false
      );
    });

    it("should accept a allowedVideoRegex option or default it", function () {
      expect(new Readability(doc)._allowedVideoRegex).eql(
        Readability.prototype.REGEXPS.videos
      );
      const allowedVideoRegex = /\/\/mydomain.com\/.*'/;
      expect(
        new Readability(doc, { allowedVideoRegex })._allowedVideoRegex
      ).eql(allowedVideoRegex);
    });
  });

  describe("#parse", function () {
    var exampleSource = testPages[0].source;

    it("shouldn't parse oversized documents as per configuration", function () {
      var doc = new JSDOMParser().parse("<html><div>yo</div></html>");
      expect(function () {
        new Readability(doc, { maxElemsToParse: 1 }).parse();
      }).to.Throw("Aborting parsing document; 2 elements found");
    });

    it("should run _cleanClasses with default configuration", function () {
      var doc = new JSDOMParser().parse(exampleSource);
      var parser = new Readability(doc);

      parser._cleanClasses = sinon.fake();

      parser.parse();

      expect(parser._cleanClasses.called).eql(true);
    });

    it("should run _cleanClasses when option keepClasses = false", function () {
      var doc = new JSDOMParser().parse(exampleSource);
      var parser = new Readability(doc, { keepClasses: false });

      parser._cleanClasses = sinon.fake();

      parser.parse();

      expect(parser._cleanClasses.called).eql(true);
    });

    it("shouldn't run _cleanClasses when option keepClasses = true", function () {
      var doc = new JSDOMParser().parse(exampleSource);
      var parser = new Readability(doc, { keepClasses: true });

      parser._cleanClasses = sinon.fake();

      parser.parse();

      expect(parser._cleanClasses.called).eql(false);
    });

    it("should use custom content serializer sent as option", function () {
      var dom = new JSDOM("My cat: <img src=''>");
      var expected_xhtml =
        '<div xmlns="http://www.w3.org/1999/xhtml" id="readability-page-1" class="page">My cat: <img src="" /></div>';
      var xml = new dom.window.XMLSerializer();
      var content = new Readability(dom.window.document, {
        serializer(el) {
          return xml.serializeToString(el.firstChild);
        },
      }).parse().content;
      expect(content).eql(expected_xhtml);
    });

    it("should use custom video regex sent as option", function () {
      var dom = new JSDOM(
        "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc mollis leo lacus, vitae semper nisl ullamcorper ut.</p>" +
          '<iframe src="https://mycustomdomain.com/some-embeds"></iframe>'
      );
      var expected_xhtml =
        '<div id="readability-page-1" class="page">' +
        "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc mollis leo lacus, vitae semper nisl ullamcorper ut.</p>" +
        '<iframe src="https://mycustomdomain.com/some-embeds"></iframe>' +
        "</div>";
      var content = new Readability(dom.window.document, {
        charThreshold: 20,
        allowedVideoRegex: /.*mycustomdomain.com.*/,
      }).parse().content;
      expect(content).eql(expected_xhtml);
    });
  });

  describe("title comparison with non-Latin scripts", function () {
    // Each title is deliberately short enough (<= 4 words) for
    // _getArticleTitle to keep the whole <title> text, and differentTitle
    // shares no words with any of them.
    var titles = {
      ASCII: "The quick brown fox",
      "accented Latin": "Café résumé naïve",
      "decomposed accents": "Café résumé naïve",
      Cyrillic: "Быстрая коричневая лиса",
      CJK: "快速的棕色狐狸",
      Arabic: "الثعلب البني السريع",
      "Arabic with diacritics": "الثَّعْلَبُ البُنِّيُّ السَّرِيعُ",
      Hebrew: "שועל חום מהיר",
      Devanagari: "तेज़ भूरी लोमड़ी",
    };
    var differentTitle = "Lorem ipsum dolor";
    var paragraph =
      "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do " +
      "eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad " +
      "minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip " +
      "ex ea commodo consequat. Duis aute irure dolor in reprehenderit in " +
      "voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>";
    var parsers = {
      jsdom: source => new JSDOM(source).window.document,
      JSDOMParser: source => new JSDOMParser().parse(source),
    };

    describe("tokenizer", function () {
      var tokenize = text =>
        text
          .toLowerCase()
          .split(Readability.prototype.REGEXPS.tokenize)
          .filter(Boolean);

      it("should split ASCII text on anything but letters, digits and _", function () {
        expect(tokenize("Foo, bar-baz_qux! 42?")).eql([
          "foo",
          "bar",
          "baz_qux",
          "42",
        ]);
      });

      it("should not split words in non-Latin scripts", function () {
        expect(tokenize("Быстрая, коричневая лиса.")).eql([
          "быстрая",
          "коричневая",
          "лиса",
        ]);
        expect(tokenize("שועל חום מהיר")).eql(["שועל", "חום", "מהיר"]);
        expect(tokenize("快速的棕色狐狸，12")).eql(["快速的棕色狐狸", "12"]);
      });

      it("should keep combining marks inside words", function () {
        expect(tokenize(titles["decomposed accents"])).eql([
          "café",
          "résumé",
          "naïve",
        ]);
        expect(tokenize(titles["Arabic with diacritics"])).to.have.lengthOf(3);
        expect(tokenize(titles.Devanagari)).to.have.lengthOf(3);
      });
    });

    describe("#_textSimilarity", function () {
      var readability = new Readability(
        new JSDOMParser().parse("<html><div>yo</div></html>")
      );

      Object.keys(titles).forEach(function (script) {
        it(`should compare ${script} text by its words`, function () {
          var title = titles[script];
          expect(readability._textSimilarity(title, title)).eql(1);
          expect(readability._textSimilarity(title, differentTitle)).eql(0);
          expect(readability._textSimilarity(differentTitle, title)).eql(0);
          expect(
            readability._textSimilarity(title + " - Example Site", title)
          ).eql(1);
        });
      });

      it("should ignore case and punctuation in non-Latin text", function () {
        expect(
          readability._textSimilarity(
            "Быстрая коричневая лиса",
            "быстрая, коричневая лиса!"
          )
        ).eql(1);
      });
    });

    Object.keys(parsers).forEach(function (parserName) {
      describe(`duplicate title heading removal (${parserName})`, function () {
        Object.keys(titles).forEach(function (script) {
          it(`should remove an <h1> repeating the ${script} title`, function () {
            var title = titles[script];
            var source =
              `<html><head><title>${title} - Example Site</title></head>` +
              `<body><article><h1>${title}</h1>` +
              paragraph.repeat(3) +
              "</article></body></html>";
            var result = new Readability(parsers[parserName](source)).parse();
            expect(result.title).eql(`${title} - Example Site`);
            expect(result.content).to.not.include(title);
            expect(result.content).to.include("Lorem ipsum dolor sit amet");
          });
        });

        it("should keep a heading that is not the title", function () {
          var heading = "Другой заголовок статьи";
          var source =
            "<html><head><title>Быстрая коричневая лиса - Example Site</title></head>" +
            `<body><article><h1>${heading}</h1>` +
            paragraph.repeat(3) +
            "</article></body></html>";
          var result = new Readability(parsers[parserName](source)).parse();
          expect(result.content).to.include(heading);
        });
      });
    });

    it("should use the JSON-LD headline matching a non-Latin title", function () {
      var source =
        "<html><head><title>Быстрая коричневая лиса</title>" +
        '<script type="application/ld+json">' +
        JSON.stringify({
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          name: "Название сайта",
          headline: "Быстрая коричневая лиса",
        }) +
        "</script></head><body><article>" +
        paragraph.repeat(3) +
        "</article></body></html>";
      var result = new Readability(new JSDOM(source).window.document).parse();
      expect(result.title).eql("Быстрая коричневая лиса");
    });
  });
});

describe("Test pages", function () {
  testPages.forEach(function (testPage) {
    describe(testPage.dir, function () {
      var uri = "http://fakehost/test/page.html";

      runTestsWithItems(
        "jsdom",
        function (source) {
          var doc = new JSDOM(source, {
            url: uri,
          }).window.document;
          removeCommentNodesRecursively(doc);
          return doc;
        },
        testPage.source,
        testPage.expectedContent,
        testPage.expectedMetadata
      );

      runTestsWithItems(
        "JSDOMParser",
        function (source) {
          var parser = new JSDOMParser();
          var doc = parser.parse(source, uri);
          if (parser.errorState) {
            console.error("Parsing this DOM caused errors:", parser.errorState);
            return null;
          }
          return doc;
        },
        testPage.source,
        testPage.expectedContent,
        testPage.expectedMetadata
      );
    });
  });
});
