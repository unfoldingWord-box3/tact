var XRegExp = require('xregexp');

var unicodePunctuation = XRegExp("\\s*\\p{P}+\\s*", 'g');

var segment = function(string) {
  return string.split(unicodePunctuation);
};
exports.segment = segment;
