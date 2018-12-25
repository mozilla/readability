var getTestPages = require("../test/utils").getTestPages;

var readability = require("../index.js");
var readabilityCheck = require("../Readability-readerable.js");
var JSDOM = require("jsdom").JSDOM;
var Readability = readability.Readability;
var JSDOMParser = readability.JSDOMParser;

var referenceTestPages = [
  "002",
  "herald-sun-1",
  "lifehacker-working",
  "lifehacker-post-comment-load",
  "medium-1",
  "medium-2",
  "salon-1",
  "tmz-1",
  "wapo-1",
  "wapo-2",
  "webmd-1",
];

var testPages = getTestPages();

if (process.env.READABILITY_PERF_REFERENCE === "1") {
  testPages = testPages.filter(function(testPage) {
    return referenceTestPages.indexOf(testPage.dir) !== -1;
  });
}

suite("JSDOMParser test page perf", function () {
  set("iterations", 1);
  set("type", "static");

  testPages.forEach(function(testPage) {
    bench(testPage.dir + " document parse perf", function() {
      new JSDOMParser().parse(testPage.source);
    });
  });
});


suite("Readability test page perf", function () {
  set("iterations", 1);
  set("type", "static");

  testPages.forEach(function(testPage) {
    var doc = new JSDOMParser().parse(testPage.source);
    bench(testPage.dir + " readability perf", function() {
      new Readability(doc).parse();
    });
  });
});

suite("isProbablyReaderable perf", function () {
  set("iterations", 1);
  set("type", "static");

  testPages.forEach(function(testPage) {
    var uri = "http://fakehost/test/page.html";
    var doc = new JSDOM(testPage.source, {
      url: uri,
    }).window.document;
    bench(testPage.dir + " readability perf", function() {
      readabilityCheck.isProbablyReaderable(doc);
    });
  });
});
