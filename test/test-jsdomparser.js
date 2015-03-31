var path = require("path");
var fs = require("fs");

var chai = require("chai");
chai.config.includeStack = true;
var expect = chai.expect;

// We want to load JSDOMParser, which isn't set up as commonjs libraries,
// and so we need to do some hocus-pocus with 'vm' to import them on a separate scope
// (identical) scope context.
var vm = require("vm");
var jsdomPath = path.join(__dirname, "..", "JSDOMParser.js");


var scopeContext = {};
// We generally expect dump() and console.{whatever} to work, so make these available
// in the scope we're using:
scopeContext.dump = console.log
scopeContext.console = console;

// Actually load file. NB: if the file has parse errors,
// node is dumb and shows you a syntax error *at this callsite* . Don't try to find
// a syntax error on this line, there isn't one. Go look in the file it's loading instead.
vm.runInNewContext(fs.readFileSync(jsdomPath), scopeContext, jsdomPath);

var JSDOMParser = scopeContext.JSDOMParser;

var BASETESTCASE = '<html><body><p>Some text and <a class="someclass" href="#">a link</a></p>' +
                   '<div id="foo">With a <script>With < fancy " characters in it because' +
                   '</script> that is fun.<span>And another node to make it harder</span></div><form><input type="text"/><input type="number"/>Here\'s a form</form></body></html>';

var baseDoc = new JSDOMParser().parse(BASETESTCASE);

describe("Test JSDOM functionality", function() {
  function nodeExpect(actual, expected) {
    try {
      expect(actual).eql(expected);
    } catch (ex) {
      throw ex.message;
    }
  }
  it("should work for basic operations using the parent child hierarchy and innerHTML", function() {
    expect(baseDoc.childNodes.length).eql(1);
    expect(baseDoc.getElementsByTagName("*").length).eql(10);
    var foo = baseDoc.getElementById("foo");
    expect(foo.parentNode.localName).eql("body");
    nodeExpect(baseDoc.body, foo.parentNode);
    nodeExpect(baseDoc.body.parentNode, baseDoc.documentElement);
    expect(baseDoc.body.childNodes.length).eql(3);

    var generatedHTML = "<html>" + baseDoc.documentElement.innerHTML + "</html>";
    expect(generatedHTML).eql(BASETESTCASE);
  });

  it("should deal with script tags", function() {
    // Check our script parsing worked:
    var scripts = baseDoc.getElementsByTagName("script");
    expect(scripts.length).eql(1);
    expect(scripts[0].textContent).eql("With < fancy \" characters in it because");
  });

  it("should have working sibling/first+lastChild properties", function() {
    var foo = baseDoc.getElementById("foo");

    nodeExpect(foo.previousSibling.nextSibling, foo);
    nodeExpect(foo.nextSibling.previousSibling, foo);
    nodeExpect(foo.nextSibling, foo.nextElementSibling);
    nodeExpect(foo.previousSibling, foo.previousElementSibling);

    var beforeFoo = foo.previousSibling;
    var afterFoo = foo.nextSibling;

    nodeExpect(baseDoc.body.lastChild, afterFoo);
    nodeExpect(baseDoc.body.firstChild, beforeFoo);
  });

  it("should have working removeChild and appendChild functionality", function() {
    var foo = baseDoc.getElementById("foo");
    var beforeFoo = foo.previousSibling;
    var afterFoo = foo.nextSibling;

    var removedFoo = foo.parentNode.removeChild(foo);
    nodeExpect(foo, removedFoo);
    nodeExpect(foo.parentNode, null);
    nodeExpect(foo.previousSibling, null);
    nodeExpect(foo.nextSibling, null);
    nodeExpect(foo.previousElementSibling, null);
    nodeExpect(foo.nextElementSibling, null);

    expect(beforeFoo.localName).eql("p");
    nodeExpect(beforeFoo.nextSibling, afterFoo);
    nodeExpect(afterFoo.previousSibling, beforeFoo);
    nodeExpect(beforeFoo.nextElementSibling, afterFoo);
    nodeExpect(afterFoo.previousElementSibling, beforeFoo);

    expect(baseDoc.body.childNodes.length).eql(2);

    baseDoc.body.appendChild(foo);

    expect(baseDoc.body.childNodes.length).eql(3);
    nodeExpect(afterFoo.nextSibling, foo);
    nodeExpect(foo.previousSibling, afterFoo);
    nodeExpect(afterFoo.nextElementSibling, foo);
    nodeExpect(foo.previousElementSibling, afterFoo);

    // This should reorder back to sanity:
    baseDoc.body.appendChild(afterFoo);
    nodeExpect(foo.previousSibling, beforeFoo);
    nodeExpect(foo.nextSibling, afterFoo);
    nodeExpect(foo.previousElementSibling, beforeFoo);
    nodeExpect(foo.nextElementSibling, afterFoo);

    nodeExpect(foo.previousSibling.nextSibling, foo);
    nodeExpect(foo.nextSibling.previousSibling, foo);
    nodeExpect(foo.nextSibling, foo.nextElementSibling);
    nodeExpect(foo.previousSibling, foo.previousElementSibling);
  });

  it("should handle attributes", function() {
    var link = baseDoc.getElementsByTagName("a")[0];
    expect(link.getAttribute("href")).eql("#");
    expect(link.getAttribute("class")).eql(link.className);
    var foo = baseDoc.getElementById("foo");
    expect(foo.id).eql(foo.getAttribute("id"));
  });

  it("should have a working replaceChild", function() {
    var parent = baseDoc.getElementsByTagName('div')[0];
    var p = baseDoc.createElement("p");
    p.setAttribute("id", "my-replaced-kid");
    var childCount = parent.childNodes.length;
    var childElCount = parent.children.length;
    for (var i = 0; i < parent.childNodes.length; i++) {
      var replacedNode = parent.childNodes[i];
      var replacedAnElement = replacedNode.nodeType === replacedNode.ELEMENT_NODE;
      var oldNext = replacedNode.nextSibling;
      var oldNextEl = replacedNode.nextElementSibling;
      var oldPrev = replacedNode.previousSibling;
      var oldPrevEl = replacedNode.previousElementSibling;

      parent.replaceChild(p, replacedNode);

      // Check siblings and parents on both nodes were set:
      nodeExpect(p.nextSibling, oldNext);
      nodeExpect(p.previousSibling, oldPrev);
      nodeExpect(p.parentNode, parent);

      nodeExpect(replacedNode.parentNode, null);
      nodeExpect(replacedNode.nextSibling, null);
      nodeExpect(replacedNode.previousSibling, null);
      // if the old node was an element, element siblings should now be null
      if (replacedAnElement) {
        nodeExpect(replacedNode.nextElementSibling, null);
        nodeExpect(replacedNode.previousElementSibling, null);
      }

      // Check the siblings were updated
      if (oldNext)
        nodeExpect(oldNext.previousSibling, p);
      if (oldPrev)
        nodeExpect(oldPrev.nextSibling, p);

      // check the array was updated
      nodeExpect(parent.childNodes[i], p);

      // Now check element properties/lists:
      var kidElementIndex = parent.children.indexOf(p);
      // should be in the list:
      expect(kidElementIndex).not.eql(-1);

      if (kidElementIndex > 0) {
        nodeExpect(parent.children[kidElementIndex - 1], p.previousElementSibling);
        nodeExpect(p.previousElementSibling.nextElementSibling, p);
      } else {
        nodeExpect(p.previousElementSibling, null);
      }
      if (kidElementIndex < parent.children.length - 1) {
        nodeExpect(parent.children[kidElementIndex + 1], p.nextElementSibling);
        nodeExpect(p.nextElementSibling.previousElementSibling, p);
      } else {
        nodeExpect(p.nextElementSibling, null);
      }

      if (replacedAnElement) {
        nodeExpect(oldNextEl, p.nextElementSibling);
        nodeExpect(oldPrevEl, p.previousElementSibling);
      }

      expect(parent.childNodes.length).eql(childCount);
      expect(parent.children.length).eql(replacedAnElement ? childElCount : childElCount + 1);

      parent.replaceChild(replacedNode, p);

      nodeExpect(oldNext, replacedNode.nextSibling);
      nodeExpect(oldNextEl, replacedNode.nextElementSibling);
      nodeExpect(oldPrev, replacedNode.previousSibling);
      nodeExpect(oldPrevEl, replacedNode.previousElementSibling);
      if (replacedNode.nextSibling)
        nodeExpect(replacedNode.nextSibling.previousSibling, replacedNode);
      if (replacedNode.previousSibling)
        nodeExpect(replacedNode.previousSibling.nextSibling, replacedNode);
      if (replacedAnElement) {
        if (replacedNode.previousElementSibling)
          nodeExpect(replacedNode.previousElementSibling.nextElementSibling, replacedNode);
        if (replacedNode.nextElementSibling)
          nodeExpect(replacedNode.nextElementSibling.previousElementSibling, replacedNode);
      }
    }
  });
});


describe("Script parsing", function() {
  it("should strip ?-based comments within script tags", function() {
    var html = '<script><?Silly test <img src="test"></script>';
    var doc = new JSDOMParser().parse(html);
    expect(doc.firstChild.tagName).eql("SCRIPT");
    expect(doc.firstChild.textContent).eql("");
    expect(doc.firstChild.children.length).eql(0);
    expect(doc.firstChild.childNodes.length).eql(1);
  });

  it("should strip !-based comments within script tags", function() {
    var html = '<script><!--Silly test > <script src="foo.js"></script>--></script>';
    var doc = new JSDOMParser().parse(html);
    expect(doc.firstChild.tagName).eql("SCRIPT");
    expect(doc.firstChild.textContent).eql("");
    expect(doc.firstChild.children.length).eql(0);
    expect(doc.firstChild.childNodes.length).eql(1);
  });

  it("should strip any other nodes within script tags", function() {
    var html = "<script><div>Hello, I'm not really in a </div></script>";
    var doc = new JSDOMParser().parse(html);
    expect(doc.firstChild.tagName).eql("SCRIPT");
    expect(doc.firstChild.textContent).eql("<div>Hello, I'm not really in a </div>");
    expect(doc.firstChild.children.length).eql(0);
    expect(doc.firstChild.childNodes.length).eql(1);
  });

  it("should not be confused by partial closing tags", function() {
    var html = "<script>var x = '<script>Hi<' + '/script>';</script>";
    var doc = new JSDOMParser().parse(html);
    expect(doc.firstChild.tagName).eql("SCRIPT");
    expect(doc.firstChild.textContent).eql("var x = '<script>Hi<' + '/script>';");
    expect(doc.firstChild.children.length).eql(0);
    expect(doc.firstChild.childNodes.length).eql(1);
  });
});
