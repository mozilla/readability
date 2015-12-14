
var entityTable = {
	"lt": "<",
	"gt": ">",
	"amp": "&",
	"quot": '"',
	"apos": "'",
};

var reverseEntityTable = {
	"<": "&lt;",
	">": "&gt;",
	"&": "&amp;",
	'"': "&quot;",
	"'": "&apos;",
};


exports.decodeHTML = function(str) {
	return str.replace(/&(quot|amp|apos|lt|gt);/g, function(match, tag) {
		return entityTable[tag];
	})
	.replace(/&#(?:x([0-9a-z]{1,4})|([0-9]{1,4}));/gi, function(match, hex, numStr) {
		var num = parseInt(hex || numStr, hex ? 16 : 10); // read num
		return String.fromCharCode(num);
	});
};

exports.encodeHTML = function(s) {
	return s.replace(/[&<>'"]/g, function(x) {
		return reverseEntityTable[x];
	});
};

exports.encodeTextContentHTML = function(s) {
	return s.replace(/[&<>]/g, function(x) {
		return reverseEntityTable[x];
	});
};

exports.getElementsByTagName = function(tag) {
	tag = tag.toUpperCase();
	var elems = [];
	var allTags = (tag === "*");
	
	function getElems(node) {
		var length = node.children.length;
		for (var i = 0; i < length; i++) {
			var child = node.children[i];
			if (allTags || (child.tagName === tag))
				elems.push(child);
			getElems(child);
		}
	}

	getElems(this);
	return elems;
};

// Elements that can be self-closing
exports.voidElems = {
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
	"wbr": true
};

exports.whitespace = [" ", "\t", "\n", "\r"];