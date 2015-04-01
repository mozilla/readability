var readability = require("./index.js");
var Readability = readability.Readability;
var JSDOMParser = readability.JSDOMParser;

suite("Readability test suite benchmarks", function () {
  set("iterations", 100);
  set("type", "static");

  require("./test/bootstrap").getTestPages().forEach(function(testPage) {
    bench(testPage.dir + " perf", function() {
      new JSDOMParser().parse(testPage.source);
    });
  });
});
