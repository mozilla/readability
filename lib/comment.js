var Node = require('./node');

var Comment = function () {
	this.childNodes = [];
};

Comment.prototype = {
	__proto__: Node.prototype,
	nodeName: "#comment",
	nodeType: Node.COMMENT_NODE
};

module.exports = Comment;