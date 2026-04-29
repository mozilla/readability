/* eslint-env node, mocha */

var JSDOM = require("jsdom").JSDOM;
var chai = require("chai");
var expect = chai.expect;

var Readability = require("../index").Readability;

function articleHtml(titleText, headingTag, headingText) {
  var long =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do " +
    "eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad " +
    "minim veniam, quis nostrud exercitation ullamco laboris nisi ut " +
    "aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit " +
    "in voluptate velit esse cillum dolore eu fugiat nulla pariatur.";
  return (
    "<!DOCTYPE html><html><head><title>" +
    titleText +
    "</title></head><body><article>" +
    "<" +
    headingTag +
    ">" +
    headingText +
    "</" +
    headingTag +
    "><p>" +
    long +
    "</p><p>" +
    long +
    "</p></article></body></html>"
  );
}

describe("keepOriginalTitleHeaders option", function () {
  this.timeout(30000);

  it("when false, removes the first heading that duplicates the title and rewrites other H1 to H2", function () {
    var titleText = "Readability Title Headers Option Test 7f3a";
    var source = articleHtml(titleText, "h1", titleText);
    var doc = new JSDOM(source, { url: "http://example.com/article" }).window
      .document;
    var result = new Readability(doc).parse();
    expect(result.content).to.not.include("<h1>");
    expect(result.content).to.not.include("<h2>" + titleText);
    expect(result.title).to.eql(titleText);
  });

  it("when true, keeps the duplicate title header as H1 and does not rewrite it to H2", function () {
    var titleText = "Readability Title Headers Option Test 7f3b";
    var source = articleHtml(titleText, "h1", titleText);
    var doc = new JSDOM(source, { url: "http://example.com/article" }).window
      .document;
    var result = new Readability(doc, {
      keepOriginalTitleHeaders: true,
    }).parse();
    expect(result.content).to.include("<h1>" + titleText + "</h1>");
    expect(result.title).to.eql(titleText);
  });

  it("when false, rewrites a non-title H1 in the article body to H2", function () {
    var titleText = "Readability Title Headers Option Test 7f3c";
    var bodyHeading = "Distinct In Article Heading 9z2q";
    var source = articleHtml(titleText, "h1", bodyHeading);
    var doc = new JSDOM(source, { url: "http://example.com/article" }).window
      .document;
    var result = new Readability(doc).parse();
    expect(result.content).to.include("<h2>" + bodyHeading + "</h2>");
    expect(result.content).to.not.include("<h1>" + bodyHeading);
  });

  it("when true, leaves a non-title H1 in the article body as H1", function () {
    var titleText = "Readability Title Headers Option Test 7f3d";
    var bodyHeading = "Distinct In Article Heading 9z2r";
    var source = articleHtml(titleText, "h1", bodyHeading);
    var doc = new JSDOM(source, { url: "http://example.com/article" }).window
      .document;
    var result = new Readability(doc, {
      keepOriginalTitleHeaders: true,
    }).parse();
    expect(result.content).to.include("<h1>" + bodyHeading + "</h1>");
    expect(result.content).to.not.include("<h2>" + bodyHeading);
  });

  it("when true, prepends clones of document-level H1 outside the extracted subtree (before post-processing)", function () {
    var titleText = "Readability External Hero H1 Title Option Test 9x4m";
    var long =
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do " +
      "eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad " +
      "minim veniam, quis nostrud exercitation ullamco laboris nisi ut " +
      "aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit " +
      "in voluptate velit esse cillum dolore eu fugiat nulla pariatur.";
    var source =
      "<!DOCTYPE html><html><head><title>" +
      titleText +
      "</title></head><body><main>" +
      '<section class="hero"><h1 class="hero-title">' +
      titleText +
      "</h1></section>" +
      "<article><p>" +
      long +
      "</p><p>" +
      long +
      "</p></article>" +
      "</main></body></html>";

    var doc = new JSDOM(source, { url: "http://example.com/article" }).window
      .document;
    var result = new Readability(doc, {
      keepOriginalTitleHeaders: true,
    }).parse();

    expect(result.content).to.include("<h1>" + titleText + "</h1>");
    expect(result.content.indexOf("<h1>" + titleText)).to.be.lessThan(
      result.content.indexOf('id="readability-page-1"')
    );
    expect(result.title).to.eql(titleText);
  });

  it("when true, does not prepend H1 that appear after grabbed content in document order", function () {
    var titleText =
      "Readability Article Title After Hero Ignore Later H1 Test 9x5p";
    var sidebarHeading = "Sidebar Or Footer H1 Must Not Prepend 9x5q";
    var long =
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do " +
      "eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad " +
      "minim veniam, quis nostrud exercitation ullamco laboris nisi ut " +
      "aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit " +
      "in voluptate velit esse cillum dolore eu fugiat nulla pariatur.";
    var source =
      "<!DOCTYPE html><html><head><title>" +
      titleText +
      "</title></head><body><main>" +
      "<article><p>" +
      long +
      "</p><p>" +
      long +
      "</p></article>" +
      "<aside><h1>" +
      sidebarHeading +
      "</h1><p>" +
      long +
      "</p></aside>" +
      "</main></body></html>";

    var doc = new JSDOM(source, { url: "http://example.com/article" }).window
      .document;
    var result = new Readability(doc, {
      keepOriginalTitleHeaders: true,
    }).parse();

    expect(result.content).to.not.include(sidebarHeading);
    expect(result.title).to.eql(titleText);
  });

  it("when false, does not prepend hero H1 from outside the extracted subtree", function () {
    var titleText =
      "Readability External Hero H1 Absent When Option False Test 9x4n";
    var long =
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do " +
      "eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad " +
      "minim veniam, quis nostrud exercitation ullamco laboris nisi ut " +
      "aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit " +
      "in voluptate velit esse cillum dolore eu fugiat nulla pariatur.";
    var source =
      "<!DOCTYPE html><html><head><title>" +
      titleText +
      "</title></head><body><main>" +
      '<section class="hero"><h1 class="hero-title">' +
      titleText +
      "</h1></section>" +
      "<article><p>" +
      long +
      "</p><p>" +
      long +
      "</p></article>" +
      "</main></body></html>";

    var doc = new JSDOM(source, { url: "http://example.com/article" }).window
      .document;
    var result = new Readability(doc).parse();

    expect(result.content).to.not.include("<h1");
    expect(result.title).to.eql(titleText);
  });
});
