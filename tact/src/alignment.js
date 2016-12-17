var tools = require('./tools.js')
var ngram = require('./ngram.js')
var tokenizer = require('./tokenizer.js')

function Alignment(options, source, target, isCorrection) {
  if (options.constructor !== Object) throw 'Alignment() options is not Object: ' + options
  if (typeof source !== 'string') throw 'Alignment(source) source is not String: ' + source
  if (typeof target !== 'string') throw 'Alignment(target) target is not String: ' + target
  this.source = source
  this.target = target
  this.options = options
  this.isCorrection = isCorrection

  this.sourceNeeded = true
  this.targetNeeded = true
  this.conflict = false
  this.sourceUsed = false

  this.totals = {
    tally: 0,
    localSource: 0,
    localTarget: 0,
    globalSource: 0,
    globalTarget: 0
  }

  this.ratios = {
    localSource: 0,
    localTarget: 0,
    local: 0,
    globalSource: 0,
    globalTarget: 0,
    global: 0
  }

  this.uniqueness = {
    source: 0,
    target: 0
  }

  this.scores = {
    ratio: 0,
    uniqueness: 0,
    ngram: 0,
    phraseCount: 0,
    wordOrder: 0,
    sizeDelta: 0,
  }

  this.confidence = 0

  this.staticScores = []
}

Alignment.prototype.addTally = function(tally) {
  this.totals.tally += tally
}

Alignment.prototype.addLocalTotals = function(localSourceTotal, localTargetTotal) {
  this.totals.localSource += localSourceTotal
  this.totals.localTarget += localTargetTotal
}

Alignment.prototype.addGlobalTotals = function(globalSourceTotal, globalTargetTotal) {
  this.totals.globalSource += globalSourceTotal
  this.totals.globalTarget += globalTargetTotal
}

Alignment.prototype.averageStaticScores = function() {
  return tools.averageObjects(this.staticScores)
}

Alignment.prototype.ratioScore = function() {
  var that = this
  that.ratios.localSource = that.totals.tally / that.totals.localSource
  that.ratios.localTarget = that.totals.tally / that.totals.localTarget
  that.ratios.local = (that.ratios.localSource + that.ratios.localTarget) / 2

  that.ratios.globalSource = Math.round(that.totals.tally / that.totals.globalSource * 1000) / 1000
  that.ratios.globalTarget = Math.round(that.totals.tally / that.totals.globalTarget * 1000) / 1000
  that.ratios.global = (that.ratios.globalSource + that.ratios.globalTarget) / 2

  that.scores.ratio = (
    2*that.ratios.local +
    3*that.ratios.global
  )/5
  if (Number.isNaN(that.scores.ratio) || that.ratios.global === undefined) console.log(that)
}

Alignment.prototype.uniquenessScore = function() {
  var that = this
  that.uniqueness.source = Math.round(that.totals.localSource / that.totals.globalSource * 1000) / 1000
  that.uniqueness.target = Math.round(that.totals.localTarget / that.totals.globalTarget * 1000) / 1000
  var deltaUniqueness = Math.abs(that.uniqueness.source - that.uniqueness.target)
  that.scores.uniqueness = 1.00 - deltaUniqueness // if the delta of uniqueness is great, make score lower, if the delta is small, make score higher
  // if (that.source == 'τὸν' && that.target == 'ram') console.log(that)
}
// favor phrases over words
Alignment.prototype.ngramScore = function() {
  var that = this
  var sourceNgramCount = tokenizer.tokenize(that.source).length
  var targetNgramCount = tokenizer.tokenize(that.target).length
  var sourceNgramScore = that.options.align.ngrams.sourceScores[sourceNgramCount]
  var targetNgramScore = that.options.align.ngrams.targetScores[targetNgramCount]
  if (that.isCorrection) {
    var deltaNgramMax = Math.abs(that.options.global.ngram.target - sourceNgramCount)
    that.scores.ngram = 1/(deltaNgramMax+1)
  } else {
    that.scores.ngram = (sourceNgramScore + targetNgramScore) / 2
  }
}
// favor words/phrases that occur same number of times in source and target
Alignment.prototype.phraseCountScore = function(sourceNgramArray, targetNgramArray) {
  var that = this
  if (that.source === ' ' || that.target === ' ') return 0.6
  var sourceMatchCount = tools.countInArray(sourceNgramArray, that.source)
  var targetMatchCount = tools.countInArray(targetNgramArray, that.target)
  var deltaCount = Math.abs(sourceMatchCount - targetMatchCount)
  return 1/(deltaCount+1)
}
// favor words/phrases that occur in the same place in the sentence
Alignment.prototype.wordOrderScore = function(sourceString, targetString) {
  var that = this
  if (that.source === ' ' || that.target === ' ') return 0.6
  if (targetString === ' ' || sourceString === ' ') return 0.6
  var sourceIndices = tools.getIndicesOf(that.source, sourceString)
  var targetIndices = tools.getIndicesOf(that.target, targetString)
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
  // if (Number.isNaN(deltaRatioAvg)) console.log('wordOrderScore: ', sourceIndices, targetIndices, sourcePhrase, targetPhrase, sourceString, targetString)
  return (1 - deltaRatioAvg)
}
//favor words/ngrams around the same length relative to their language length
Alignment.prototype.sizeDeltaScore = function(sourceString, targetString) {
  var that = this
  if (that.target == ' ') return 0.6
  var sourceSizeRatio = that.source.length/sourceString.length
  var targetSizeRatio = that.target.length/targetString.length
  var deltaSizeRatio = Math.abs(sourceSizeRatio - targetSizeRatio)
  return (1 - deltaSizeRatio)
}
// score based on factors that don't change once new corpus is added, used during training
Alignment.prototype.addStaticScore = function(sourceSegment, targetSegment) {
  var that = this
  var sourceNgramArray = ngram.ngram(sourceSegment, that.options.global.ngram.source)
  var targetNgramArray = ngram.ngram(targetSegment, that.options.global.ngram.target)
  var staticScore = {
    phraseCount: that.phraseCountScore(sourceNgramArray, targetNgramArray),
    wordOrder: that.wordOrderScore(sourceSegment, targetSegment)
  }
  that.staticScores.push(staticScore)
}
// score the alignment based on the criteria such as ngram length
Alignment.prototype.score = function(alignmentPair) {
  var that = this
  var sourceString = alignmentPair[0], targetString = alignmentPair[1]
  var sourceNgramArray = ngram.ngram(sourceString, that.options.global.ngram.source)
  var targetNgramArray = ngram.ngram(targetString, that.options.global.ngram.target)
  that.weightSum = tools.sum(that.options.align.weights)
  that.ratioScore()
  that.uniquenessScore()
  that.ngramScore()


  if (that.options.global.features.staticScores && that.staticScores.length > 0) {
    var _phraseCountScore = that.phraseCountScore(sourceNgramArray, targetNgramArray)
    var _wordOrderScore = that.wordOrderScore(sourceString, targetString)
    var ratios = that.options.align.staticScoreRatios
    that.scores.phraseCount = that.averageStaticScores().phraseCount * ratios.phraseCount + _phraseCountScore * (1-ratios.phraseCount)
    that.scores.wordOrder = that.averageStaticScores().wordOrder * ratios.wordOrder + _wordOrderScore * (1-ratios.wordOrder)
  } else {
    that.scores.phraseCount = that.phraseCountScore(sourceNgramArray, targetNgramArray)
    that.scores.wordOrder = that.wordOrderScore(sourceString, targetString)
  }

  that.scores.sizeDelta = that.sizeDeltaScore(sourceString, targetString)

  if (that.isCorrection) {
    that.weightSum = that.weightSum + that.options.align.weights.ngram * (that.options.align.corrections.ngramMultiplier - 1)
  }
  that.confidence = (
    that.options.align.weights.ratio * that.scores.ratio +
    that.options.align.weights.uniqueness * that.scores.uniqueness +
    that.options.align.weights.ngram * (that.isCorrection ? that.options.align.corrections.ngramMultiplier : 1) * that.scores.ngram +
    that.options.align.weights.phraseCount * that.scores.phraseCount +
    that.options.align.weights.wordOrder * that.scores.wordOrder +
    that.options.align.weights.sizeDelta * that.scores.sizeDelta
  ) / that.weightSum
  if (that.isCorrection == true) {
    that.confidence = that.confidence + that.options.align.bonus.correction
  }
  that.confidence = Math.round(that.confidence * 1000) / 1000
  if (Number.isNaN(that.confidence) || that.confidence === 0) {console.log(that)}
}
// instead of previous approach of conflicts, look to see what is needed
Alignment.prototype.isNeeded = function(sourceNeededString, targetNeededString) {
  if (this.sourceNeeded && this.source !== ' ') { // don't check again if it wasn't needed already
    var regexSource = new RegExp("( |^)+?" + this.source + "( |$)+?", '')
    if (sourceNeededString.search(regexSource) == -1) {
      this.sourceNeeded = false
    }
  }
  if (this.targetNeeded && this.target !== ' ') { // don't check again if it wasn't needed already
    var regexTarget = new RegExp("( |^)+?" + this.target + "( |$)+?", '')
    if ((targetNeededString.search(regexTarget) == -1)) {
      this.targetNeeded = false
    }
  }
}

exports = module.exports = Alignment
