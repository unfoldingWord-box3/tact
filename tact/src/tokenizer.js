var XRegExp = require('xregexp');

var nonUnicodeLetter = XRegExp('\\PL+?', 'g'); // var nonUnicodeLetter = XRegExp('[^\\pL]+');

var tokenize = function(string) {
  var tokens = [];
  var _tokens = string.split(nonUnicodeLetter);
  _tokens.forEach(function(token) {
    token.trim();
    if (token.length > 0) {
      tokens.push(token);
    }
  })
  return tokens;
};
exports.tokenize = tokenize;
