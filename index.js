"use strict";

var path = require("path");
var vm = require("vm");
var fs = require("fs");

var readabilityPath = path.join(__dirname, "Readability.js");
var jsdomPath = path.join(__dirname, "JSDOMParser.js");

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

/*
    @mozURIObject is a Mozilla object describing a URI. Example:
    {
        spec: "http://fakehost/test/page.html",
        host: "fakehost",
        prePath: "http://fakehost",
        scheme: "http",
        pathBase: "http://fakehost/test"
    }
    @htmlString is a string representing an HTML document
*/
module.exports = function(mozURIObject, htmlString){
  var doc = new JSDOMParser().parse(htmlString);
  return new Readability(mozURIObject, doc).parse();
};