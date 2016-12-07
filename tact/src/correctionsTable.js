var config = require('../config.js')
var tools = require('./tools.js')
var table = require('./table.js')
var scoring = require('./scoring.js')

exports.table = table;
var permutations = {};
var tableName = 'corrections';
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

var append = function(source, target, sourcePhrase, targetPhrase) {
  var staticScore;
  if (config.global.features.staticScores) {
    staticScore = scoring.staticScore(source, target, sourcePhrase, targetPhrase)
  } else {
    staticScore = {}
  }
  increment(sourcePhrase, targetPhrase, staticScore);
}
// can pass in table so that it can incriment counts
var generate = function(trainingSet, progress, callback) {
  table.init(tableName, function(){
    // loop through trainingSet
    // generate ngrams of source and target
    var count = trainingSet.length;
    trainingSet.forEach(function(pair, index) {
      progress((index+1)/count);
      var source = pair[0];
      var target = pair[1];
      append(source, target, source, target);
    });
    trainingSet = [];
    table.bulkInsert(tableName, permutations, progress, callback);
  });
};
exports.generate = generate
