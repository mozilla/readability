// See http://www.w3schools.com/dom/dom_nodetype.asp
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
	NOTATION_NODE: 12
};

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

	appendChild: function (child) {
		if (child.parentNode) {
			child.parentNode.removeChild(child);
		}

		var last = this.lastChild;
		if (last)
			last.nextSibling = child;
		child.previousSibling = last;

		if (child.nodeType === Node.ELEMENT_NODE) {
			child.previousElementSibling = this.children[this.children.length - 1] || null;
			this.children.push(child);
			child.previousElementSibling && (child.previousElementSibling.nextElementSibling = child);
		}
		this.childNodes.push(child);
		child.parentNode = this;
	},

	removeChild: function (child) {
		var childNodes = this.childNodes;
		var childIndex = childNodes.indexOf(child);
		if (childIndex === -1) {
			throw "removeChild: node not found";
		} else {
			child.parentNode = null;
			var prev = child.previousSibling;
			var next = child.nextSibling;
			if (prev)
				prev.nextSibling = next;
			if (next)
				next.previousSibling = prev;

			if (child.nodeType === Node.ELEMENT_NODE) {
				prev = child.previousElementSibling;
				next = child.nextElementSibling;
				if (prev)
					prev.nextElementSibling = next;
				if (next)
					next.previousElementSibling = prev;
				this.children.splice(this.children.indexOf(child), 1);
			}

			child.previousSibling = child.nextSibling = null;
			child.previousElementSibling = child.nextElementSibling = null;

			return childNodes.splice(childIndex, 1)[0];
		}
	},

	replaceChild: function (newNode, oldNode) {
		var childNodes = this.childNodes;
		var childIndex = childNodes.indexOf(oldNode);
		if (childIndex === -1) {
			throw "replaceChild: node not found";
		} else {
			// This will take care of updating the new node if it was somewhere else before:
			if (newNode.parentNode)
				newNode.parentNode.removeChild(newNode);

			childNodes[childIndex] = newNode;

			// update the new node's sibling properties, and its new siblings' sibling properties
			newNode.nextSibling = oldNode.nextSibling;
			newNode.previousSibling = oldNode.previousSibling;
			if (newNode.nextSibling)
				newNode.nextSibling.previousSibling = newNode;
			if (newNode.previousSibling)
				newNode.previousSibling.nextSibling = newNode;

			newNode.parentNode = this;

			// Now deal with elements before we clear out those values for the old node,
			// because it can help us take shortcuts here:
			if (newNode.nodeType === Node.ELEMENT_NODE) {
				if (oldNode.nodeType === Node.ELEMENT_NODE) {
					// Both were elements, which makes this easier, we just swap things out:
					newNode.previousElementSibling = oldNode.previousElementSibling;
					newNode.nextElementSibling = oldNode.nextElementSibling;
					if (newNode.previousElementSibling)
						newNode.previousElementSibling.nextElementSibling = newNode;
					if (newNode.nextElementSibling)
						newNode.nextElementSibling.previousElementSibling = newNode;
					this.children[this.children.indexOf(oldNode)] = newNode;
				} else {
					// Hard way:
					newNode.previousElementSibling = (function() {
						for (var i = childIndex - 1; i >= 0; i--) {
							if (childNodes[i].nodeType === Node.ELEMENT_NODE)
								return childNodes[i];
						}
						return null;
					})();
					if (newNode.previousElementSibling) {
						newNode.nextElementSibling = newNode.previousElementSibling.nextElementSibling;
					} else {
						newNode.nextElementSibling = (function() {
							for (var i = childIndex + 1; i < childNodes.length; i++) {
								if (childNodes[i].nodeType === Node.ELEMENT_NODE)
									return childNodes[i];
							}
							return null;
						})();
					}
					if (newNode.previousElementSibling)
						newNode.previousElementSibling.nextElementSibling = newNode;
					if (newNode.nextElementSibling)
						newNode.nextElementSibling.previousElementSibling = newNode;

					if (newNode.nextElementSibling)
						this.children.splice(this.children.indexOf(newNode.nextElementSibling), 0, newNode);
					else
						this.children.push(newNode);
				}
			} else {
				// new node is not an element node.
				// if the old one was, update its element siblings:
				if (oldNode.nodeType === Node.ELEMENT_NODE) {
					if (oldNode.previousElementSibling)
						oldNode.previousElementSibling.nextElementSibling = oldNode.nextElementSibling;
					if (oldNode.nextElementSibling)
						oldNode.nextElementSibling.previousElementSibling = oldNode.previousElementSibling;
					this.children.splice(this.children.indexOf(oldNode), 1);
				}
				// If the old node wasn't an element, neither the new nor the old node was an element,
				// and the children array and its members shouldn't need any updating.
			}


			oldNode.parentNode = null;
			oldNode.previousSibling = null;
			oldNode.nextSibling = null;
			if (oldNode.nodeType === Node.ELEMENT_NODE) {
				oldNode.previousElementSibling = null;
				oldNode.nextElementSibling = null;
			}
			return oldNode;
		}
	},

	__JSDOMParser__: true,
};

for (var i in nodeTypes) {
	Node[i] = Node.prototype[i] = nodeTypes[i];
}

module.exports = Node;