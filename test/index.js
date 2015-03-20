"use strict";

var path = require("path");
var fs = require("fs");
var prettyPrint = require("html").prettyPrint;
var chai = require("chai");
chai.config.includeStack = true;
var expect = chai.expect;

var readability = require('../index.js');

function readFile(path) {
  return fs.readFileSync(path, {encoding: "utf-8"});
}

function readJSON(path) {
  return JSON.parse(readFile(path));
}

var testPageRoot = path.join(__dirname, "test-pages");
var testPages = fs.readdirSync(testPageRoot).map(function(dir) {
  return {
    dir: dir,
    source: path.join(testPageRoot, dir, "source.html"),
    expected: path.join(testPageRoot, dir, "expected.html"),
    expectedMetadata: path.join(testPageRoot, dir, "expected-metadata.json"),
  };
});

describe("Test page", function() {
  testPages.forEach(function(testPage) {
    describe(testPage.dir, function() {
      var doc, result, metadata;

      var expectedMetadata = readJSON(testPage.expectedMetadata);
      var expectedContent = readFile(testPage.expected);
      var source = readFile(testPage.source);
      var uri = {
        spec: "http://fakehost/test/page.html",
        host: "fakehost",
        prePath: "http://fakehost",
        scheme: "http",
        pathBase: "http://fakehost/test"
      };

      beforeEach(function() {
        result = readability(uri, source);
      });

      it("should return a result object", function() {
        expect(result).to.include.keys("content", "title", "excerpt", "byline");
      });

      it("should extract expected content", function() {
        expect(expectedContent).eql(prettyPrint(result.content));
      });

      it("should extract expected title", function() {
        expect(expectedMetadata.title).eql(result.title);
      });

      it("should extract expected byline", function() {
        expect(expectedMetadata.byline).eql(result.byline);
      });

      it("should extract expected excerpt", function() {
        expect(expectedMetadata.excerpt).eql(result.excerpt);
      });
    });
  });
});
