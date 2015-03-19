var path = require("path");
var fs = require("fs");
var prettyPrint = require("html").prettyPrint;
var expect = require("chai").expect;

// We want to load Readability and JSDOMParser, which aren't set up as commonjs libraries,
// and so we need to do some hocus-pocus with 'vm' to import them on a separate scope
// (identical) scope context.
var vm = require("vm");
var readabilityPath = path.join(__dirname, "..", "Readability.js");
var jsdomPath = path.join(__dirname, "..", "JSDOMParser.js");


var scopeContext = {};
// We generally expect dump() and console.{whatever} to work, so make these available
// in the scope we're using:
scopeContext.dump = console.log
scopeContext.console = console;

// Actually load files. NB: if either of the files has parse errors,
// node is dumb and shows you a syntax error *at this callsite* . Don't try to find
// a syntax error on this line, there isn't one. Go look in the file it's loading instead.
vm.runInNewContext(fs.readFileSync(jsdomPath), scopeContext, jsdomPath);
vm.runInNewContext(fs.readFileSync(readabilityPath), scopeContext, readabilityPath);

// Now make references to the globals in our scope so we can use them easily:
var Readability = scopeContext.Readability;
var JSDOMParser = scopeContext.JSDOMParser;

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
        var source = fs.readFileSync(testPage.source, {encoding: "utf-8"});
        var uri = {
          spec: "http://fakehost/test/page.html",
          host: "fakehost",
          prePath: "http://fakehost",
          scheme: "http",
          pathBase: "http://fakehost/test"
        };
        var doc = new JSDOMParser().parse(source);
        var result = new Readability(uri, doc).parse();
        expect(prettyPrint(result.content)).eql(expected);
        done();
      });
    });
  });
});
