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

exports.getExtractionTestPages = function() {
  var testRootFolder = path.join(testPageRoot, "extraction");
  return fs.readdirSync(testRootFolder).filter(function(entry) {
    return fs.statSync(path.join(testRootFolder, entry)).isDirectory();
  }).map(function(dir) {
    return {
      dir: dir,
      source: readFile(path.join(testRootFolder, dir, "source.html")),
      expectedContent: readFile(path.join(testRootFolder, dir, "expected.html")),
      expectedMetadata: readJSON(path.join(testRootFolder, dir, "expected-metadata.json")),
    };
  });
};

exports.getDetectionTestPages = function() {
  var testRootFolder = path.join(testPageRoot, "detection");
  var readableFilesRoot = path.join(testRootFolder, "readerable");
  var readable = fs.readdirSync(readableFilesRoot).map(function(file) {
    var source = readFile(path.join(readableFilesRoot, file));
    return {file: file, source: source, readerable: true};
  });
  var nonReadableFilesRoot = path.join(testRootFolder, "non-readerable");
  var nonReadable = fs.readdirSync(nonReadableFilesRoot).map(function(file) {
    var source = readFile(path.join(nonReadableFilesRoot, file));
    return {file: file, source: source, readerable: false};
  });
  return readable.concat(nonReadable);
};
