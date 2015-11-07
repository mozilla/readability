var Style = require('./style');
var Node = require('./node');
var JSDOMParser = require('./jsdomParser');
var Attribute = require('./attribute');

var helpers = require('./helpers');

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

module.exports = Element;