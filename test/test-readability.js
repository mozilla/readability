var prettyPrint = require("html").prettyPrint;
var jsdom = require("jsdom").jsdom;
var chai = require("chai");
chai.config.includeStack = true;
var expect = chai.expect;

var readability = require("../index");
var Readability = readability.Readability;
var JSDOMParser = readability.JSDOMParser;

var testPages = require("./bootstrap").getTestPages();

function runTestsWithItems(label, beforeFn, expectedContent, expectedMetadata) {
  describe(label, function() {
    var result;
    before(function() {
      result = beforeFn();
    });

    it("should return a result object", function() {
      expect(result).to.include.keys("content", "title", "excerpt", "byline");
    });

    it("should extract expected content", function() {
      expect(expectedContent).eql(prettyPrint(result.content));
    });

    it("should extract expected title", function() {
      expect(expectedMetadata.title).eql(result.title);
    });

    it("should extract expected byline", function() {
      expect(expectedMetadata.byline).eql(result.byline);
    });

    it("should extract expected excerpt", function() {
      expect(expectedMetadata.excerpt).eql(result.excerpt);
    });

    it("should probably be readerable", function() {
      expect(expectedMetadata.readerable).eql(result.readerable);
    });
  });
}

function removeCommentNodesRecursively(node) {
  [].forEach.call(node.childNodes, function(child) {
    if (child.nodeType === child.COMMENT_NODE) {
      node.removeChild(child);
    } else if (child.nodeType === child.ELEMENT_NODE) {
      removeCommentNodesRecursively(child);
    }
  });
}

describe("Test page", function() {
  testPages.forEach(function(testPage) {
    describe(testPage.dir, function() {
      var uri = {
        spec: "http://fakehost/test/page.html",
        host: "fakehost",
        prePath: "http://fakehost",
        scheme: "http",
        pathBase: "http://fakehost/test/"
      };

      runTestsWithItems("jsdom", function() {
        var doc = jsdom(testPage.source, {
          features: {
            FetchExternalResources: false,
            ProcessExternalResources: false
          }
        });
        removeCommentNodesRecursively(doc);
        var readability = new Readability(uri, doc);
        var readerable = readability.isProbablyReaderable();
        var result = readability.parse();
        result.readerable = readerable;
        return result;
      }, testPage.expectedContent, testPage.expectedMetadata);

      runTestsWithItems("JSDOMParser", function() {
        var doc = new JSDOMParser().parse(testPage.source);
        var readability = new Readability(uri, doc);
        var readerable = readability.isProbablyReaderable();
        var result = readability.parse();
        result.readerable = readerable;
        return result;
      }, testPage.expectedContent, testPage.expectedMetadata);
    });
  });
});
