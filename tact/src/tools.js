var config = require('./config.js');
var tokenizer = require('./tokenizer.js');
var ngram = require('./ngram.js');

exports.sum = function(obj) {
  var sum = 0;
  for( var el in obj ) {
    if( obj.hasOwnProperty(el) ) sum += parseFloat(obj[el]);
  }
  return sum;
}

exports.forObject = function(object, callback) {
  return Object.keys(object).map(function (key) {
    return callback(key, object[key]);
  });
}

exports.countInArray = function(array, item) {
  var count = 0;
  for (var i = 0; i < array.length; i++) {
    if (array[i] === item) { count++; }
  }
  return count;
}

exports.ngram = function(string, n) {
  var ngramArray = []
  var i;
  for (i=1; i < n+1; i++) {
    var tokens = tokenizer.tokenize(string);
    var _ngrams = ngram.ngram(tokens, i);
    _ngrams.forEach(function(_ngramArray, _i) {
      var ngramString = _ngramArray.join(' ');
      ngramArray.push(ngramString);
    });
  }
  return ngramArray;
}

if (typeof Object.merge !== 'function') {
  Object.merge = function (o1, o2) { // Function to merge all of the properties from one object into another
    for(var i in o2) { o1[i] = o2[i]; }
    return o1;
  };
}
