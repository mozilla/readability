var helpers = require('./helpers');

var Attribute = function (name, value) {
  this.name = name;
  this._value = value;
};

Attribute.prototype = {
  get value() {
    return this._value;
  },
  setValue: function(newValue) {
    this._value = newValue;
    delete this._decodedValue;
  },
  setDecodedValue: function(newValue) {
    this._value = helpers.encodeHTML(newValue);
    this._decodedValue = newValue;
  },
  getDecodedValue: function() {
    if (typeof this._decodedValue === "undefined") {
      this._decodedValue = (this._value && helpers.decodeHTML(this._value)) || "";
    }
    return this._decodedValue;
  },
};

module.exports = Attribute;
