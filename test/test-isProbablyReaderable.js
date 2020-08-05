var JSDOM = require("jsdom").JSDOM;
var chai = require("chai");
chai.config.includeStack = true;
var expect = chai.expect;

var testPages = require("./utils").getTestPages();
var isProbablyReaderable = require("../index").isProbablyReaderable;

describe("isProbablyReaderable - test pages", function() {
  testPages.forEach(function(testPage) {
    var uri = "http://fakehost/test/page.html";
    describe(testPage.dir, function() {
      var doc = new JSDOM(testPage.source, {
        url: uri,
      }).window.document;
      var expected = testPage.expectedMetadata.readerable;
      it("The result should " + (expected ? "" : "not ") + "be readerable", function() {
        expect(isProbablyReaderable(doc)).eql(expected);
      });
    });
  });
});

