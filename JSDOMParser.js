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
(function (global) {

  function error(m) {
    dump("JSDOMParser error: " + m + "\n");
  }

  // When a style is set in JS, map it to the corresponding CSS attribute
  let styleMap = {
    "alignmentBaseline": "alignment-baseline",
    "background": "background",
    "backgroundAttachment": "background-attachment",
    "backgroundClip": "background-clip",
    "backgroundColor": "background-color",
    "backgroundImage": "background-image",
    "backgroundOrigin": "background-origin",
    "backgroundPosition": "background-position",
    "backgroundPositionX": "background-position-x",
    "backgroundPositionY": "background-position-y",
    "backgroundRepeat": "background-repeat",
    "backgroundRepeatX": "background-repeat-x",
    "backgroundRepeatY": "background-repeat-y",
    "backgroundSize": "background-size",
    "baselineShift": "baseline-shift",
    "border": "border",
    "borderBottom": "border-bottom",
    "borderBottomColor": "border-bottom-color",
    "borderBottomLeftRadius": "border-bottom-left-radius",
    "borderBottomRightRadius": "border-bottom-right-radius",
    "borderBottomStyle": "border-bottom-style",
    "borderBottomWidth": "border-bottom-width",
    "borderCollapse": "border-collapse",
    "borderColor": "border-color",
    "borderImage": "border-image",
    "borderImageOutset": "border-image-outset",
    "borderImageRepeat": "border-image-repeat",
    "borderImageSlice": "border-image-slice",
    "borderImageSource": "border-image-source",
    "borderImageWidth": "border-image-width",
    "borderLeft": "border-left",
    "borderLeftColor": "border-left-color",
    "borderLeftStyle": "border-left-style",
    "borderLeftWidth": "border-left-width",
    "borderRadius": "border-radius",
    "borderRight": "border-right",
    "borderRightColor": "border-right-color",
    "borderRightStyle": "border-right-style",
    "borderRightWidth": "border-right-width",
    "borderSpacing": "border-spacing",
    "borderStyle": "border-style",
    "borderTop": "border-top",
    "borderTopColor": "border-top-color",
    "borderTopLeftRadius": "border-top-left-radius",
    "borderTopRightRadius": "border-top-right-radius",
    "borderTopStyle": "border-top-style",
    "borderTopWidth": "border-top-width",
    "borderWidth": "border-width",
    "bottom": "bottom",
    "boxShadow": "box-shadow",
    "boxSizing": "box-sizing",
    "captionSide": "caption-side",
    "clear": "clear",
    "clip": "clip",
    "clipPath": "clip-path",
    "clipRule": "clip-rule",
    "color": "color",
    "colorInterpolation": "color-interpolation",
    "colorInterpolationFilters": "color-interpolation-filters",
    "colorProfile": "color-profile",
    "colorRendering": "color-rendering",
    "content": "content",
    "counterIncrement": "counter-increment",
    "counterReset": "counter-reset",
    "cursor": "cursor",
    "direction": "direction",
    "display": "display",
    "dominantBaseline": "dominant-baseline",
    "emptyCells": "empty-cells",
    "enableBackground": "enable-background",
    "fill": "fill",
    "fillOpacity": "fill-opacity",
    "fillRule": "fill-rule",
    "filter": "filter",
    "cssFloat": "float",
    "floodColor": "flood-color",
    "floodOpacity": "flood-opacity",
    "font": "font",
    "fontFamily": "font-family",
    "fontSize": "font-size",
    "fontStretch": "font-stretch",
    "fontStyle": "font-style",
    "fontVariant": "font-variant",
    "fontWeight": "font-weight",
    "glyphOrientationHorizontal": "glyph-orientation-horizontal",
    "glyphOrientationVertical": "glyph-orientation-vertical",
    "height": "height",
    "imageRendering": "image-rendering",
    "kerning": "kerning",
    "left": "left",
    "letterSpacing": "letter-spacing",
    "lightingColor": "lighting-color",
    "lineHeight": "line-height",
    "listStyle": "list-style",
    "listStyleImage": "list-style-image",
    "listStylePosition": "list-style-position",
    "listStyleType": "list-style-type",
    "margin": "margin",
    "marginBottom": "margin-bottom",
    "marginLeft": "margin-left",
    "marginRight": "margin-right",
    "marginTop": "margin-top",
    "marker": "marker",
    "markerEnd": "marker-end",
    "markerMid": "marker-mid",
    "markerStart": "marker-start",
    "mask": "mask",
    "maxHeight": "max-height",
    "maxWidth": "max-width",
    "minHeight": "min-height",
    "minWidth": "min-width",
    "opacity": "opacity",
    "orphans": "orphans",
    "outline": "outline",
    "outlineColor": "outline-color",
    "outlineOffset": "outline-offset",
    "outlineStyle": "outline-style",
    "outlineWidth": "outline-width",
    "overflow": "overflow",
    "overflowX": "overflow-x",
    "overflowY": "overflow-y",
    "padding": "padding",
    "paddingBottom": "padding-bottom",
    "paddingLeft": "padding-left",
    "paddingRight": "padding-right",
    "paddingTop": "padding-top",
    "page": "page",
    "pageBreakAfter": "page-break-after",
    "pageBreakBefore": "page-break-before",
    "pageBreakInside": "page-break-inside",
    "pointerEvents": "pointer-events",
    "position": "position",
    "quotes": "quotes",
    "resize": "resize",
    "right": "right",
    "shapeRendering": "shape-rendering",
    "size": "size",
    "speak": "speak",
    "src": "src",
    "stopColor": "stop-color",
    "stopOpacity": "stop-opacity",
    "stroke": "stroke",
    "strokeDasharray": "stroke-dasharray",
    "strokeDashoffset": "stroke-dashoffset",
    "strokeLinecap": "stroke-linecap",
    "strokeLinejoin": "stroke-linejoin",
    "strokeMiterlimit": "stroke-miterlimit",
    "strokeOpacity": "stroke-opacity",
    "strokeWidth": "stroke-width",
    "tableLayout": "table-layout",
    "textAlign": "text-align",
    "textAnchor": "text-anchor",
    "textDecoration": "text-decoration",
    "textIndent": "text-indent",
    "textLineThrough": "text-line-through",
    "textLineThroughColor": "text-line-through-color",
    "textLineThroughMode": "text-line-through-mode",
    "textLineThroughStyle": "text-line-through-style",
    "textLineThroughWidth": "text-line-through-width",
    "textOverflow": "text-overflow",
    "textOverline": "text-overline",
    "textOverlineColor": "text-overline-color",
    "textOverlineMode": "text-overline-mode",
    "textOverlineStyle": "text-overline-style",
    "textOverlineWidth": "text-overline-width",
    "textRendering": "text-rendering",
    "textShadow": "text-shadow",
    "textTransform": "text-transform",
    "textUnderline": "text-underline",
    "textUnderlineColor": "text-underline-color",
    "textUnderlineMode": "text-underline-mode",
    "textUnderlineStyle": "text-underline-style",
    "textUnderlineWidth": "text-underline-width",
    "top": "top",
    "unicodeBidi": "unicode-bidi",
    "unicodeRange": "unicode-range",
    "vectorEffect": "vector-effect",
    "verticalAlign": "vertical-align",
    "visibility": "visibility",
    "whiteSpace": "white-space",
    "widows": "widows",
    "width": "width",
    "wordBreak": "word-break",
    "wordSpacing": "word-spacing",
    "wordWrap": "word-wrap",
    "writingMode": "writing-mode",
    "zIndex": "z-index",
    "zoom": "zoom",
  };

  // Elements that can be self-closing
  let voidElems = {
    "area": true,
    "base": true,
    "br": true,
    "col": true,
    "command": true,
    "embed": true,
    "hr": true,
    "img": true,
    "input": true,
    "link": true,
    "meta": true,
    "param": true,
    "source": true,
  };

  // See http://www.w3schools.com/dom/dom_nodetype.asp
  let nodeTypes = {
    ELEMENT_NODE: 1,
    ATTRIBUTE_NODE: 2,
    TEXT_NODE: 3,
    CDATA_SECTION_NODE: 4,
    ENTITY_REFERENCE_NODE: 5,
    ENTITY_NODE: 6,
    PROCESSING_INSTRUCTION_NODE: 7,
    COMMENT_NODE: 8,
    DOCUMENT_NODE: 9,
    DOCUMENT_TYPE_NODE: 10,
    DOCUMENT_FRAGMENT_NODE: 11,
    NOTATION_NODE: 12
  };

  function getElementsByTagName(tag) {
    tag = tag.toUpperCase();
    let elems = [];
    let allTags = (tag === "*");
    function getElems(node) {
      let length = node.childNodes.length;
      for (let i = 0; i < length; i++) {
        let child = node.childNodes[i];
        if (child.nodeType !== 1)
          continue;
        if (allTags || (child.tagName === tag))
          elems.push(child);
        getElems(child);
      }
    }
    getElems(this);
    return elems;
  }

  let Node = function () {};

  Node.prototype = {
    attributes: null,
    childNodes: null,
    localName: null,
    nodeName: null,
    parentNode: null,
    textContent: null,

    get firstChild() {
      return this.childNodes[0] || null;
    },

    get nextSibling() {
      if (this.parentNode) {
        let childNodes = this.parentNode.childNodes;
        return childNodes[childNodes.indexOf(this) + 1] || null;
      }

      return null;
    },

    appendChild: function (child) {
      if (child.parentNode) {
        child.parentNode.removeChild(child);
      }

      this.childNodes.push(child);
      child.parentNode = this;
    },

    removeChild: function (child) {
      let childNodes = this.childNodes;
      let childIndex = childNodes.indexOf(child);
      if (childIndex === -1) {
        throw "removeChild: node not found";
      } else {
        child.parentNode = null;
        return childNodes.splice(childIndex, 1)[0];
      }
    },

    replaceChild: function (newNode, oldNode) {
      let childNodes = this.childNodes;
      let childIndex = childNodes.indexOf(oldNode);
      if (childIndex === -1) {
        throw "replaceChild: node not found";
      } else {
        if (newNode.parentNode)
          newNode.parentNode.removeChild(newNode);

        childNodes[childIndex] = newNode;
        newNode.parentNode = this;
        oldNode.parentNode = null;
        return oldNode;
      }
    }
  };

  for (let i in nodeTypes) {
    Node[i] = Node.prototype[i] = nodeTypes[i];
  }

  let Attribute = function (name, value) {
    this.name = name;
    this.value = value;
  };

  let Comment = function () {
    this.childNodes = [];
  };

  Comment.prototype = {
    __proto__: Node.prototype,

    nodeName: "#comment",
    nodeType: Node.COMMENT_NODE
  };

  let Text = function () {
    this.childNodes = [];
  };

  Text.prototype = {
    __proto__: Node.prototype,

    nodeName: "#text",
    nodeType: Node.TEXT_NODE,
    textContent: ""
  }

  let Document = function () {
    this.styleSheets = [];
    this.childNodes = [];
  };

  Document.prototype = {
    __proto__: Node.prototype,

    nodeName: "#document",
    nodeType: Node.DOCUMENT_NODE,
    title: "",

    getElementsByTagName: getElementsByTagName,

    getElementById: function (id) {
      function getElem(node) {
        let length = node.childNodes.length;
        if (node.id === id)
          return node;
        for (let i = 0; i < length; i++) {
          let el = getElem(node.childNodes[i]);
          if (el)
            return el;
        }
        return null;
      }
      return getElem(this);
    },

    createElement: function (tag) {
      let node = new Element(tag);
      return node;
    }
  };

  let Element = function (tag) {
    this.attributes = [];
    this.childNodes = [];
    this.localName = tag.toLowerCase();
    this.tagName = tag.toUpperCase();
    this.style = new Style(this);
  };

  Element.prototype = {
    __proto__: Node.prototype,

    nodeType: Node.ELEMENT_NODE,

    getElementsByTagName: getElementsByTagName,

    get className() {
      return this.getAttribute("class") || "";
    },

    set className(str) {
      this.setAttribute("class", str);
    },

    get id() {
      return this.getAttribute("id") || "";
    },

    set id(str) {
      this.setAttribute("id", str);
    },

    get href() {
      return this.getAttribute("href") || "";
    },

    set href(str) {
      this.setAttribute("href", str);
    },

    get src() {
      return this.getAttribute("src") || "";
    },

    set src(str) {
      this.setAttribute("src", str);
    },

    get nodeName() {
      return this.tagName;
    },

    get innerHTML() {
      function getHTML(node) {
        let i = 0;
        for (i = 0; i < node.childNodes.length; i++) {
          let child = node.childNodes[i];
          if (child.localName) {
            arr.push("<" + child.localName);

            // serialize attribute list
            for (let j = 0; j < child.attributes.length; j++) {
              let attr = child.attributes[j];
              let quote = (attr.value.indexOf('"') === -1 ? '"' : "'");
              arr.push(" " + attr.name + '=' + quote + attr.value + quote);
            }

            if (child.localName in voidElems) {
              // if this is a self-closing element, end it here
              arr.push("/>");
            } else {
              // otherwise, add its children
              arr.push(">");
              getHTML(child);
              arr.push("</" + child.localName + ">");
            }
          } else {
            arr.push(child.textContent);
          }
        }
      }

      // Using Array.join() avoids the overhead from lazy string concatenation.
      // See http://blog.cdleary.com/2012/01/string-representation-in-spidermonkey/#ropes
      let arr = [];
      getHTML(this);
      return arr.join("");
    },

    set innerHTML(html) {
      let parser = new JSDOMParser();
      let node = parser.parse(html);
      for (let i = this.childNodes.length; --i >= 0;) {
        this.childNodes[i].parentNode = null;
      }
      this.childNodes = node.childNodes;
      for (let i = this.childNodes.length; --i >= 0;) {
        this.childNodes[i].parentNode = this;
      }
    },

    set textContent(text) {
      // clear parentNodes for existing children
      for (let i = this.childNodes.length; --i >= 0;) {
        this.childNodes[i].parentNode = null;
      }

      let node = new Text();
      this.childNodes = [ node ];
      node.textContent = text;
      node.parentNode = this;
    },

    get textContent() {
      function getText(node) {
        let nodes = node.childNodes;
        for (let i = 0; i < nodes.length; i++) {
          let child = nodes[i];
          if (child.nodeType === 3) {
            text.push(child.textContent);
          } else {
            getText(child);
          }
        }
      }

      // Using Array.join() avoids the overhead from lazy string concatenation.
      // See http://blog.cdleary.com/2012/01/string-representation-in-spidermonkey/#ropes
      let text = [];
      getText(this);
      return text.join("");
    },

    getAttribute: function (name) {
      for (let i = this.attributes.length; --i >= 0;) {
        let attr = this.attributes[i];
        if (attr.name === name)
          return attr.value;
      }
      return undefined;
    },

    setAttribute: function (name, value) {
      for (let i = this.attributes.length; --i >= 0;) {
        let attr = this.attributes[i];
        if (attr.name === name) {
          attr.value = value;
          return;
        }
      }
      this.attributes.push(new Attribute(name, value));
    },

    removeAttribute: function (name) {
      for (let i = this.attributes.length; --i >= 0;) {
        let attr = this.attributes[i];
        if (attr.name === name) {
          this.attributes.splice(i, 1);
          break;
        }
      }
    }
  };

  let Style = function (node) {
    this.node = node;
  };

  // getStyle() and setStyle() use the style attribute string directly. This
  // won't be very efficient if there are a lot of style manipulations, but
  // it's the easiest way to make sure the style attribute string and the JS
  // style property stay in sync. Readability.js doesn't do many style
  // manipulations, so this should be okay.
  Style.prototype = {
    getStyle: function (styleName) {
      let attr = this.node.getAttribute("style");
      if (!attr)
        return undefined;

      let styles = attr.split(";");
      for (let i = 0; i < styles.length; i++) {
        let style = styles[i].split(":");
        let name = style[0].trim();
        if (name === styleName)
          return style[1].trim();
      }

      return undefined;
    },

    setStyle: function (styleName, styleValue) {
      let value = this.node.getAttribute("style") || "";
      let index = 0;
      do {
        let next = value.indexOf(";", index) + 1;
        let length = next - index - 1;
        let style = (length > 0 ? value.substr(index, length) : value.substr(index));
        if (style.substr(0, style.indexOf(":")).trim() === styleName) {
          value = value.substr(0, index).trim() + (next ? " " + value.substr(next).trim() : "");
          break;
        }
        index = next;
      } while (index);

      value += " " + styleName + ": " + styleValue + ";";
      this.node.setAttribute("style", value.trim());
    }
  };

  // For each item in styleMap, define a getter and setter on the style
  // property.
  for (let jsName in styleMap) {
    (function (cssName) {
      Style.prototype.__defineGetter__(jsName, function () {
        return this.getStyle(cssName);
      });
      Style.prototype.__defineSetter__(jsName, function (value) {
        this.setStyle(cssName, value);
      });
    }) (styleMap[jsName]);
  }

  let JSDOMParser = function () {
    this.currentChar = 0;

    // In makeElementNode() we build up many strings one char at a time. Using
    // += for this results in lots of short-lived intermediate strings. It's
    // better to build an array of single-char strings and then join() them
    // together at the end. And reusing a single array (i.e. |this.strBuf|)
    // over and over for this purpose uses less memory than using a new array
    // for each string.
    this.strBuf = [];

    // Similarly, we reuse this array to return the two arguments from
    // makeElementNode(), which saves us from having to allocate a new array
    // every time.
    this.retPair = [];
  };

  JSDOMParser.prototype = {
    /**
     * Look at the next character without advancing the index.
     */
    peekNext: function () {
      return this.html[this.currentChar];
    },

    /**
     * Get the next character and advance the index.
     */
    nextChar: function () {
      return this.html[this.currentChar++];
    },

    /**
     * Called after a quote character is read. This finds the next quote
     * character and returns the text string in between.
     */
    readString: function (quote) {
      let str;
      let n = this.html.indexOf(quote, this.currentChar);
      if (n === -1) {
        this.currentChar = this.html.length;
        str = null;
      } else {
        str = this.html.substring(this.currentChar, n);
        this.currentChar = n + 1;
      }

      return str;
    },

    /**
     * Called when parsing a node. This finds the next name/value attribute
     * pair and adds the result to the attributes list.
     */
    readAttribute: function (node) {
      let name = "";

      let n = this.html.indexOf("=", this.currentChar);
      if (n === -1) {
        this.currentChar = this.html.length;
      } else {
        // Read until a '=' character is hit; this will be the attribute key
        name = this.html.substring(this.currentChar, n);
        this.currentChar = n + 1;
      }

      if (!name)
        return;

      // After a '=', we should see a '"' for the attribute value
      let c = this.nextChar();
      if (c !== '"' && c !== "'") {
        error("expecting '\"'");
        return;
      }

      // Read the attribute value (and consume the matching quote)
      let value = this.readString(c);

      if (!value)
        return;

      node.attributes.push(new Attribute(name, value));

      return;
    },

    /**
     * Parses and returns an Element node. This is called after a '<' has been
     * read.
     *
     * @returns an array; the first index of the array is the parsed node;
     *          the second index is a boolean indicating whether this is a void
     *          Element
     */
    makeElementNode: function (retPair) {
      let c = this.nextChar();

      // Read the Element tag name
      let strBuf = this.strBuf;
      strBuf.length = 0;
      while (c !== " " && c !== ">" && c !== "/") {
        if (c === undefined)
          return false;
        strBuf.push(c);
        c = this.nextChar();
      }
      let tag = strBuf.join('');

      if (!tag)
        return false;

      let node = new Element(tag);

      // Read Element attributes
      while (c !== "/" && c !== ">") {
        if (c === undefined)
          return false;
        while (this.match(" "));
        c = this.nextChar();
        if (c !== "/" && c !== ">") {
          --this.currentChar;
          this.readAttribute(node);
        }
      }

      // If this is a self-closing tag, read '/>'
      let closed = tag in voidElems;
      if (c === "/") {
        closed = true;
        c = this.nextChar();
        if (c !== ">") {
          error("expected '>'");
          return false;
        }
      }

      retPair[0] = node;
      retPair[1] = closed;
      return true
    },

    /**
     * If the current input matches this string, advance the input index;
     * otherwise, do nothing.
     *
     * @returns whether input matched string
     */
    match: function (str) {
      let strlen = str.length;
      if (this.html.substr(this.currentChar, strlen) === str) {
        this.currentChar += strlen;
        return true;
      }
      return false;
    },

    /**
     * Searches the input until a string is found and discards all input up to
     * and including the matched string.
     */
    discardTo: function (str) {
      let index = this.html.indexOf(str, this.currentChar) + str.length;
      if (index === -1)
        this.currentChar = this.html.length;
      this.currentChar = index;
    },

    /**
     * Reads child nodes for the given node.
     */
    readChildren: function (node) {
      let child;
      while ((child = this.readNode())) {
        // Don't keep Comment nodes
        if (child.nodeType !== 8) {
          node.childNodes.push(child);
          child.parentNode = node;
        }
      }
    },

    /**
     * Reads the next child node from the input. If we're reading a closing
     * tag, or if we've reached the end of input, return null.
     *
     * @returns the node
     */
    readNode: function () {
      let c = this.nextChar();
 
      if (c === undefined)
        return null;

      // Read any text as Text node
      if (c !== "<") {
        --this.currentChar;
        let node = new Text();
        let n = this.html.indexOf("<", this.currentChar);
        if (n === -1) {
          node.textContent = this.html.substring(this.currentChar, this.html.length);
          this.currentChar = this.html.length;
        } else {
          node.textContent = this.html.substring(this.currentChar, n);
          this.currentChar = n;
        }
        return node;
      }

      c = this.peekNext();

      // Read Comment node. Normally, Comment nodes know their inner
      // textContent, but we don't really care about Comment nodes (we throw
      // them away in readChildren()). So just returning an empty Comment node
      // here is sufficient.
      if (c === "!" || c === "?") {
        this.currentChar++;
        if (this.match("--")) {
          this.discardTo("-->");
        } else {
          let c = this.nextChar();
          while (c !== ">") {
            if (c === undefined)
              return null;
            if (c === '"' || c === "'")
              this.readString(c);
            c = this.nextChar();
          }
        }
        return new Comment();
      }

      // If we're reading a closing tag, return null. This means we've reached
      // the end of this set of child nodes.
      if (c === "/") {
        --this.currentChar;
        return null;
      }

      // Otherwise, we're looking at an Element node
      let result = this.makeElementNode(this.retPair);
      if (!result)
        return null;

      let node = this.retPair[0];
      let closed = this.retPair[1];
      let localName = node.localName;

      // If this isn't a void Element, read its child nodes
      if (!closed) {
        this.readChildren(node);
        let closingTag = "</" + localName + ">";
        if (!this.match(closingTag)) {
          error("expected '" + closingTag + "'");
          return null;
        }
      }

      if (localName === "title") {
        this.doc.title = node.textContent.trim();
      } else if (localName === "head") {
        this.doc.head = node;
      } else if (localName === "body") {
        this.doc.body = node;
      } else if (localName === "html") {
        this.doc.documentElement = node;
      }

      return node;
    },

    /**
     * Parses an HTML string and returns a JS implementation of the Document.
     */
    parse: function (html) {
      this.html = html;
      let doc = this.doc = new Document();
      this.readChildren(doc);

      // If this is an HTML document, remove root-level children except for the
      // <html> node
      if (doc.documentElement) {
        for (let i = doc.childNodes.length; --i >= 0;) {
          let child = doc.childNodes[i];
          if (child !== doc.documentElement) {
            doc.removeChild(child);
          }
        }
      }

      return doc;
    }
  };

  // Attach the standard DOM types to the global scope
  global.Node = Node;
  global.Comment = Comment;
  global.Document = Document;
  global.Element = Element;
  global.Text = Text;

  // Attach JSDOMParser to the global scope
  global.JSDOMParser = JSDOMParser;

}) (this);
