var XRegExp = require('xregexp')

function Tokenizer(options) {
  this.options = options
  if (options !== undefined) {
    this.sourceRegexp = options.global.tokenizer.source
    this.targetRegexp = options.global.tokenizer.target
  }
  this.tokens = {}
}

Tokenizer.prototype.tokenizeBySpace = function(string) {
  string = string.trim()
  if (string === '') return []
  return string.split(' ')
}

Tokenizer.prototype.tokenizeSource = function(string) {
  return this.tokenize(string, this.sourceRegexp)
}

Tokenizer.prototype.tokenizeTarget = function(string) {
  return this.tokenize(string, this.targetRegexp)
}

Tokenizer.prototype.tokenize = function(string, regexp) {
  if (typeof string !== 'string') throw 'tokenizer.tokenize() string is not String: ' + string
  if (typeof regexp[0] !== 'string') throw 'tokenizer.tokenize() regexp[0] is not String: ' + regexp
  var key = string + '-' + regexp.join('-')
  var tokenArray = this.tokens[key]
  if (tokenArray === undefined || tokenArray.length === 0) {
    tokenArray = [];
    var regexp = XRegExp(regexp[0], regexp[1])
    var _tokens = string.split(regexp)
    _tokens.forEach(function(token) {
      token.trim()
      if (token.length > 0) tokenArray.push(token)
    })
    this.tokens[key] = tokenArray
  }
  return tokenArray.slice()
}

exports = module.exports = Tokenizer
