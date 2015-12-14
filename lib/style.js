
var helpers = require('./helpers');

// When a style is set in JS, map it to the corresponding CSS attribute
var styleMap = {
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

var Style = function (node) {
	this.node = node;
};

// getStyle() and setStyle() use the style attribute string directly. This
// won't be very efficient if there are a lot of style manipulations, but
// it's the easiest way to make sure the style attribute string and the JS
// style property stay in sync. Readability.js doesn't do many style
// manipulations, so this should be okay.
Style.prototype = {
	getStyle: function (styleName) {
		var attr = this.node.getAttribute("style");
		if (!attr)
			return undefined;

		var styles = attr.split(";");
		for (var i = 0; i < styles.length; i++) {
			var style = styles[i].split(":");
			var name = style[0].trim();
			if (name === styleName)
				return style[1].trim();
		}

		return undefined;
	},

	setStyle: function (styleName, styleValue) {
		var value = this.node.getAttribute("style") || "";
		var index = 0;
		do {
			var next = value.indexOf(";", index) + 1;
			var length = next - index - 1;
			var style = (length > 0 ? value.substr(index, length) : value.substr(index));
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
for (var jsName in styleMap) {
	(function (cssName) {
		Style.prototype.__defineGetter__(jsName, function () {
			return this.getStyle(cssName);
		});
		Style.prototype.__defineSetter__(jsName, function (value) {
			this.setStyle(cssName, value);
		});
	}) (styleMap[jsName]);
}

module.exports = Style;