var tokenizer = require('./tokenizer.js')
var options = require('config').Client

var ngram = {
  ngrams: {},
  ngramSource: function(string) {
    return this.ngram(string, options.global.ngram.source, options.global.tokenizer.source)
  },
  ngramTarget: function(string) {
    return this.ngram(string, options.global.ngram.target, options.global.tokenizer.target)
  },
  ngram: function(string, n, regexpTokenizer) {
    if (typeof string !== 'string') throw 'ngram.ngram(string) string is not String: ' + string
    var key = regexpTokenizer + n + string
    var ngramArray = this.ngrams[key]
    if (ngramArray === undefined) {
      ngramArray = []
      var i
      for (i=1; i < n+1; i++) {
        var tokens = tokenizer.tokenize(string, regexpTokenizer)
        var _ngrams = ngram._ngram(tokens, i)
        _ngrams.forEach(function(_ngramArray, _i) {
          var ngramString = _ngramArray.join(' ')
          if (ngramArray.indexOf(ngramString) == -1) {
            ngramArray.push(ngramString)
          }
        })
      }
      this.ngrams[key] = ngramArray
    }
    return ngramArray.slice()
  },

  _ngram: function(array, length) {
    var ngramsArray = []
    for (var i = 0; i < array.length - (length - 1); i++) {
      var subNgramsArray = []
      for (var j = 0; j < length; j++) {
        subNgramsArray.push(array[i + j])
      }
      ngramsArray.push(subNgramsArray)
    }
    return ngramsArray
  }
}

exports = module.exports = ngram
