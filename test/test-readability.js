var prettyPrint = require("html").prettyPrint;
var chai = require("chai");
chai.config.includeStack = true;
var expect = chai.expect;

var readability = require("../index");
var Readability = readability.Readability;
var JSDOMParser = readability.JSDOMParser;

var testPages = require("./bootstrap").getTestPages();

describe("Test isProbablyReaderable", function() {
  testPages.forEach(function(testPage) {
    describe(testPage.dir, function() {
      var doc, isProbablyReaderable;

      before(function() {
        doc = new JSDOMParser().parse(testPage.source);
        isProbablyReaderable = new Readability(null, doc).isProbablyReaderable();
      });

      it("should probably be readerable", function() {
        expect(isProbablyReaderable).eql(testPage.expectedMetadata.readerable);
      });
    });
  });
});

describe("Test page", function() {
  testPages.forEach(function(testPage) {
    describe(testPage.dir, function() {
      var doc, result;

      var uri = {
        spec: "http://fakehost/test/page.html",
        host: "fakehost",
        prePath: "http://fakehost",
        scheme: "http",
        pathBase: "http://fakehost/test/"
      };

      before(function() {
        doc = new JSDOMParser().parse(testPage.source);
        result = new Readability(uri, doc).parse();
      });

      it("should return a result object", function() {
        expect(result).to.include.keys("content", "title", "excerpt", "byline");
      });

      it("should extract expected content", function() {
        expect(testPage.expectedContent).eql(prettyPrint(result.content));
      });

      it("should extract expected title", function() {
        expect(testPage.expectedMetadata.title).eql(result.title);
      });

      it("should extract expected byline", function() {
        expect(testPage.expectedMetadata.byline).eql(result.byline);
      });

      it("should extract expected excerpt", function() {
        expect(testPage.expectedMetadata.excerpt).eql(result.excerpt);
      });
    });
  });
});
