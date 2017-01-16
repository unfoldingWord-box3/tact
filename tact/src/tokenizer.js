var XRegExp = require('xregexp');
var options = require('config').Client

var tokenizer = {
  tokens: {},
  nonUnicodeLetter: XRegExp('\\PL+?', 'g'), // var nonUnicodeLetter = XRegExp('[^\\pL]+');
  tokenizeSource: function(string) {
    return this.tokenize(string, options.global.tokenizer.source)
  },
  tokenizeTarget: function(string) {
    return this.tokenize(string, options.global.tokenizer.target)
  },
  tokenize: function(string, regexp) {
    if (typeof string !== 'string') throw 'tokenizer.tokenize() string is not String: ' + string
    if (typeof regexp !== 'string') throw 'tokenizer.tokenize() regexp is not String: ' + regexp
    var tokenArray = tokenizer.tokens[string]
    if (tokenArray === undefined || tokenArray.length === 0) {
      tokenArray = [];
      var xregexp = XRegExp(regexp, 'g')
      var _tokens = string.split(xregexp)
      _tokens.forEach(function(token) {
        token.trim()
        if (token.length > 0) tokenArray.push(token)
      })
      tokenizer.tokens[string] = tokenArray
    }
    return tokenArray.slice()
  }
}
exports = module.exports = tokenizer
