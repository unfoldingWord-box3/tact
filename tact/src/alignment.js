var tools = require('./tools.js')
var ngram = require('./ngram.js')
var tokenizer = require('./tokenizer.js')

function Alignment(options, source, target, isCorrection, isAlignment) {
  if (options.constructor !== Object) throw 'Alignment() options is not Object: ' + options
  if (typeof source !== 'string') throw 'Alignment(source) source is not String: ' + source
  if (typeof target !== 'string') throw 'Alignment(target) target is not String: ' + target
  this.source = source
  this.target = target
  this.sourceTokens = tokenizer.tokenize(this.source)
  this.targetTokens = tokenizer.tokenize(this.target)
  this.regexSource = new RegExp('(^|\\s)('+this.source+')(?=\\s|$)', 'g')
  this.regexTarget = new RegExp('(^|\\s)('+this.target+')(?=\\s|$)', 'g')
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
    globalTarget: 0,
    corpusSource: 0,
    corpusTarget: 0
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
    common: 0
  }

  this.confidence = 0

  this.staticScores = []
}

////// IF WORD IS ONLY IN A CORRECTION THAT IS A LONGER PHRASE, FIND THE PATTERN AND MIMIC.

Alignment.prototype.addTally = function(tally) {
  this.totals.tally += tally
}

Alignment.prototype.addLocalTotals = function(localSourceCount, localTargetCount) {
  this.totals.localSource += localSourceCount
  this.totals.localTarget += localTargetCount
}

Alignment.prototype.addGlobalTotals = function(globalSourceCount, globalTargetCount) {
  this.totals.globalSource += globalSourceCount
  this.totals.globalTarget += globalTargetCount
}

Alignment.prototype.addCorpusTotals = function(corpusSourceCount, corpusTargetCount) {
  this.totals.corpusSource += corpusSourceCount
  this.totals.corpusTarget += corpusTargetCount
}

Alignment.prototype.averageStaticScores = function() {
  return tools.averageObjects(this.staticScores)
}
// If an ngram is not used often, it is likely not a phrase, the more it is found, the more likely it is a phrase
Alignment.prototype.isPhraseScore = function() {
  var isPhrase
  if (this.sourceTokens.length === 1 && this.targetTokens.length === 1) {
    isPhrase = 1
  } else {
    isPhrase = this.commonScore()
  }
  return isPhrase
}
// calculate floor of source/target commonality of the phrase 1-(1/x) x:1,y:0; x:2,y:0.5; x:100,y:0.99...
Alignment.prototype.commonScore = function() {
  var common = 0
  if (this.sourceTokens.length > 0 && this.targetTokens.length > 0) {
    var sourceCommonScore = 1-(1/this.totals.corpusSource)
    var targetCommonScore = 1-(1/this.totals.corpusTarget)
    var tallyCommonScore = 1-(1/this.totals.tally)
    var common = Math.min(sourceCommonScore, targetCommonScore)
    var common = (common + tallyCommonScore) / 2
  }
  if (common <= 0.1) common = 0.1
  return common
}

Alignment.prototype.ratioScore = function() {
  var that = this
  that.ratios.localSource = that.totals.tally / that.totals.localSource
  that.ratios.localTarget = that.totals.tally / that.totals.localTarget
  that.ratios.local = (that.ratios.localSource + that.ratios.localTarget) / 2

  that.ratios.globalSource = that.totals.tally / that.totals.globalSource
  that.ratios.globalTarget = that.totals.tally / that.totals.globalTarget
  that.ratios.global = (that.ratios.globalSource + that.ratios.globalTarget) / 2

  that.scores.ratio = (
    that.ratios.local +
    that.ratios.global
  )/2
  if (Number.isNaN(that.scores.ratio) || that.ratios.global === undefined) console.log(that)
}

Alignment.prototype.uniquenessScore = function() {
  var that = this
  that.uniqueness.source = that.totals.localSource / that.totals.globalSource
  that.uniqueness.target = that.totals.localTarget / that.totals.globalTarget
  var deltaUniqueness = Math.abs(that.uniqueness.source - that.uniqueness.target)
  deltaUniqueness = Math.min(Math.max(deltaUniqueness, 0), 0.99)
  that.scores.uniqueness = 1.00 - deltaUniqueness // if the delta of uniqueness is great, make score lower, if the delta is small, make score higher
}
// favor phrases over words
Alignment.prototype.ngramScore = function(alignmentPair) {
  var ngramScore // response
  var sourceNgramCount = this.sourceTokens.length
  var targetNgramCount = this.targetTokens.length
  if (sourceNgramCount === 0 || targetNgramCount === 0) {
    ngramScore = 0.8
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
Alignment.prototype.phraseCountScore = function(alignmentPair, verbose) {
  var that = this
  var sourceString = alignmentPair[0], targetString = alignmentPair[1]
  if (that.source === ' ' || that.target === ' ') return 0.8
  var sourceMatchCount = tools.match(that.source, sourceString).length
  var targetMatchCount = tools.match(that.target, targetString).length
  var deltaCount = Math.abs(sourceMatchCount - targetMatchCount)
  if (verbose) console.log(sourceMatchCount, targetMatchCount, deltaCount)
  return 1/(deltaCount+1)
}
// favor words/phrases that occur in the same place in the sentence
Alignment.prototype.wordOrderScore = function(alignmentPair) {
  var that = this
  var sourceString = alignmentPair[0], targetString = alignmentPair[1]
  if (that.source === ' ' || that.target === ' ') return 0.8
  if (targetString === ' ' || sourceString === ' ') return 0.8
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
Alignment.prototype.sizeDeltaScore = function() {
  var that = this
  if (that.target === ' ') return 0.8
  var sourceSize = that.source.length
  var targetSize = that.target.length
  var maxSize = Math.max(sourceSize, targetSize)
  var deltaSize = (maxSize - Math.abs(sourceSize - targetSize)) / maxSize
  return deltaSize
}
// score based on factors that don't change once new corpus is added, used during training
Alignment.prototype.addStaticScore = function(trainingPair) {
  var that = this
  var staticScore = {
    phraseCount: that.phraseCountScore(trainingPair),
    wordOrder: that.wordOrderScore(trainingPair),
    sizeDelta: that.sizeDeltaScore(),
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
      var _sizeDeltaScore = this.sizeDeltaScore()
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
      this.scores.sizeDelta = this.sizeDeltaScore()
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

  that.scores.common = that.commonScore()
  that.scores.isPhrase = that.isPhraseScore()

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

  that.confidence = that.scores.isPhrase * that.confidence

  if (that.isCorrection == true) {
    that.confidence = that.confidence + that.options.align.bonus.correction
  }

  that.confidence = Math.round(that.confidence * 10000) / 10000
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
