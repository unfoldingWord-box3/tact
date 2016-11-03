var tools = require('./tools.js');
var config = require('./config.js');
var natural = require('natural');
var XRegExp = require('xregexp');
var nonUnicodeLetter = XRegExp('\\PL+'); // var nonUnicodeLetter = XRegExp('[^\\pL]+');
var tokenizer = new natural.RegexpTokenizer({pattern: nonUnicodeLetter});
var ngrams = natural.NGrams;

// favor phrases over words
var longerNgramScore = function(sourceNgram, targetNgram, isCorrection) {
  var longerNgramScore;
  var sourceNgramCount = tokenizer.tokenize(sourceNgram).length;
  var targetNgramCount = tokenizer.tokenize(targetNgram).length;
  sourceNgramScore = config.ngrams.targetScores[sourceNgramCount];
  targetNgramScore = config.ngrams.targetScores[targetNgramCount];
  longerNgramScore = (sourceNgramScore + targetNgramScore) / 2
  if (isCorrection) {
    var deltaNgramMax = Math.abs(config.ngrams.targetMax - sourceNgramCount);
    longerNgramScore = 1/(deltaNgramMax+1);
  }
  return longerNgramScore;
}
// favor words/phrases that occur same number of times in source and target
var occurrenceDeltaScore = function(sourceNgram, targetNgram, sourceNgramArray, targetNgramArray) {
  var occurrenceDeltaScore;
  var sourceMatchCount = tools.countInArray(sourceNgramArray, sourceNgram);
  var targetMatchCount = tools.countInArray(targetNgramArray, targetNgram);
  var deltaCount = Math.abs(sourceMatchCount - targetMatchCount);
  occurrenceDeltaScore = 1/(deltaCount+1);
  return occurrenceDeltaScore;
}
// favor words/phrases that occur in the same place in the sentence
var positionDeltaScore = function(sourceNgram, targetNgram, sourceString, targetString) {
  var positionDeltaScore;
  var sourcePosition = sourceString.indexOf(sourceNgram);
  var targetPosition = targetString.indexOf(targetNgram);
  var sourceRatio = sourcePosition / sourceString.length;
  var targetRatio = targetPosition / targetString.length;
  var deltaRatio = Math.abs(sourceRatio - targetRatio);
  positionDeltaScore = (1 - deltaRatio);
  return positionDeltaScore;
}
//favor words/ngrams around the same length relative to their language length
var sizeDeltaScore = function(sourceNgram, targetNgram, sourceString, targetString) {
  var sizeDeltaScore;
  var sourceSizeRatio = sourceNgram.length/sourceString.length;
  var targetSizeRatio = targetNgram.length/targetString.length;
  var deltaSizeRatio = Math.abs(sourceSizeRatio - targetSizeRatio);
  var sizeDeltaScore = (1 - deltaSizeRatio);
  return sizeDeltaScore;
}
// score the alignmentObject based on the criteria such as ngram length
exports.score = function(sourceString, targetString, sourceNgramArray, targetNgramArray, alignmentObject) {
  var sourceNgram = alignmentObject.sourceNgram;
  var targetNgram = alignmentObject.targetNgram;
  var isCorrection = alignmentObject.correction;
  var weightSum = tools.sum(config.weights);
  if (isCorrection) {
    weightSum = weightSum + config.weights.longerNgrams * (config.corrections.applyLongerNgramsFirst - 1);
  }
  var score = (
    config.weights.tableRatios * alignmentObject.ratio +
    config.weights.sourceUniqueness * alignmentObject.sourceUniqueness +
    config.weights.longerNgrams * (isCorrection ? config.corrections.applyLongerNgramsFirst : 1) * longerNgramScore(sourceNgram, targetNgram, isCorrection) +
    config.weights.occurrenceDelta * occurrenceDeltaScore(sourceNgram, targetNgram, sourceNgramArray, targetNgramArray) +
    config.weights.positionDelta * positionDeltaScore(sourceNgram, targetNgram, sourceString, targetString) +
    config.weights.sizeDelta * sizeDeltaScore(sourceNgram, targetNgram, sourceString, targetString)
  ) / weightSum;
  if (alignmentObject.correction == true) {
    score = score + config.bonus.correction;
  }
  alignmentObject.score = Math.round(score * 1000) / 1000;
  return alignmentObject;
}
