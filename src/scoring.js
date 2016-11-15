var tools = require('./tools.js');
var config = require('./config.js');
var natural = require('natural');
var XRegExp = require('xregexp');
var nonUnicodeLetter = XRegExp('\\PL+'); // var nonUnicodeLetter = XRegExp('[^\\pL]+');
var tokenizer = new natural.RegexpTokenizer({pattern: nonUnicodeLetter});
var ngrams = natural.NGrams;

var ratioScore = function(row) {
  row.localSourceRatio = row.tally / row.localSourceTotal;
  row.localTargetRatio = 0 // row.tally / row.localTargetTotal;
  row.globalSourceRatio = Math.round(row.tally / row.globalSourceTotal * 1000) / 1000;
  row.globalTargetRatio = 0 // Math.round(row.tally / row.globalTargetTotal * 1000) / 1000;
  row.sourceUniqueness = Math.round(row.localSourceTotal / row.globalSourceTotal * 1000) / 1000;
  row.targetUniqueness = 0 // Math.round(row.localTargetTotal / row.globalTargetTotal * 1000) / 1000;
  return row;
};
exports.ratioScore = ratioScore;

// favor phrases over words
var ngramScore = function(row) {
  var sourceNgramCount = tokenizer.tokenize(row.source).length;
  var targetNgramCount = tokenizer.tokenize(row.target).length;
  sourceNgramScore = config.ngrams.sourceScores[sourceNgramCount];
  targetNgramScore = config.ngrams.targetScores[targetNgramCount];
  row.ngramScore = (sourceNgramScore + targetNgramScore) / 2
  if (row.correction) {
    var deltaNgramMax = Math.abs(config.ngrams.targetMax - sourceNgramCount);
    row.ngramScore = 1/(deltaNgramMax+1);
  }
  return row;
}
// favor words/phrases that occur same number of times in source and target
var occurrenceDeltaScore = function(row, sourceNgramArray, targetNgramArray) {
  var sourceMatchCount = tools.countInArray(sourceNgramArray, row.source);
  var targetMatchCount = tools.countInArray(targetNgramArray, row.target);
  var deltaCount = Math.abs(sourceMatchCount - targetMatchCount);
  row.occurrenceDeltaScore = 1/(deltaCount+1);
  return row;
}
// favor words/phrases that occur in the same place in the sentence
var positionDeltaScore = function(row, sourceString, targetString) {
  var sourcePosition = sourceString.indexOf(row.source);
  var targetPosition = targetString.indexOf(row.target);
  var sourceRatio = sourcePosition / sourceString.length;
  var targetRatio = targetPosition / targetString.length;
  var deltaRatio = Math.abs(sourceRatio - targetRatio);
  row.positionDeltaScore = (1 - deltaRatio);
  return row;
}
//favor words/ngrams around the same length relative to their language length
var sizeDeltaScore = function(row, sourceString, targetString) {
  var sourceSizeRatio = row.source.length/sourceString.length;
  var targetSizeRatio = row.target.length/targetString.length;
  var deltaSizeRatio = Math.abs(sourceSizeRatio - targetSizeRatio);
  row.sizeDeltaScore = (1 - deltaSizeRatio);
  return row;
}
// score the row based on the criteria such as ngram length
exports.score = function(sourceString, targetString, row) {
  var sourceNgramArray = tools.ngram(sourceString, config.ngrams.sourceMax);
  var targetNgramArray = tools.ngram(targetString, config.ngrams.targetMax);
  row.weightSum = tools.sum(config.weights);
  row = ratioScore(row);
  row = ngramScore(row);
  row = positionDeltaScore(row, sourceString, targetString);
  row = occurrenceDeltaScore(row, sourceNgramArray, targetNgramArray);
  row = sizeDeltaScore(row, sourceString, targetString);
  if (row.correction) {
    row.weightSum = row.weightSum + config.weights.longerNgrams * (config.corrections.applyLongerNgramsFirst - 1);
  }
  row.score = (
    config.weights.localSourceRatio * row.localSourceRatio +
    config.weights.localTargetRatio * row.localTargetRatio +
    config.weights.globalSourceRatio * row.globalSourceRatio +
    config.weights.globalTargetRatio * row.globalTargetRatio +
    config.weights.sourceUniqueness * row.sourceUniqueness +
    config.weights.targetUniqueness * row.targetUniqueness +
    config.weights.longerNgrams * (row.correction ? config.corrections.applyLongerNgramsFirst : 1) * row.ngramScore +
    config.weights.positionDelta * row.positionDeltaScore +
    config.weights.occurrenceDelta * row.occurrenceDeltaScore +
    config.weights.sizeDelta * row.sizeDeltaScore
  ) / row.weightSum;
  if (row.correction == true) {
    row.score = row.score + config.bonus.correction;
  }
  row.score = Math.round(row.score * 1000) / 1000;
  return row;
}
