var tools = require('./tools.js');
var config = require('./config.js');
var table = require('./table.js');
var segmenter = require('./segmenter');

exports.table = table;
var permutations = {};
var tableName = 'phrases';
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
  var sourceArray = tools.ngram(source, config.ngrams.sourceMax);
  var targetArray = tools.ngram(target, config.ngrams.targetMax);
  sourceArray.forEach(function(sourceNgram, index) {
    targetArray.forEach(function(targetNgram, _index) {
      increment(sourceNgram, targetNgram);
    });
  });
};
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
      if (config.segmentation.corpus) {
        var sourceSegments = segmenter.segment(source);
        var targetSegments = segmenter.segment(target);
        if (sourceSegments.length == targetSegments.length) {
          sourceSegments.forEach(function(sourceSegment, _index){
            append(sourceSegment, targetSegments[_index]);
          });
        } else {
          append(source, target);
        }
      } else {
        append(source, target);
      }
    });
    trainingSet = [];
    table.bulkInsert(tableName, permutations, progress, callback);
  });
};
