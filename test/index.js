var scrape = require("readable-proxy").scrape;
var path = require("path");
var fs = require("fs");
var prettyPrint = require("html").prettyPrint;
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.should();
chai.use(chaiAsPromised);
var expect = chai.expect;

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
      it("should render as expected", function() {
        // Allows up to 10 seconds for parsing to complete.
        // XXX: Scraping is damn slow. Investigate.
        this.timeout(10000);
        var expected = fs.readFileSync(testPage.expected, {encoding: "utf-8"});
        return scrape("file://" + testPage.source).catch(function(err) {
          throw err;
        }).then(function(result) {
          // normalize html
          return prettyPrint(result.content);
        }).should.eventually.become(prettyPrint(expected));
      });
    });
  })
});
