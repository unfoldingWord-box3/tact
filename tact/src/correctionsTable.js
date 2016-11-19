var natural = require('natural');
var XRegExp = require('xregexp');
var tools = require('./tools.js');
var config = require('./config.js');
var table = require('./table.js');
var nonUnicodeLetter = XRegExp('\\PL+'); // var nonUnicodeLetter = XRegExp('[^\\pL]+');
var tokenizer = new natural.RegexpTokenizer({pattern: nonUnicodeLetter});
var unicodePunctuation = XRegExp("\\s*\\p{P}+\\s*");
var segmenter = new natural.RegexpTokenizer({pattern: unicodePunctuation});
var ngrams = natural.NGrams;

exports.table = table;
var permutations = {};
var tableName = 'corrections';
exports.tableName = tableName;

var prune = function(sourceString, targetString, callback) {
  var sourceNgramArray = tools.ngram(sourceString, config.ngrams.sourceMax);
  var targetNgramArray = tools.ngram(targetString, config.ngrams.targetMax);
  table.phrases(tableName, sourceString, targetString, sourceNgramArray, targetNgramArray, callback);
};
exports.prune = prune;

var increment = function(sourceNgram, targetNgram) {
  if (permutations[sourceNgram] === undefined) {
    permutations[sourceNgram] = {};
  }
  if (permutations[sourceNgram][targetNgram] === undefined) {
    permutations[sourceNgram][targetNgram] = 1;
  } else {
    permutations[sourceNgram][targetNgram] = permutations[sourceNgram][targetNgram] + 1;
  }
};
exports.increment = increment;

var append = function(source, target) {
  increment(source, target);
}
// can pass in table so that it can incriment counts
exports.generate = function(trainingSet, progress, callback) {
  table.init(tableName, function(){
    // loop through trainingSet
    // generate ngrams of source and target
    var count = trainingSet.length;
    trainingSet.forEach(function(pair, index) {
      progress((index+1)/count);
      var source = pair[0];
      var target = pair[1];
      append(source, target);
    });
    trainingSet = [];
    table.bulkInsert(tableName, permutations, progress, callback);
  });
};
