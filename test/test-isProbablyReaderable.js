var jsdom = require("jsdom").jsdom;
var chai = require("chai");
chai.config.includeStack = true;
var expect = chai.expect;

var testPages = require("./utils").getTestPages();
var readabilityCheck = require("../Readability-readerable.js");

describe("isProbablyReaderable - test pages", function() {
  testPages.forEach(function(testPage) {
    var uri = "http://fakehost/test/page.html";
    describe(testPage.dir, function() {
      var doc = jsdom(testPage.source, {
        url: uri,
        features: {
          FetchExternalResources: false,
          ProcessExternalResources: false,
        },
      });
      var expected = testPage.expectedMetadata.readerable;
      it("The result should " + (expected ? "" : "not ") + "be readerable", function() {
        expect(readabilityCheck.isProbablyReaderable(doc)).eql(expected);
      });
    });
  });
});

