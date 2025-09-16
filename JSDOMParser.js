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
  // XML only defines these and the numeric ones:

  var entityTable = {
    lt: "<",
    gt: ">",
    amp: "&",
    quot: '"',
    apos: "'",
  };

  var reverseEntityTable = {
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;",
  };

  function encodeTextContentHTML(s) {
    return s.replace(/[&<>]/g, function (x) {
      return reverseEntityTable[x];
    });
  }

  function encodeHTML(s) {
    return s.replace(/[&<>'"]/g, function (x) {
      return reverseEntityTable[x];
    });
  }

  function decodeHTML(str) {
    return str
      .replace(/&(quot|amp|apos|lt|gt);/g, function (match, tag) {
        return entityTable[tag];
      })
      .replace(/&#(?:x([0-9a-f]+)|([0-9]+));/gi, function (match, hex, numStr) {
        var num = parseInt(hex || numStr, hex ? 16 : 10);

        // these character references are replaced by a conforming HTML parser
        if (num == 0 || num > 0x10ffff || (num >= 0xd800 && num <= 0xdfff)) {
          num = 0xfffd;
        }

        return String.fromCodePoint(num);
      });
  }

  // When a style is set in JS, map it to the corresponding CSS attribute
  var styleMap = {
    alignmentBaseline: "alignment-baseline",
    background: "background",
    backgroundAttachment: "background-attachment",
    backgroundClip: "background-clip",
    backgroundColor: "background-color",
    backgroundImage: "background-image",
    backgroundOrigin: "background-origin",
    backgroundPosition: "background-position",
    backgroundPositionX: "background-position-x",
    backgroundPositionY: "background-position-y",
    backgroundRepeat: "background-repeat",
    backgroundRepeatX: "background-repeat-x",
    backgroundRepeatY: "background-repeat-y",
    backgroundSize: "background-size",
    baselineShift: "baseline-shift",
    border: "border",
    borderBottom: "border-bottom",
    borderBottomColor: "border-bottom-color",
    borderBottomLeftRadius: "border-bottom-left-radius",
    borderBottomRightRadius: "border-bottom-right-radius",
    borderBottomStyle: "border-bottom-style",
    borderBottomWidth: "border-bottom-width",
    borderCollapse: "border-collapse",
    borderColor: "border-color",
    borderImage: "border-image",
    borderImageOutset: "border-image-outset",
    borderImageRepeat: "border-image-repeat",
    borderImageSlice: "border-image-slice",
    borderImageSource: "border-image-source",
    borderImageWidth: "border-image-width",
    borderLeft: "border-left",
    borderLeftColor: "border-left-color",
    borderLeftStyle: "border-left-style",
    borderLeftWidth: "border-left-width",
    borderRadius: "border-radius",
    borderRight: "border-right",
    borderRightColor: "border-right-color",
    borderRightStyle: "border-right-style",
    borderRightWidth: "border-right-width",
    borderSpacing: "border-spacing",
    borderStyle: "border-style",
    borderTop: "border-top",
    borderTopColor: "border-top-color",
    borderTopLeftRadius: "border-top-left-radius",
    borderTopRightRadius: "border-top-right-radius",
    borderTopStyle: "border-top-style",
    borderTopWidth: "border-top-width",
    borderWidth: "border-width",
    bottom: "bottom",
    boxShadow: "box-shadow",
    boxSizing: "box-sizing",
    captionSide: "caption-side",
    clear: "clear",
    clip: "clip",
    clipPath: "clip-path",
    clipRule: "clip-rule",
    color: "color",
    colorInterpolation: "color-interpolation",
    colorInterpolationFilters: "color-interpolation-filters",
    colorProfile: "color-profile",
    colorRendering: "color-rendering",
    content: "content",
    counterIncrement: "counter-increment",
    counterReset: "counter-reset",
    cursor: "cursor",
    direction: "direction",
    display: "display",
    dominantBaseline: "dominant-baseline",
    emptyCells: "empty-cells",
    enableBackground: "enable-background",
    fill: "fill",
    fillOpacity: "fill-opacity",
    fillRule: "fill-rule",
    filter: "filter",
    cssFloat: "float",
    floodColor: "flood-color",
    floodOpacity: "flood-opacity",
    font: "font",
    fontFamily: "font-family",
    fontSize: "font-size",
    fontStretch: "font-stretch",
    fontStyle: "font-style",
    fontVariant: "font-variant",
    fontWeight: "font-weight",
    glyphOrientationHorizontal: "glyph-orientation-horizontal",
    glyphOrientationVertical: "glyph-orientation-vertical",
    height: "height",
    imageRendering: "image-rendering",
    kerning: "kerning",
    left: "left",
    letterSpacing: "letter-spacing",
    lightingColor: "lighting-color",
    lineHeight: "line-height",
    listStyle: "list-style",
    listStyleImage: "list-style-image",
    listStylePosition: "list-style-position",
    listStyleType: "list-style-type",
    margin: "margin",
    marginBottom: "margin-bottom",
    marginLeft: "margin-left",
    marginRight: "margin-right",
    marginTop: "margin-top",
    marker: "marker",
    markerEnd: "marker-end",
    markerMid: "marker-mid",
    markerStart: "marker-start",
    mask: "mask",
    maxHeight: "max-height",
    maxWidth: "max-width",
    minHeight: "min-height",
    minWidth: "min-width",
    opacity: "opacity",
    orphans: "orphans",
    outline: "outline",
    outlineColor: "outline-color",
    outlineOffset: "outline-offset",
    outlineStyle: "outline-style",
    outlineWidth: "outline-width",
    overflow: "overflow",
    overflowX: "overflow-x",
    overflowY: "overflow-y",
    padding: "padding",
    paddingBottom: "padding-bottom",
    paddingLeft: "padding-left",
    paddingRight: "padding-right",
    paddingTop: "padding-top",
    page: "page",
    pageBreakAfter: "page-break-after",
    pageBreakBefore: "page-break-before",
    pageBreakInside: "page-break-inside",
    pointerEvents: "pointer-events",
    position: "position",
    quotes: "quotes",
    resize: "resize",
    right: "right",
    shapeRendering: "shape-rendering",
    size: "size",
    speak: "speak",
    src: "src",
    stopColor: "stop-color",
    stopOpacity: "stop-opacity",
    stroke: "stroke",
    strokeDasharray: "stroke-dasharray",
    strokeDashoffset: "stroke-dashoffset",
    strokeLinecap: "stroke-linecap",
    strokeLinejoin: "stroke-linejoin",
    strokeMiterlimit: "stroke-miterlimit",
    strokeOpacity: "stroke-opacity",
    strokeWidth: "stroke-width",
    tableLayout: "table-layout",
    textAlign: "text-align",
    textAnchor: "text-anchor",
    textDecoration: "text-decoration",
    textIndent: "text-indent",
    textLineThrough: "text-line-through",
    textLineThroughColor: "text-line-through-color",
    textLineThroughMode: "text-line-through-mode",
    textLineThroughStyle: "text-line-through-style",
    textLineThroughWidth: "text-line-through-width",
    textOverflow: "text-overflow",
    textOverline: "text-overline",
    textOverlineColor: "text-overline-color",
    textOverlineMode: "text-overline-mode",
    textOverlineStyle: "text-overline-style",
    textOverlineWidth: "text-overline-width",
    textRendering: "text-rendering",
    textShadow: "text-shadow",
    textTransform: "text-transform",
    textUnderline: "text-underline",
    textUnderlineColor: "text-underline-color",
    textUnderlineMode: "text-underline-mode",
    textUnderlineStyle: "text-underline-style",
    textUnderlineWidth: "text-underline-width",
    top: "top",
    unicodeBidi: "unicode-bidi",
    unicodeRange: "unicode-range",
    vectorEffect: "vector-effect",
    verticalAlign: "vertical-align",
    visibility: "visibility",
    whiteSpace: "white-space",
    widows: "widows",
    width: "width",
    wordBreak: "word-break",
    wordSpacing: "word-spacing",
    wordWrap: "word-wrap",
    writingMode: "writing-mode",
    zIndex: "z-index",
    zoom: "zoom",
  };

  // Elements that can be self-closing
  var voidElems = {
    area: true,
    base: true,
    br: true,
    col: true,
    command: true,
    embed: true,
    hr: true,
    img: true,
    input: true,
    link: true,
    meta: true,
    param: true,
    source: true,
    wbr: true,
  };

  var whitespace = [" ", "\t", "\n", "\r"];

  // See https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
  var nodeTypes = {
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
    NOTATION_NODE: 12,
  };

  function getElementsByTagName(tag) {
    tag = tag.toUpperCase();
    var elems = [];
    var allTags = tag === "*";
    function getElems(node) {
      var length = node.children.length;
      for (var i = 0; i < length; i++) {
        var child = node.children[i];
        if (allTags || child.tagName === tag) {
          elems.push(child);
        }
        getElems(child);
      }
    }
    getElems(this);
    elems._isLiveNodeList = true;
    return elems;
  }

  var Node = function () {};

  Node.prototype = {
    attributes: null,
    childNodes: null,
    localName: null,
    nodeName: null,
    parentNode: null,
    textContent: null,
    nextSibling: null,
    previousSibling: null,

    get firstChild() {
      return this.childNodes[0] || null;
    },

    get firstElementChild() {
      return this.children[0] || null;
    },

    get lastChild() {
      return this.childNodes[this.childNodes.length - 1] || null;
    },

    get lastElementChild() {
      return this.children[this.children.length - 1] || null;
    },

    /**
     * The workhorse for all node insertion operations. The public methods
     * (`appendChild()`, `insertBefore()`, `replaceChild()`) are thin wrappers
     * around this.
     *
     * @private
     * @param {Node[]} nodes - An array of nodes to insert. It is assumed that
     *   these nodes are distinct, and are not children of this object.
     * @param {Number} index - A valid index to insert `nodes` at, or -1 to
     *   indicate insertion as the last children.
     * @returns {void}
     */
    _insertNodesAtIndex(nodes, index) {
      if (!nodes.length) {
        return;
      }

      // Detach nodes from their previous parents.
      for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].parentNode) {
          nodes[i].remove();
        }
      }

      var afterSibling = index === -1 ? null : this.childNodes[index];

      // Store the previous sibling before we modify the DOM.
      var prevSibling = afterSibling
        ? afterSibling.previousSibling
        : this.lastChild;

      // Insert nodes into childNodes.
      var insertionPoint = index === -1 ? this.childNodes.length : index;
      Array.prototype.splice.apply(
        this.childNodes,
        [insertionPoint, 0].concat(nodes)
      );

      // Update parentNode and sibling pointers for the new nodes.
      for (var j = 0; j < nodes.length; j++) {
        var node = nodes[j];
        node.parentNode = this;
        node.previousSibling = prevSibling;
        if (prevSibling) {
          prevSibling.nextSibling = node;
        }
        prevSibling = node;
      }
      var lastInsertedNode = nodes[nodes.length - 1];
      lastInsertedNode.nextSibling = afterSibling;
      if (afterSibling) {
        afterSibling.previousSibling = lastInsertedNode;
      }

      // Filter for element nodes and update children array and pointers.
      var elementsToInsert = [];
      for (var k = 0; k < nodes.length; k++) {
        if (nodes[k].nodeType === Node.ELEMENT_NODE) {
          elementsToInsert.push(nodes[k]);
        }
      }

      if (elementsToInsert.length) {
        // Find the next element sibling to use as an insertion reference.
        // This is done after `childNodes` is modified, as the forward
        // traversal from `afterSibling` remains valid.
        var afterElem = afterSibling;
        while (afterElem && afterElem.nodeType !== Node.ELEMENT_NODE) {
          afterElem = afterElem.nextSibling;
        }

        // Store the previous element sibling before more DOM modifications.
        var prevElem = afterElem
          ? afterElem.previousElementSibling
          : this.lastElementChild;

        var afterElemIndex = afterElem ? this.children.indexOf(afterElem) : -1;
        var elemInsertionPoint =
          afterElemIndex === -1 ? this.children.length : afterElemIndex;
        Array.prototype.splice.apply(
          this.children,
          [elemInsertionPoint, 0].concat(elementsToInsert)
        );

        for (var l = 0; l < elementsToInsert.length; l++) {
          var elem = elementsToInsert[l];
          elem.previousElementSibling = prevElem;
          if (prevElem) {
            prevElem.nextElementSibling = elem;
          }
          prevElem = elem;
        }
        var lastInsertedElem = elementsToInsert[elementsToInsert.length - 1];
        lastInsertedElem.nextElementSibling = afterElem;
        if (afterElem) {
          afterElem.previousElementSibling = lastInsertedElem;
        }
      }
    },

    appendChild(child) {
      var nodes =
        child.nodeType === Node.DOCUMENT_FRAGMENT_NODE
          ? Array.from(child.childNodes)
          : [child];
      this._insertNodesAtIndex(nodes, -1);
      return child;
    },

    insertBefore(newNode, referenceNode) {
      if (newNode === referenceNode) {
        return newNode;
      }
      var nodes =
        newNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE
          ? Array.from(newNode.childNodes)
          : [newNode];
      var index = referenceNode ? this.childNodes.indexOf(referenceNode) : -1;
      if (referenceNode && index === -1) {
        throw new Error("insertBefore: reference node not found");
      }
      this._insertNodesAtIndex(nodes, index);
      return newNode;
    },

    remove() {
      let parent = this.parentNode;
      if (!parent) {
        // We were already detached so there's nothing to do.
        return this;
      }
      var childNodes = parent.childNodes;
      var childIndex = childNodes.indexOf(this);
      if (childIndex === -1) {
        throw new Error("removeChild: node not found");
      }
      this.parentNode = null;
      var prev = this.previousSibling;
      var next = this.nextSibling;
      if (prev) {
        prev.nextSibling = next;
      }
      if (next) {
        next.previousSibling = prev;
      }
      childNodes.splice(childIndex, 1);

      if (this.nodeType === Node.ELEMENT_NODE) {
        var prevElem = this.previousElementSibling;
        var nextElem = this.nextElementSibling;
        if (prevElem) {
          prevElem.nextElementSibling = nextElem;
        }
        if (nextElem) {
          nextElem.previousElementSibling = prevElem;
        }
        parent.children.splice(parent.children.indexOf(this), 1);
        this.previousElementSibling = this.nextElementSibling = null;
      }

      this.previousSibling = this.nextSibling = null;

      return this;
    },

    removeChild(child) {
      return child.remove();
    },

    replaceChild(newNode, oldNode) {
      if (newNode === oldNode) {
        return oldNode;
      }
      if (oldNode.parentNode !== this) {
        throw new Error(
          "replaceChild: node to be replaced is not a child of this node"
        );
      }
      // Insert the new node(s) before the node to be replaced.
      this.insertBefore(newNode, oldNode);
      // Now, remove the old node.
      oldNode.remove();
      return oldNode;
    },

    __JSDOMParser__: true,
  };

  for (var nodeType in nodeTypes) {
    Node[nodeType] = Node.prototype[nodeType] = nodeTypes[nodeType];
  }

  var Attribute = function (name, value) {
    this.name = name;
    this._value = value;
  };

  Attribute.prototype = {
    get value() {
      return this._value;
    },
    setValue(newValue) {
      this._value = newValue;
    },
    getEncodedValue() {
      return encodeHTML(this._value);
    },
    // Cheat horribly. This is fine for our usecases.
    cloneNode() {
      return this;
    },
  };

  var Comment = function () {
    this.childNodes = [];
  };

  Comment.prototype = {
    __proto__: Node.prototype,

    nodeName: "#comment",
    nodeType: Node.COMMENT_NODE,
  };

  var DocumentFragment = function () {
    this.childNodes = [];
    this.children = [];
  };

  DocumentFragment.prototype = {
    __proto__: Node.prototype,
    nodeName: "#document-fragment",
    nodeType: Node.DOCUMENT_FRAGMENT_NODE,
  };

  var Text = function () {
    this.childNodes = [];
  };

  Text.prototype = {
    __proto__: Node.prototype,

    nodeName: "#text",
    nodeType: Node.TEXT_NODE,
    get textContent() {
      if (typeof this._textContent === "undefined") {
        this._textContent = decodeHTML(this._innerHTML || "");
      }
      return this._textContent;
    },
    get innerHTML() {
      if (typeof this._innerHTML === "undefined") {
        this._innerHTML = encodeTextContentHTML(this._textContent || "");
      }
      return this._innerHTML;
    },

    set innerHTML(newHTML) {
      this._innerHTML = newHTML;
      delete this._textContent;
    },
    set textContent(newText) {
      this._textContent = newText;
      delete this._innerHTML;
    },
  };

  var Document = function (url) {
    this.documentURI = url;
    this.styleSheets = [];
    this.childNodes = [];
    this.children = [];
  };

  Document.prototype = {
    __proto__: Node.prototype,

    nodeName: "#document",
    nodeType: Node.DOCUMENT_NODE,
    title: "",

    getElementsByTagName,

    getElementById(id) {
      function getElem(node) {
        var length = node.children.length;
        if (node.id === id) {
          return node;
        }
        for (var i = 0; i < length; i++) {
          var el = getElem(node.children[i]);
          if (el) {
            return el;
          }
        }
        return null;
      }
      return getElem(this);
    },

    createElement(tag) {
      var node = new Element(tag);
      return node;
    },

    createTextNode(text) {
      var node = new Text();
      node.textContent = text;
      return node;
    },

    createDocumentFragment() {
      return new DocumentFragment();
    },

    get baseURI() {
      if (!this.hasOwnProperty("_baseURI")) {
        this._baseURI = this.documentURI;
        var baseElements = this.getElementsByTagName("base");
        var href = baseElements[0] && baseElements[0].getAttribute("href");
        if (href) {
          try {
            this._baseURI = new URL(href, this._baseURI).href;
          } catch (ex) {
            /* Just fall back to documentURI */
          }
        }
      }
      return this._baseURI;
    },
  };

  var Element = function (tag) {
    // We use this to find the closing tag.
    this._matchingTag = tag;
    // We're explicitly a non-namespace aware parser, we just pretend it's all HTML.
    var lastColonIndex = tag.lastIndexOf(":");
    if (lastColonIndex != -1) {
      tag = tag.substring(lastColonIndex + 1);
    }
    this.attributes = [];
    this.childNodes = [];
    this.children = [];
    this.nextElementSibling = this.previousElementSibling = null;
    this.localName = tag.toLowerCase();
    this.tagName = tag.toUpperCase();
    this.style = new Style(this);
  };

  Element.prototype = {
    __proto__: Node.prototype,

    nodeType: Node.ELEMENT_NODE,

    getElementsByTagName,

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

    get srcset() {
      return this.getAttribute("srcset") || "";
    },

    set srcset(str) {
      this.setAttribute("srcset", str);
    },

    get nodeName() {
      return this.tagName;
    },

    get innerHTML() {
      function getHTML(node) {
        var i = 0;
        for (i = 0; i < node.childNodes.length; i++) {
          var child = node.childNodes[i];
          if (child.localName) {
            arr.push("<" + child.localName);

            // serialize attribute list
            for (var j = 0; j < child.attributes.length; j++) {
              var attr = child.attributes[j];
              // the attribute value will be HTML escaped.
              var val = attr.getEncodedValue();
              var quote = !val.includes('"') ? '"' : "'";
              arr.push(" " + attr.name + "=" + quote + val + quote);
            }

            if (child.localName in voidElems && !child.childNodes.length) {
              // if this is a self-closing element, end it here
              arr.push("/>");
            } else {
              // otherwise, add its children
              arr.push(">");
              getHTML(child);
              arr.push("</" + child.localName + ">");
            }
          } else {
            // This is a text node, so asking for innerHTML won't recurse.
            arr.push(child.innerHTML);
          }
        }
      }

      // Using Array.join() avoids the overhead from lazy string concatenation.
      var arr = [];
      getHTML(this);
      return arr.join("");
    },

    set innerHTML(html) {
      var parser = new JSDOMParser();
      var node = parser.parse(html);
      var i;
      for (i = this.childNodes.length; --i >= 0; ) {
        this.childNodes[i].parentNode = null;
      }
      this.childNodes = node.childNodes;
      this.children = node.children;
      for (i = this.childNodes.length; --i >= 0; ) {
        this.childNodes[i].parentNode = this;
      }
    },

    set textContent(text) {
      // clear parentNodes for existing children
      for (var i = this.childNodes.length; --i >= 0; ) {
        this.childNodes[i].parentNode = null;
      }

      var node = new Text();
      this.childNodes = [node];
      this.children = [];
      node.textContent = text;
      node.parentNode = this;
    },

    get textContent() {
      function getText(node) {
        var nodes = node.childNodes;
        for (var i = 0; i < nodes.length; i++) {
          var child = nodes[i];
          if (child.nodeType === 3) {
            text.push(child.textContent);
          } else {
            getText(child);
          }
        }
      }

      // Using Array.join() avoids the overhead from lazy string concatenation.
      // See http://blog.cdleary.com/2012/01/string-representation-in-spidermonkey/#ropes
      var text = [];
      getText(this);
      return text.join("");
    },

    getAttribute(name) {
      for (var i = this.attributes.length; --i >= 0; ) {
        var attr = this.attributes[i];
        if (attr.name === name) {
          return attr.value;
        }
      }
      return undefined;
    },

    setAttribute(name, value) {
      for (var i = this.attributes.length; --i >= 0; ) {
        var attr = this.attributes[i];
        if (attr.name === name) {
          attr.setValue(value);
          return;
        }
      }
      this.attributes.push(new Attribute(name, value));
    },

    setAttributeNode(node) {
      this.setAttribute(node.name, node.value);
    },

    removeAttribute(name) {
      for (var i = this.attributes.length; --i >= 0; ) {
        var attr = this.attributes[i];
        if (attr.name === name) {
          this.attributes.splice(i, 1);
          break;
        }
      }
    },

    hasAttribute(name) {
      return this.attributes.some(function (attr) {
        return attr.name == name;
      });
    },
  };

  var Style = function (node) {
    this.node = node;
  };

  // getStyle() and setStyle() use the style attribute string directly. This
  // won't be very efficient if there are a lot of style manipulations, but
  // it's the easiest way to make sure the style attribute string and the JS
  // style property stay in sync. Readability.js doesn't do many style
  // manipulations, so this should be okay.
  Style.prototype = {
    getStyle(styleName) {
      var attr = this.node.getAttribute("style");
      if (!attr) {
        return undefined;
      }

      var styles = attr.split(";");
      for (var i = 0; i < styles.length; i++) {
        var style = styles[i].split(":");
        var name = style[0].trim();
        if (name === styleName) {
          return style[1].trim();
        }
      }

      return undefined;
    },

    setStyle(styleName, styleValue) {
      var value = this.node.getAttribute("style") || "";
      var index = 0;
      do {
        var next = value.indexOf(";", index) + 1;
        var length = next - index - 1;
        var style =
          length > 0 ? value.substr(index, length) : value.substr(index);
        if (style.substr(0, style.indexOf(":")).trim() === styleName) {
          value =
            value.substr(0, index).trim() +
            (next ? " " + value.substr(next).trim() : "");
          break;
        }
        index = next;
      } while (index);

      value += " " + styleName + ": " + styleValue + ";";
      this.node.setAttribute("style", value.trim());
    },
  };

  // For each item in styleMap, define a getter and setter on the style
  // property.
  for (var jsName in styleMap) {
    (function (cssName) {
      Style.prototype.__defineGetter__(jsName, function () {
        return this.getStyle(cssName);
      });
      Style.prototype.__defineSetter__(jsName, function (value) {
        this.setStyle(cssName, value);
      });
    })(styleMap[jsName]);
  }

  var JSDOMParser = function () {
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

    this.errorState = "";
  };

  JSDOMParser.prototype = {
    error(m) {
      if (typeof console !== "undefined") {
        // eslint-disable-next-line no-console
        console.log("JSDOMParser error: " + m + "\n");
      } else if (typeof dump !== "undefined") {
        /* global dump */
        dump("JSDOMParser error: " + m + "\n");
      }
      this.errorState += m + "\n";
    },

    /**
     * Look at the next character without advancing the index.
     */
    peekNext() {
      return this.html[this.currentChar];
    },

    /**
     * Get the next character and advance the index.
     */
    nextChar() {
      return this.html[this.currentChar++];
    },

    /**
     * Called after a quote character is read. This finds the next quote
     * character and returns the text string in between.
     */
    readString(quote) {
      var str;
      var n = this.html.indexOf(quote, this.currentChar);
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
    readAttribute(node) {
      var name = "";

      var n = this.html.indexOf("=", this.currentChar);
      if (n === -1) {
        this.currentChar = this.html.length;
      } else {
        // Read until a '=' character is hit; this will be the attribute key
        name = this.html.substring(this.currentChar, n);
        this.currentChar = n + 1;
      }

      if (!name) {
        return;
      }

      // After a '=', we should see a '"' for the attribute value
      var c = this.nextChar();
      if (c !== '"' && c !== "'") {
        this.error("Error reading attribute " + name + ", expecting '\"'");
        return;
      }

      // Read the attribute value (and consume the matching quote)
      var value = this.readString(c);

      node.attributes.push(new Attribute(name, decodeHTML(value)));
    },

    /**
     * Parses and returns an Element node. This is called after a '<' has been
     * read.
     *
     * @returns an array; the first index of the array is the parsed node;
     *          the second index is a boolean indicating whether this is a void
     *          Element
     */
    makeElementNode(retPair) {
      var c = this.nextChar();

      // Read the Element tag name
      var strBuf = this.strBuf;
      strBuf.length = 0;
      while (!whitespace.includes(c) && c !== ">" && c !== "/") {
        if (c === undefined) {
          return false;
        }
        strBuf.push(c);
        c = this.nextChar();
      }
      var tag = strBuf.join("");

      if (!tag) {
        return false;
      }

      var node = new Element(tag);

      // Read Element attributes
      while (c !== "/" && c !== ">") {
        if (c === undefined) {
          return false;
        }
        while (whitespace.includes(this.html[this.currentChar++])) {
          // Advance cursor to first non-whitespace char.
        }
        this.currentChar--;
        c = this.nextChar();
        if (c !== "/" && c !== ">") {
          --this.currentChar;
          this.readAttribute(node);
        }
      }

      // If this is a self-closing tag, read '/>'
      var closed = false;
      if (c === "/") {
        closed = true;
        c = this.nextChar();
        if (c !== ">") {
          this.error("expected '>' to close " + tag);
          return false;
        }
      }

      retPair[0] = node;
      retPair[1] = closed;
      return true;
    },

    /**
     * If the current input matches this string, advance the input index;
     * otherwise, do nothing.
     *
     * @returns whether input matched string
     */
    match(str) {
      var strlen = str.length;
      if (
        this.html.substr(this.currentChar, strlen).toLowerCase() ===
        str.toLowerCase()
      ) {
        this.currentChar += strlen;
        return true;
      }
      return false;
    },

    /**
     * Searches the input until a string is found and discards all input up to
     * and including the matched string.
     */
    discardTo(str) {
      var index = this.html.indexOf(str, this.currentChar) + str.length;
      if (index === -1) {
        this.currentChar = this.html.length;
      }
      this.currentChar = index;
    },

    /**
     * Reads child nodes for the given node.
     */
    readChildren(node) {
      var child;
      while ((child = this.readNode())) {
        // Don't keep Comment nodes
        if (child.nodeType !== 8) {
          node.appendChild(child);
        }
      }
    },

    discardNextComment() {
      if (this.match("--")) {
        this.discardTo("-->");
      } else {
        var c = this.nextChar();
        while (c !== ">") {
          if (c === undefined) {
            return null;
          }
          if (c === '"' || c === "'") {
            this.readString(c);
          }
          c = this.nextChar();
        }
      }
      return new Comment();
    },

    /**
     * Reads the next child node from the input. If we're reading a closing
     * tag, or if we've reached the end of input, return null.
     *
     * @returns the node
     */
    readNode() {
      var c = this.nextChar();

      if (c === undefined) {
        return null;
      }

      // Read any text as Text node
      var textNode;
      if (c !== "<") {
        --this.currentChar;
        textNode = new Text();
        var n = this.html.indexOf("<", this.currentChar);
        // We're not expecting XSS type exploitation inside JSDOMParser,
        // we just have to implement innerHTML stuff...
        /* eslint-disable no-unsanitized/property */
        if (n === -1) {
          textNode.innerHTML = this.html.substring(
            this.currentChar,
            this.html.length
          );
          this.currentChar = this.html.length;
        } else {
          textNode.innerHTML = this.html.substring(this.currentChar, n);
          this.currentChar = n;
        }
        /* eslint-enable no-unsanitized/property */
        return textNode;
      }

      if (this.match("![CDATA[")) {
        var endChar = this.html.indexOf("]]>", this.currentChar);
        if (endChar === -1) {
          this.error("unclosed CDATA section");
          return null;
        }
        textNode = new Text();
        textNode.textContent = this.html.substring(this.currentChar, endChar);
        this.currentChar = endChar + "]]>".length;
        return textNode;
      }

      c = this.peekNext();

      // Read Comment node. Normally, Comment nodes know their inner
      // textContent, but we don't really care about Comment nodes (we throw
      // them away in readChildren()). So just returning an empty Comment node
      // here is sufficient.
      if (c === "!" || c === "?") {
        // We're still before the ! or ? that is starting this comment:
        this.currentChar++;
        return this.discardNextComment();
      }

      // If we're reading a closing tag, return null. This means we've reached
      // the end of this set of child nodes.
      if (c === "/") {
        --this.currentChar;
        return null;
      }

      // Otherwise, we're looking at an Element node
      var result = this.makeElementNode(this.retPair);
      if (!result) {
        return null;
      }

      var node = this.retPair[0];
      var closed = this.retPair[1];
      var localName = node.localName;

      // If this isn't a void Element, read its child nodes
      if (!closed) {
        this.readChildren(node);
        var closingTag = "</" + node._matchingTag + ">";
        if (!this.match(closingTag)) {
          this.error(
            "expected '" +
              closingTag +
              "' and got " +
              this.html.substr(this.currentChar, closingTag.length)
          );
          return null;
        }
      }

      // Only use the first title, because SVG might have other
      // title elements which we don't care about (medium.com
      // does this, at least).
      if (localName === "title" && !this.doc.title) {
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
    parse(html, url) {
      this.html = html;
      var doc = (this.doc = new Document(url));
      this.readChildren(doc);

      // If this is an HTML document, remove root-level children except for the
      // <html> node
      if (doc.documentElement) {
        for (var i = doc.childNodes.length; --i >= 0; ) {
          var child = doc.childNodes[i];
          if (child !== doc.documentElement) {
            child.remove();
          }
        }
      }

      return doc;
    },
  };

  // Attach the standard DOM types to the global scope
  global.Node = Node;
  global.Comment = Comment;
  global.Document = Document;
  global.DocumentFragment = DocumentFragment;
  global.Element = Element;
  global.Text = Text;

  // Attach JSDOMParser to the global scope
  global.JSDOMParser = JSDOMParser;
})(this);

if (typeof module === "object") {
  /* eslint-disable-next-line no-redeclare */
  /* global module */
  module.exports = this.JSDOMParser;
}
