var tools = require('./tools.js')
var ngram = require('./ngram.js')
var tokenizer = require('./tokenizer.js')

var scoring = {
  ratioScore: function(alignment) {
    alignment.localSourceRatio = alignment.tally / alignment.localSourceTotal
    alignment.globalSourceRatio = Math.round(alignment.tally / alignment.globalSourceTotal * 1000) / 1000
    alignment.sourceUniqueness = Math.round(alignment.localSourceTotal / alignment.globalSourceTotal * 1000) / 1000
    alignment.localTargetRatio = alignment.tally / alignment.localTargetTotal
    alignment.globalTargetRatio = Math.round(alignment.tally / alignment.globalTargetTotal * 1000) / 1000
    alignment.targetUniqueness = Math.round(alignment.localTargetTotal / alignment.globalTargetTotal * 1000) / 1000
    alignment.ratioScore = (
      3*alignment.globalSourceRatio +
      3*alignment.globalTargetRatio +
      2*alignment.localSourceRatio +
      2*alignment.localTargetRatio +
      1*(1-alignment.sourceUniqueness) +
      1*(1-alignment.targetUniqueness)
    )/12
    if (Number.isNaN(alignment.ratioScore)) console.log(alignment)
    return alignment
  },
  // favor phrases over words
  ngramScore: function(options, alignment) {
    var sourceNgramCount = tokenizer.tokenize(alignment.source).length
    var targetNgramCount = tokenizer.tokenize(alignment.target).length
    var sourceNgramScore = options.align.ngrams.sourceScores[sourceNgramCount]
    var targetNgramScore = options.align.ngrams.targetScores[targetNgramCount]
    alignment.ngramScore = (sourceNgramScore + targetNgramScore) / 2
    if (alignment.correction) {
      var deltaNgramMax = Math.abs(options.global.ngram.target - sourceNgramCount)
      alignment.ngramScore = 1/(deltaNgramMax+1)
    }
    return alignment
  },
  // favor words/phrases that occur same number of times in source and target
  phraseCountScore: function(sourcePhrase, targetPhrase, sourceNgramArray, targetNgramArray) {
    if (targetPhrase == ' ') return 0.5
    var sourceMatchCount = tools.countInArray(sourceNgramArray, sourcePhrase)
    var targetMatchCount = tools.countInArray(targetNgramArray, targetPhrase)
    var deltaCount = Math.abs(sourceMatchCount - targetMatchCount)
    return 1/(deltaCount+1)
  },
  // favor words/phrases that occur in the same place in the sentence
  wordOrderScore: function(sourcePhrase, targetPhrase, sourceString, targetString) {
    if (targetPhrase == ' ') return 0.5
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
    if (Number.isNaN(deltaRatioAvg)) console.log('wordOrderScore: ', sourceIndices, targetIndices, sourcePhrase, targetPhrase, sourceString, targetString)
    return (1 - deltaRatioAvg)
  },
  //favor words/ngrams around the same length relative to their language length
  sizeDeltaScore: function(sourcePhrase, targetPhrase, sourceString, targetString) {
    if (targetPhrase == ' ') return 0.5
    var sourceSizeRatio = sourcePhrase.length/sourceString.length
    var targetSizeRatio = targetPhrase.length/targetString.length
    var deltaSizeRatio = Math.abs(sourceSizeRatio - targetSizeRatio)
    return (1 - deltaSizeRatio)
  },
  // score based on factors that don't change once new corpus is added, used during training
  staticScore: function(options, sourcePhrase, targetPhrase, sourceSegment, targetSegment) {
    var sourceNgramArray = ngram.ngram(sourceSegment, options.global.ngram.source)
    var targetNgramArray = ngram.ngram(targetSegment, options.global.ngram.target)
    return {
      phraseCountScore: this.phraseCountScore(sourcePhrase, targetPhrase, sourceNgramArray, targetNgramArray),
      wordOrderScore: this.wordOrderScore(sourcePhrase, targetPhrase, sourceSegment, targetSegment)
    }
  },
  // score the alignment based on the criteria such as ngram length
  score: function(options, alignmentPair, alignment) {
    var sourceString = alignmentPair[0], targetString = alignmentPair[1]
    var sourceNgramArray = ngram.ngram(sourceString, options.global.ngram.source)
    var targetNgramArray = ngram.ngram(targetString, options.global.ngram.target)
    alignment.weightSum = tools.sum(options.align.weights)
    alignment = this.ratioScore(alignment)
    alignment = this.ngramScore(options, alignment)
    var sourcePhrase = alignment.source, targetPhrase = alignment.target

    if (options.global.features.staticScores) {
      var _phraseCountScore = this.phraseCountScore(sourcePhrase, targetPhrase, sourceNgramArray, targetNgramArray)
      var _wordOrderScore = this.wordOrderScore(sourcePhrase, targetPhrase, sourceString, targetString)
      var ratios = options.align.staticScoreRatios
      alignment.phraseCountScore = alignment.staticScore.phraseCountScore * ratios.phraseCount + _phraseCountScore * (1-ratios.wordOrder)
      alignment.wordOrderScore = alignment.staticScore.wordOrderScore * ratios.wordOrder + _wordOrderScore * (1-ratios.wordOrder)
    } else {
      alignment.phraseCountScore = this.phraseCountScore(sourcePhrase, targetPhrase, sourceNgramArray, targetNgramArray)
      alignment.wordOrderScore = this.wordOrderScore(sourcePhrase, targetPhrase, sourceString, targetString)
    }

    alignment.sizeDeltaScore = this.sizeDeltaScore(sourcePhrase, targetPhrase, sourceString, targetString)

    if (alignment.correction) {
      alignment.weightSum = alignment.weightSum + options.align.weights.ngram * (options.align.corrections.ngramMultiplier - 1)
    }
    alignment.score = (
      options.align.weights.ratio * alignment.ratioScore +
      options.align.weights.ngram * (alignment.correction ? options.align.corrections.ngramMultiplier : 1) * alignment.ngramScore +
      options.align.weights.phraseCount * alignment.phraseCountScore +
      options.align.weights.wordOrder * alignment.wordOrderScore +
      options.align.weights.sizeDelta * alignment.sizeDeltaScore
    ) / alignment.weightSum
    if (alignment.correction == true) {
      alignment.score = alignment.score + options.align.bonus.correction
    }
    alignment.score = Math.round(alignment.score * 1000) / 1000
    // if (Number.isNaN(alignment.score)) {console.log(alignment)}
    return alignment
  }
}

exports = module.exports = scoring
