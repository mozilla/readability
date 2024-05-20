/* eslint-env node */

var Readability = require("../Readability");
var {JSDOM} = require("jsdom");
var fs = require("fs");
var path = require("path");

var testcaseRoot = path.join(__dirname, "test-pages");

if (process.argv.length < 3) {
  console.log("No testcase provided.");
  process.exit(1);
}

var src = fs.readFileSync(`${testcaseRoot}/${process.argv[2]}/source.html`, {encoding: "utf-8"}).trim();

var doc = new JSDOM(src, {url: "http://fakehost/test/page.html"}).window.document;

new Readability(doc, {debug: true}).parse();
