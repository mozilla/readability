/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * This is a relatively lightweight DOMParser that is safe to use in a web
 * worker. This is far from a complete DOM implementation; however, it should
 * contain the minimal set of functionality necessary for Readability.js.
 *
 * Aside from not implementing the full DOM API, there are other quirks to be
 * aware of when using the JSDOMParser:
 *
 *   1) Properly formed HTML/XML must be used. This means you should be extra
 *      careful when using this parser on anything received directly from an
 *      XMLHttpRequest. Providing a serialized string from an XMLSerializer,
 *      however, should be safe (since the browser's XMLSerializer should
 *      generate valid HTML/XML). Therefore, if parsing a document from an XHR,
 *      the recommended approach is to do the XHR in the main thread, use
 *      XMLSerializer.serializeToString() on the responseXML, and pass the
 *      resulting string to the worker.
 *
 *   2) Live NodeLists are not supported. DOM methods and properties such as
 *      getElementsByTagName() and childNodes return standard arrays. If you
 *      want these lists to be updated when nodes are removed or added to the
 *      document, you must take care to manually update them yourself.
 */

var Node = require('./lib/node');
var Attribute = require('./lib/attribute');
var Comment = require('./lib/comment');

var helpers = require('./lib/helpers');

module.exports = (function (global) {
  global = global || {};

  function error(m) {
    dump("JSDOMParser error: " + m + "\n");
  }

  // Attach the standard DOM types to the global scope
  global.Node = Node;
  global.Comment = Comment;
  global.Document = Document;
  global.Element = Element;
  global.Text = Text;

  // Attach JSDOMParser to the global scope
  global.JSDOMParser = JSDOMParser;

  return global;
})();
