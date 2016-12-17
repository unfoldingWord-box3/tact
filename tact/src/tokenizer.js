var XRegExp = require('xregexp');

var tokenizer = {
  tokens: {},
  nonUnicodeLetter: XRegExp('\\PL+?', 'g'), // var nonUnicodeLetter = XRegExp('[^\\pL]+');
  tokenize: function(string) {
    if (typeof string !== 'string') throw 'tokenizer.tokenize(string) string is not String: ' + string
    var tokenArray = tokenizer.tokens[string]
    if (tokenArray === undefined || tokenArray.length === 0) {
      tokenArray = [];
      var _tokens = string.split(tokenizer.nonUnicodeLetter)
      _tokens.forEach(function(token) {
        token.trim()
        if (token.length > 0) tokenArray.push(token)
      })
      tokenizer.tokens[string] = tokenArray
    }
    return tokenArray
  }
}
exports = module.exports = tokenizer
