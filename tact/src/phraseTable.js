var config = require('../config.js')
var tools = require('./tools.js')
var table = require('./table.js')
var scoring = require('./scoring.js')
var segmenter = require('./segmenter.js')

exports.config = config;
exports.table = table;
var permutations = {};
var tableName = 'phrases';
exports.tableName = tableName;

var prune = function(sourceString, targetString, callback) {
  table.phrases(tableName, sourceString, targetString, callback);
};
exports.prune = prune;

var increment = function(sourceNgram, targetNgram, staticScore) {
  if (permutations[sourceNgram] === undefined) {
    permutations[sourceNgram] = {};
  }
  if (permutations[sourceNgram][targetNgram] === undefined) {
    permutations[sourceNgram][targetNgram] = [];
  }
  permutations[sourceNgram][targetNgram].push(staticScore);
};
exports.increment = increment;

var append = function(source, target) {
  var sourceArray = tools.ngram(source, config.global.ngram.source);
  var targetArray = tools.ngram(target, config.global.ngram.target);
  sourceArray.forEach(function(sourcePhrase, index) {
    targetArray.forEach(function(targetPhrase, _index) {
      var staticScore;
      if (config.global.features.staticScores) {
        staticScore = scoring.staticScore(source, target, sourcePhrase, targetPhrase)
      } else {
        staticScore = {}
      }
      increment(sourcePhrase, targetPhrase, staticScore);
    });
  });
};
// can pass in table so that it can incriment counts
exports.generate = function(trainingSet, progress, callback) {
  table.init(tableName, function(){
    // loop through trainingSet
    // generate ngrams of source and target
    var count = trainingSet.length;
    console.log("calculating permutations...");
    trainingSet.forEach(function(pair, index) {
      progress((index+1)/count);
      var source = pair[0];
      var target = pair[1];
      if (config.train.features.segment) {
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
    console.log("storing permutations...");
    table.bulkInsert(tableName, permutations, progress, callback);
  });
};
