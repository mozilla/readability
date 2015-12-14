var helpers = require('./helpers');
var Node = require('./node');

var Text = function () {
	this.childNodes = [];
};

Text.prototype = {
	__proto__: Node.prototype,

	nodeName: "#text",
	nodeType: Node.TEXT_NODE,
	get textContent() {
		if (typeof this._textContent === "undefined") {
			this._textContent = helpers.decodeHTML(this._innerHTML || "");
		}
		return this._textContent;
	},
	get innerHTML() {
		if (typeof this._innerHTML === "undefined") {
			this._innerHTML = helpers.encodeTextContentHTML(this._textContent || "");
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
}

module.exports = Text;