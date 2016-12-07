var config = require('../config.js')
var tools = require('./tools.js')
var tokenizer = require('./tokenizer.js')

var scoring = {
  ratioScore: function(row) {
    row.localSourceRatio = row.tally / row.localSourceTotal
    row.globalSourceRatio = Math.round(row.tally / row.globalSourceTotal * 1000) / 1000
    row.sourceUniqueness = Math.round(row.localSourceTotal / row.globalSourceTotal * 1000) / 1000
    row.ratioScore = (3*row.globalSourceRatio + 2*row.localSourceRatio + 1*(1-row.sourceUniqueness))/6
    return row
  },
  // favor phrases over words
  ngramScore: function(row) {
    var sourceNgramCount = tokenizer.tokenize(row.source).length
    var targetNgramCount = tokenizer.tokenize(row.target).length
    var sourceNgramScore = config.align.ngrams.sourceScores[sourceNgramCount]
    var targetNgramScore = config.align.ngrams.targetScores[targetNgramCount]
    row.ngramScore = (sourceNgramScore + targetNgramScore) / 2
    if (row.correction) {
      var deltaNgramMax = Math.abs(config.global.ngram.target - sourceNgramCount)
      row.ngramScore = 1/(deltaNgramMax+1)
    }
    return row
  },
  // favor words/phrases that occur same number of times in source and target
  phraseCountScore: function(sourcePhrase, targetPhrase, sourceNgramArray, targetNgramArray) {
    var sourceMatchCount = tools.countInArray(sourceNgramArray, sourcePhrase)
    var targetMatchCount = tools.countInArray(targetNgramArray, targetPhrase)
    var deltaCount = Math.abs(sourceMatchCount - targetMatchCount)
    return 1/(deltaCount+1)
  },
  // favor words/phrases that occur in the same place in the sentence
  wordOrderScore: function(sourcePhrase, targetPhrase, sourceString, targetString) {
    var sourceIndices = tools.getIndicesOf(sourcePhrase, sourceString)
    var targetIndices = tools.getIndicesOf(targetPhrase, targetString)
    sourceIndices = [sourceIndices[0], sourceIndices[sourceIndices.length-1]]
    targetIndices = [targetIndices[0], targetIndices[targetIndices.length-1]]
    var deltaRatios = []
    sourceIndices.forEach(function(indice, index){
      var sourceRatio = indice / sourceString.length
      var targetRatio = targetIndices[index] / targetString.length
      var deltaRatio = Math.abs(sourceRatio - targetRatio)
      deltaRatios.push(deltaRatio)
    })
    var deltaRatioSum = deltaRatios.reduce(function(a,b) {return a+b}, 0)
    var deltaRatioAvg = deltaRatioSum/deltaRatios.length
    return (1 - deltaRatioAvg)
  },
  //favor words/ngrams around the same length relative to their language length
  sizeDeltaScore: function(sourcePhrase, targetPhrase, sourceString, targetString) {
    var sourceSizeRatio = sourcePhrase.length/sourceString.length
    var targetSizeRatio = targetPhrase.length/targetString.length
    var deltaSizeRatio = Math.abs(sourceSizeRatio - targetSizeRatio)
    return (1 - deltaSizeRatio)
  },
  // score based on factors that don't change once new corpus is added, used during training
  staticScore: function(sourcePhrase, targetPhrase, sourceSegment, targetSegment) {
    var sourceNgramArray = tools.ngram(sourceSegment, config.global.ngram.source)
    var targetNgramArray = tools.ngram(targetSegment, config.global.ngram.target)
    return {
      phraseCountScore: this.phraseCountScore(sourcePhrase, targetPhrase, sourceNgramArray, targetNgramArray),
      wordOrderScore: this.wordOrderScore(sourcePhrase, targetPhrase, sourceSegment, targetSegment)
    }
  },
  // score the row based on the criteria such as ngram length
  score: function(sourceString, targetString, row) {
    var sourceNgramArray = tools.ngram(sourceString, config.global.ngram.source)
    var targetNgramArray = tools.ngram(targetString, config.global.ngram.target)
    row.weightSum = tools.sum(config.align.weights)
    row = this.ratioScore(row)
    row = this.ngramScore(row)
    var sourcePhrase = row.source, targetPhrase = row.target

    if (config.global.features.staticScores) {
      var _phraseCountScore = this.phraseCountScore(sourcePhrase, targetPhrase, sourceNgramArray, targetNgramArray)
      var _wordOrderScore = this.wordOrderScore(sourcePhrase, targetPhrase, sourceString, targetString)
      var ratios = config.align.staticScoreRatios
      row.phraseCountScore = row.staticScore.phraseCountScore * ratios.phraseCount + _phraseCountScore * (1-ratios.wordOrder)
      row.wordOrderScore = row.staticScore.wordOrderScore * ratios.wordOrder + _wordOrderScore * (1-ratios.wordOrder)
    } else {
      row.phraseCountScore = this.phraseCountScore(sourcePhrase, targetPhrase, sourceNgramArray, targetNgramArray)
      row.wordOrderScore = this.wordOrderScore(sourcePhrase, targetPhrase, sourceString, targetString)
    }

    row.sizeDeltaScore = this.sizeDeltaScore(sourcePhrase, targetPhrase, sourceString, targetString)

    if (row.correction) {
      row.weightSum = row.weightSum + config.align.weights.ngram * (config.align.corrections.ngramMultiplier - 1)
    }
    row.score = (
      config.align.weights.ratio * row.ratioScore +
      config.align.weights.ngram * (row.correction ? config.align.corrections.ngramMultiplier : 1) * row.ngramScore +
      config.align.weights.phraseCount * row.phraseCountScore +
      config.align.weights.wordOrder * row.wordOrderScore +
      config.align.weights.sizeDelta * row.sizeDeltaScore
    ) / row.weightSum
    if (row.correction == true) {
      row.score = row.score + config.align.bonus.correction
    }
    row.score = Math.round(row.score * 1000) / 1000
    return row
  }
}

exports = module.exports = scoring
