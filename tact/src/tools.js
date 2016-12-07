var config = require('../config.js')
var tokenizer = require('./tokenizer.js')
var ngram = require('./ngram.js')

var tools = {

  getIndicesOf: function(phrase, string) {
    var phraseLength = phrase.length
    if (phraseLength == 0) return []
    var startIndex = 0, index, indices = []
    while ((index = string.indexOf(phrase, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + phraseLength;
    }
    return indices;
  },

  averageObjects: function(array) {
    if (array.length == 1) return array[0];
    var sums = {}, counts = {}, results = {}, keys;
    var keys = Object.keys(array[0])
    array.forEach(function(object) {
      keys.forEach(function(key) {
        if (!(key in sums)) {
          sums[key] = 0;
          counts[key] = 0;
        }
        sums[key] += object[key];
        counts[key]++;
      });
    });
    keys.forEach(function(key) {
      results[key] = sums[key] / counts[key];
    });
    return results;
  },

  unique: function(array) {
    var o = {}, i, l = array.length, r = [];
    for(i=0; i<l;i+=1) o[array[i]] = array[i];
    for(i in o) r.push(o[i]);
    return r;
  },

  sum: function(obj) {
    var sum = 0;
    for( var el in obj ) {
      if( obj.hasOwnProperty(el) ) sum += parseFloat(obj[el]);
    }
    return sum;
  },

  forObject: function(object, callback) {
    return Object.keys(object).map(function (key) {
      return callback(key, object[key]);
    });
  },

  countInArray: function(array, item) {
    var count = 0;
    for (var i = 0; i < array.length; i++) {
      if (array[i] === item) { count++; }
    }
    return count;
  },

  ngrams: {},
  ngram: function(string, n) {
    var key = n + string
    var ngramArray = this.ngrams[key]
    if (ngramArray === undefined) {
      ngramArray = []
      var i
      for (i=1; i < n+1; i++) {
        var tokens = tokenizer.tokenize(string)
        var _ngrams = ngram.ngram(tokens, i)
        _ngrams.forEach(function(_ngramArray, _i) {
          var ngramString = _ngramArray.join(' ')
          if (ngramArray.indexOf(ngramString) == -1) {
            ngramArray.push(ngramString)
          }
        })
      }
      this.ngrams[key] = ngramArray
    }
    return ngramArray;
  }

}
module = module.exports = tools

if (typeof Object.merge !== 'function') {
  Object.merge = function (o1, o2) { // Function to merge all of the properties from one object into another
    for(var i in o2) { o1[i] = o2[i]; }
    return o1;
  };
}
