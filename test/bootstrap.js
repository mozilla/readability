var path = require("path");
var fs = require("fs");
var prettyPrint = require("html").prettyPrint;

function readFile(path) {
  return fs.readFileSync(path, {encoding: "utf-8"}).trim();
}

function readJSON(path) {
  return JSON.parse(readFile(path));
}

var testPageRoot = path.join(__dirname, "test-pages");

exports.getTestPages = function() {
  return fs.readdirSync(testPageRoot).map(function(dir) {
    return {
      dir: dir,
      source: readFile(path.join(testPageRoot, dir, "source.html")),
      expectedContent: readFile(path.join(testPageRoot, dir, "expected.html")),
      expectedMetadata: readJSON(path.join(testPageRoot, dir, "expected-metadata.json")),
    };
  });
};
