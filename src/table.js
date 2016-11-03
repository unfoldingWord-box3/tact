var natural = require('natural');
var XRegExp = require('xregexp');
var tools = require('./tools.js');
var config = require('./config.js');
var nonUnicodeLetter = XRegExp('\\PL+'); // var nonUnicodeLetter = XRegExp('[^\\pL]+');
var tokenizer = new natural.RegexpTokenizer({pattern: nonUnicodeLetter});
var unicodePunctuation = XRegExp("\\s*\\p{P}+\\s*");
var segmenter = new natural.RegexpTokenizer({pattern: unicodePunctuation});
var ngrams = natural.NGrams;

var tablePush = function(source, target, table, isCorrections) {
  var sourceArray, targetArray;
  if (isCorrections) {
    sourceArray = [source];
    targetArray = [target];
  } else {
    sourceArray = tools.ngram(source, config.ngrams.sourceMax);
    targetArray = tools.ngram(target, config.ngrams.targetMax);
  }
  sourceArray.forEach(function(sourceNgram, index) {
    if (table[sourceNgram] === undefined) {
      table[sourceNgram] = {};
    }
    targetArray.forEach(function(targetNgram, index) {
      if (table[sourceNgram][targetNgram] === undefined) {
        table[sourceNgram][targetNgram] = 1;
      } else {
        table[sourceNgram][targetNgram] ++;
      }
    });
  });
  return table;
}
// can pass in table so that it can incriment counts
var generate = function(trainingSet, isCorrections, table) {
  if (table == undefined) var table = {}; // response
  // loop through trainingSet
  // generate ngrams of source and target
  trainingSet.forEach(function(pair, index) {
    var source = pair[0];
    var target = pair[1];
    if (config.segmentation.corpus && !isCorrections) {
      var sourceSegments = segmenter.tokenize(source);
      var targetSegments = segmenter.tokenize(target);
      if (sourceSegments.length == targetSegments.length) {
        sourceSegments.forEach(function(sourceSegment, _index){
          tablePush(sourceSegment, targetSegments[_index], table, isCorrections);
        });
      } else {
        tablePush(source, target, table, isCorrections);
      }
    } else {
      tablePush(source, target, table, isCorrections);
    }
  });
  trainingSet = [];
  return table;
};
exports.generate = generate;
