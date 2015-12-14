var prettyPrint = require("./utils").prettyPrint;
var jsdom = require("jsdom");
var chai = require("chai");
chai.config.includeStack = true;
var expect = chai.expect;

var readability = require("../index");
console.log(readability);
var Readability = readability.Readability;
var JSDOMParser = readability.JSDOMParser;

jsdom.defaultDocumentFeatures = {
  ProcessExternalResources: false,
  FetchExternalResources: false
};

var testPages = require("./utils").getTestPages();

function removeCommentNodesRecursively(node) {
  [].forEach.call(node.childNodes, function(child) {
    if (child.nodeType === child.COMMENT_NODE) {
      node.removeChild(child);
    } else if (child.nodeType === child.ELEMENT_NODE) {
      removeCommentNodesRecursively(child);
    }
  });
}


var testPage = testPages[0];

var uri = {
        spec: "http://fakehost.com/test/page.html",
        host: "fakehost.com",
        prePath: "http://fakehost.com",
        scheme: "http",
        pathBase: "http://fakehost.com/test/"
      };
      
var doc = jsdom.jsdom(testPage.source);
removeCommentNodesRecursively(doc);
var result;
var readability = new Readability(uri, doc);
var readerable = readability.isProbablyReaderable();

result = readability.parse();
result.readerable = readerable;
return result;
