var helpers = require('./helpers');
var Node = require('./node');
var Element = require('./element');
var Text = require('./text');

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

module.exports = Document;