var path = require("path");
var fs = require("fs");
var jsdom = require("jsdom");
var prettyPrint = require("html").prettyPrint;
var expect = require("chai").expect;

var testPageRoot = path.join(__dirname, "test-pages");
var testPages = fs.readdirSync(testPageRoot).map(function(dir) {
  return {
    dir: dir,
    source: path.join(testPageRoot, dir, "source.html"),
    expected: path.join(testPageRoot, dir, "expected.html"),
  };
});

describe("Test page", function() {
  testPages.forEach(function(testPage) {
    describe(testPage.dir, function() {
      it("should render as expected", function(done) {
        var expected = fs.readFileSync(testPage.expected, {encoding: "utf-8"});
        jsdom.env(
          fs.readFileSync(testPage.source, {encoding: "utf-8"}),
          [path.join(__dirname, "..", "Readability.js")],
          function (errors, window) {
            if (errors) {
              throw new Error(errors);
            }
            var uri = {
              spec: "http://fakehost/test/page.html",
              host: "fakehost",
              prePath: "http://fakehost",
              scheme: "http",
              pathBase: "http://fakehost/test"
            };
            var result = new window.Readability(uri, window.document).parse();
            expect(prettyPrint(result.content)).eql(prettyPrint(expected))
            done();
          }
        );
      });
    });
  });
});
