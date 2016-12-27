var tools = require('./tools.js')
var ngram = require('./ngram.js')
var tokenizer = require('./tokenizer.js')

function Alignment(options, source, target, isCorrection, isAlignment) {
  if (options.constructor !== Object) throw 'Alignment() options is not Object: ' + options
  if (typeof source !== 'string') throw 'Alignment(source) source is not String: ' + source
  if (typeof target !== 'string') throw 'Alignment(target) target is not String: ' + target
  this.source = source
  this.target = target
  this.options = options
  this.isCorrection = isCorrection
  this.isAlignment = isAlignment

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

////// IF WORD IS ONLY IN A CORRECTION THAT IS A LONGER PHRASE, FIND THE PATTERN AND MIMIC.

////// IF A PHRASE IS NOT USED MORE THAN ONCE IT IS NOT A PHRASE, IT'S JUST AN NGRAM

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
Alignment.prototype.ngramScore = function(alignmentPair) {
  var ngramScore // response
  var sourceNgramCount = tokenizer.tokenize(this.source).length
  var targetNgramCount = tokenizer.tokenize(this.target).length
  if (sourceNgramCount === 0 || targetNgramCount === 0) {
    ngramScore = 0
  } else {
    if (this.isCorrection) {
      var deltaNgramMax = Math.abs(this.options.global.ngram.source - sourceNgramCount)
      ngramScore = 1/(deltaNgramMax+1)
    } else {
      if (alignmentPair[1] === undefined) alignmentPair[1] = ''
      var sourceStringNgramCount = tokenizer.tokenize(alignmentPair[0]).length
      var targetStringNgramCount = tokenizer.tokenize(alignmentPair[1]).length
      var sourceNgramRatio = sourceNgramCount / sourceStringNgramCount
      var targetNgramRatio = targetNgramCount / targetStringNgramCount
      var deltaNgramRatio =  Math.abs(sourceNgramRatio - targetNgramRatio)
      ngramScore = Math.pow( (1.00 - deltaNgramRatio), 5 )
    }
  }
  return ngramScore
}
// favor words/phrases that occur same number of times in source and target
Alignment.prototype.phraseCountScore = function(alignmentPair) {
  var that = this
  var sourceString = alignmentPair[0], targetString = alignmentPair[1]
  var sourceNgramArray = ngram.ngram(sourceString, that.options.global.ngram.source)
  var targetNgramArray = ngram.ngram(targetString, that.options.global.ngram.target)
  if (that.source === ' ' || that.target === ' ') return 0.6
  var sourceMatchCount = tools.countInArray(sourceNgramArray, that.source)
  var targetMatchCount = tools.countInArray(targetNgramArray, that.target)
  var deltaCount = Math.abs(sourceMatchCount - targetMatchCount)
  return 1/(deltaCount+1)
}
// favor words/phrases that occur in the same place in the sentence
Alignment.prototype.wordOrderScore = function(alignmentPair) {
  var that = this
  var sourceString = alignmentPair[0], targetString = alignmentPair[1]
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
Alignment.prototype.sizeDeltaScore = function(alignmentPair) {
  var that = this
  if (that.target == ' ') return 0.6
  var sourceSizeRatio = that.source.length/alignmentPair[0].length
  var targetSizeRatio = that.target.length/alignmentPair[1].length
  var deltaSizeRatio = Math.abs(sourceSizeRatio - targetSizeRatio)
  return Math.pow( (1 - deltaSizeRatio), 5 )
}
// score based on factors that don't change once new corpus is added, used during training
Alignment.prototype.addStaticScore = function(trainingPair) {
  var that = this
  var staticScore = {
    phraseCount: that.phraseCountScore(trainingPair),
    wordOrder: that.wordOrderScore(trainingPair),
    sizeDelta: that.sizeDeltaScore(trainingPair),
    ngram: that.ngramScore(trainingPair)
  }
  this.staticScores.push(staticScore)
}
// calculate the static scores
Alignment.prototype.getStaticScore = function(alignmentPair) {
  if (this.isAlignment) {
    if (this.staticScores.length > 0) {
      var _phraseCountScore = this.phraseCountScore(alignmentPair)
      var _wordOrderScore = this.wordOrderScore(alignmentPair)
      var _sizeDeltaScore = this.sizeDeltaScore(alignmentPair)
      var _ngramScore = this.ngramScore(alignmentPair)
      var ratios = this.options.align.staticScoreRatios
      var averageStaticScores = this.averageStaticScores()
      this.scores.phraseCount = averageStaticScores.phraseCount * ratios.phraseCount + _phraseCountScore * (1-ratios.phraseCount)
      this.scores.wordOrder = averageStaticScores.wordOrder * ratios.wordOrder + _wordOrderScore * (1-ratios.wordOrder)
      this.scores.sizeDelta = averageStaticScores.sizeDelta * ratios.sizeDelta + _sizeDeltaScore * (1-ratios.sizeDelta)
      this.scores.ngram = averageStaticScores.ngram * ratios.ngram + _ngramScore * (1-ratios.ngram)
    } else {
      this.scores.phraseCount = this.phraseCountScore(alignmentPair)
      this.scores.wordOrder = this.wordOrderScore(alignmentPair)
      this.scores.sizeDelta = this.sizeDeltaScore(alignmentPair)
      this.scores.ngram = this.ngramScore(alignmentPair)
    }
  } else {
    var averageStaticScores = this.averageStaticScores()
    this.scores.phraseCount = averageStaticScores.phraseCount
    this.scores.wordOrder = averageStaticScores.wordOrder
    this.scores.sizeDelta = averageStaticScores.sizeDelta
    this.scores.ngram = averageStaticScores.ngram
  }
}
// score the alignment based on the criteria such as ngram length
Alignment.prototype.score = function(alignmentPair) {
  var that = this
  that.weightSum = tools.sum(that.options.align.weights)
  that.ratioScore()
  that.uniquenessScore()
  that.getStaticScore(alignmentPair)

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
  if (Number.isNaN(that.confidence) || that.confidence === 0) {console.log(alignmentPair, that)}
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
