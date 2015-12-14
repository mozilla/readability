var helpers = require('./helpers');
var Attribute = require('./attribute');
var Text = require('./text');
var Node = require('./node');
var Comment = require('./comment');
var Style = require('./style');

var Document = function () {
	this.styleSheets = [];
	this.childNodes = [];
	this.children = [];
};

Document.prototype = {
	__proto__: Node.prototype,

	nodeName: "#document",
	nodeType: Node.DOCUMENT_NODE,
	title: "",

	getElementsByTagName: helpers.getElementsByTagName,

	getElementById: function (id) {
		function getElem(node) {
			var length = node.children.length;
			if (node.id === id)
				return node;
			for (var i = 0; i < length; i++) {
				var el = getElem(node.children[i]);
				if (el)
					return el;
			}
			return null;
		}
		return getElem(this);
	},

	createElement: function (tag) {
		var node = new Element(tag);
		return node;
	},

	createTextNode: function (text) {
		var node = new Text();
		node.textContent = text;
		return node;
	},
};

var Element = function (tag) {
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

	getElementsByTagName: helpers.getElementsByTagName,

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
			var i = 0;
			for (i = 0; i < node.childNodes.length; i++) {
				var child = node.childNodes[i];
				if (child.localName) {
					arr.push("<" + child.localName);

					// serialize attribute list
					for (var j = 0; j < child.attributes.length; j++) {
						var attr = child.attributes[j];
						// the attribute value will be HTML escaped.
						var val = attr.value;
						var quote = (val.indexOf('"') === -1 ? '"' : "'");
						arr.push(" " + attr.name + '=' + quote + val + quote);
					}

					if (child.localName in helpers.voidElems) {
						// if this is a self-closing element, end it here
						arr.push(">");
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
		// See http://blog.cdleary.com/2012/01/string-representation-in-spidermonkey/#ropes
		var arr = [];
		getHTML(this);
		return arr.join("");
	},

	set innerHTML(html) {
		var parser = new JSDOMParser();
		var node = parser.parse(html);
		for (var i = this.childNodes.length; --i >= 0;) {
			this.childNodes[i].parentNode = null;
		}
		this.childNodes = node.childNodes;
		this.children = node.children;
		for (var i = this.childNodes.length; --i >= 0;) {
			this.childNodes[i].parentNode = this;
		}
	},

	set textContent(text) {
		// clear parentNodes for existing children
		for (var i = this.childNodes.length; --i >= 0;) {
			this.childNodes[i].parentNode = null;
		}

		var node = new Text();
		this.childNodes = [ node ];
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

	getAttribute: function (name) {
		for (var i = this.attributes.length; --i >= 0;) {
			var attr = this.attributes[i];
			if (attr.name === name)
				return attr.getDecodedValue();
		}
		return undefined;
	},

	setAttribute: function (name, value) {
		for (var i = this.attributes.length; --i >= 0;) {
			var attr = this.attributes[i];
			if (attr.name === name) {
				attr.setDecodedValue(value);
				return;
			}
		}
		this.attributes.push(new Attribute(name, helpers.encodeHTML(value)));
	},

	removeAttribute: function (name) {
		for (var i = this.attributes.length; --i >= 0;) {
			var attr = this.attributes[i];
			if (attr.name === name) {
				this.attributes.splice(i, 1);
				break;
			}
		}
	}
};

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
	readAttribute: function (node) {
		var name = "";

		var n = this.html.indexOf("=", this.currentChar);
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
		var c = this.nextChar();
		if (c !== '"' && c !== "'") {
			console.error("Error reading attribute " + name + ", expecting '\"'");
			return;
		}

		// Read the attribute value (and consume the matching quote)
		var value = this.readString(c);

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
		var c = this.nextChar();

		// Read the Element tag name
		var strBuf = this.strBuf;
		strBuf.length = 0;
		while (helpers.whitespace.indexOf(c) == -1 && c !== ">" && c !== "/") {
			if (c === undefined)
				return false;
			strBuf.push(c);
			c = this.nextChar();
		}
		var tag = strBuf.join('');

		if (!tag)
			return false;

		var node = new Element(tag);

		// Read Element attributes
		while (c !== "/" && c !== ">") {
			if (c === undefined)
				return false;
			while (helpers.whitespace.indexOf(this.html[this.currentChar++]) != -1);
			this.currentChar--;
			c = this.nextChar();
			if (c !== "/" && c !== ">") {
				--this.currentChar;
				this.readAttribute(node);
			}
		}

		// If this is a self-closing tag, read '/>'
		var closed = tag in helpers.voidElems;
		if (c === "/") {
			closed = true;
			c = this.nextChar();
			if (c !== ">") {
				console.error("expected '>' to close " + tag);
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
		var strlen = str.length;
		if (this.html.substr(this.currentChar, strlen).toLowerCase() === str.toLowerCase()) {
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
		var index = this.html.indexOf(str, this.currentChar) + str.length;
		if (index === -1)
			this.currentChar = this.html.length;
		this.currentChar = index;
	},

	/**
	 * Reads child nodes for the given node.
	 */
	readChildren: function (node) {
		var child;
		while ((child = this.readNode())) {
			// Don't keep Comment nodes
			if (child.nodeType !== 8) {
				node.appendChild(child);
			}
		}
	},

	readScript: function (node) {
		while (this.currentChar < this.html.length) {
			var c = this.nextChar();
			var nextC = this.peekNext();
			if (c === "<") {
				if (nextC === "!" || nextC === "?") {
					// We're still before the ! or ? that is starting this comment:
					this.currentChar++;
					node.appendChild(this.discardNextComment());
					continue;
				}
				if (nextC === "/" && this.html.substr(this.currentChar, 8 /*"/script>".length */).toLowerCase() == "/script>") {
					// Go back before the '<' so we find the end tag.
					this.currentChar--;
					// Done with this script tag, the caller will close:
					return;
				}
			}
			// Either c wasn't a '<' or it was but we couldn't find either a comment
			// or a closing script tag, so we should just parse as text until the next one
			// comes along:

			var haveTextNode = node.lastChild && node.lastChild.nodeType === Node.TEXT_NODE;
			var textNode = haveTextNode ? node.lastChild : new Text();
			var n = this.html.indexOf("<", this.currentChar);
			// Decrement this to include the current character *afterwards* so we don't get stuck
			// looking for the same < all the time.
			this.currentChar--;
			if (n === -1) {
				textNode.innerHTML += this.html.substring(this.currentChar, this.html.length);
				this.currentChar = this.html.length;
			} else {
				textNode.innerHTML += this.html.substring(this.currentChar, n);
				this.currentChar = n;
			}
			if (!haveTextNode)
				node.appendChild(textNode);
		}
	},

	discardNextComment: function() {
		if (this.match("--")) {
			this.discardTo("-->");
		} else {
			var c = this.nextChar();
			while (c !== ">") {
				if (c === undefined)
					return null;
				if (c === '"' || c === "'")
					this.readString(c);
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
	readNode: function () {
		var c = this.nextChar();

		if (c === undefined)
			return null;

		// Read any text as Text node
		if (c !== "<") {
			--this.currentChar;
			var node = new Text();
			var n = this.html.indexOf("<", this.currentChar);
			if (n === -1) {
				node.innerHTML = this.html.substring(this.currentChar, this.html.length);
				this.currentChar = this.html.length;
			} else {
				node.innerHTML = this.html.substring(this.currentChar, n);
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
		if (!result)
			return null;

		var node = this.retPair[0];
		var closed = this.retPair[1];
		var localName = node.localName;

		// If this isn't a void Element, read its child nodes
		if (!closed) {
			if (localName == "script") {
				this.readScript(node);
			} else {
				this.readChildren(node);
			}
			var closingTag = "</" + localName + ">";
			if (!this.match(closingTag)) {
				console.error("expected '" + closingTag + "'");
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
	parse: function (html) {
		this.html = html;
		var doc = this.doc = new Document();
		this.readChildren(doc);

		// If this is an HTML document, remove root-level children except for the
		// <html> node
		if (doc.documentElement) {
			for (var i = doc.childNodes.length; --i >= 0;) {
				var child = doc.childNodes[i];
				if (child !== doc.documentElement) {
					doc.removeChild(child);
				}
			}
		}

		return doc;
	}
};

module.exports = JSDOMParser;