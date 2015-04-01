var path = require("path");
var fs = require("fs");

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

function readFile(path) {
  return fs.readFileSync(path, {encoding: "utf-8"}).trim();
}

var baseSet = [
  "002", "herald-sun-1", "lifehacker-working", "lifehacker-post-comment-load",
  "medium-1", "medium-2", "salon-1", "tmz-1", "wapo-1", "wapo-2", "webmd-1",
];

var testPageRoot = path.join(__dirname, "test-pages");
var testPages = fs.readdirSync(testPageRoot).filter(function(dir) {
  return baseSet.indexOf(dir) !== -1;
}).map(function(dir) {
  var rv = {
    dir: dir,
    source: path.join(testPageRoot, dir, "source.html"),
  };
  rv.content = readFile(rv.source);
  return rv;
});


var startTime = process.hrtime();
testPages.forEach(function(item) {
  item.doc = new JSDOMParser().parse(item.content);
});
var timeDiff = process.hrtime(startTime);
console.log("Parsed everything, took", ((timeDiff[0] * 1e9 + timeDiff[1]) / 1e6) + "ms on", testPages.length, "files.");

var uri = {
  spec: "http://fakehost/test/page.html",
  host: "fakehost",
  prePath: "http://fakehost",
  scheme: "http",
  pathBase: "http://fakehost/test/"
};
startTime = process.hrtime();
testPages.forEach(function(item) {
  item.result = new Readability(uri, item.doc).parse();
});
timeDiff = process.hrtime(startTime);
console.log("Readerized everything, took", ((timeDiff[0] * 1e9 + timeDiff[1]) / 1e6) + "ms on", testPages.length, "documents.");
console.log("Output has total length:", testPages.reduce(function(existing, item) { return item.result.content + "\n" + existing; }).length);


