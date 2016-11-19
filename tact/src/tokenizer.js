var XRegExp = require('xregexp');

var nonUnicodeLetter = XRegExp('\\PL+', 'g'); // var nonUnicodeLetter = XRegExp('[^\\pL]+');

var tokenize = function(string) {
  return string.split(nonUnicodeLetter);
};
exports.tokenize = tokenize;
