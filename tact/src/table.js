var tools = require('./tools.js')
var ngram = require('./ngram.js')
var tokenizer = require('./tokenizer.js')
var async = require('async')
var scoring = require('./scoring.js')
var db = require('./db.js')

function Table(tableName, options) {

  db.init()
  var namespace = options.global.sourceLanguage+'-'+options.global.targetLanguage+'-'+tableName
  var table = db.localforage.createInstance({"name": namespace})

  this.cleanup = function(callback) {
    table.setItem('phraseIndex', {}, function() {
      table.setItem('trainingSet', [], function() {
        table.clear(callback)
      })
    })
  }

  this.getCount = function(callback) {
    table.length(function(err,length) {
      callback(length)
    })
  }

  this.store = function(_sourceIndex, _targetIndex, _trainingSet, progress, callback) {
    table.setItem('sourceIndex', _sourceIndex, function() {
      progress(0.5)
      table.setItem('targetIndex', _targetIndex, function() {
        progress(0.75)
        table.setItem('trainingSet', _trainingSet, function() {
          progress(1.0)
          callback()
        })
      })
    })
  }

  var dynamicTrain = function(_sourceIndex, _targetIndex, _trainingSet, alignmentPair, callback) {
    var alignments = [] // response
    var isCorrection = (tableName == 'corrections')
    var sourceWords = tokenizer.tokenize(alignmentPair[0])
    var targetWords = tokenizer.tokenize(alignmentPair[1])
    var trainingIndices = {}
    sourceWords.forEach(function(sourceWord, i) {
      var indices = _sourceIndex[sourceWord]
      if (indices !== undefined) {
        indices.forEach(function(indice) {
          trainingIndices[indice] = true
        })
      }
    })
    targetWords.forEach(function(targetWord, i) {
      var indices = _targetIndex[targetWord]
      if (indices !== undefined) {
        indices.forEach(function(indice) {
          trainingIndices[indice] = true
        })
      }
    })
    var trainingPairs = []
    Object.keys(trainingIndices).forEach(function(indice, i) {
      var trainingPair = _trainingSet[indice]
      trainingPairs.push(trainingPair)
    })
    trainingIndices = {}
    permutations(alignmentPair, trainingPairs, callback)
  }

  var permutations = function(alignmentPair, trainingPairs, callback) {
    var alignments = [] // response
    var sourceAlignmentPhrases = ngram.ngram(alignmentPair[0], options.global.ngram.source)
    var targetAlignmentPhrases = ngram.ngram(alignmentPair[1], options.global.ngram.target)

    var sources = {}, targets = {}, permutations = {}
    trainingPairs.forEach(function(trainingPair, i) {
      var sourceTrainingPhrases, targetTrainingPhrases
      if (tableName == 'corrections') {
        sourceTrainingPhrases = [trainingPair[0]]
        targetTrainingPhrases = [trainingPair[1]]
      } else {
        sourceTrainingPhrases = ngram.ngram(trainingPair[0], options.global.ngram.source)
        targetTrainingPhrases = ngram.ngram(trainingPair[1], options.global.ngram.target)
        sourceTrainingPhrases.push(' ')
        targetTrainingPhrases.push(' ')
      }
      var sourceIntersection = tools.intersect(sourceAlignmentPhrases, sourceTrainingPhrases)
      var targetIntersection = tools.intersect(targetAlignmentPhrases, targetTrainingPhrases)
      if (tableName !== 'corrections') {
        sourceIntersection.push(' ')
        targetIntersection.push(' ')
        // seed sources and targets with tallies for ' '
        sources[' '] = {global: trainingPairs.length, local: 1}
        targets[' '] = {global: trainingPairs.length, local: 1}
      }
      // loop through the target training phrases to get target global/local totals
      targetTrainingPhrases.forEach(function(targetPhrase) {
        if (targets[targetPhrase] === undefined) targets[targetPhrase] = {global: 0, local: 0}
        if (targetPhrase !== ' ') {
          targets[targetPhrase].global += sourceTrainingPhrases.length // tally up all source phrases for global totals
        }
        targets[targetPhrase].local += sourceIntersection.length // if there is both source/target, tally up source phrases for local totals
      })
      // loop through source training phrases and total up source global/local totals
      sourceTrainingPhrases.forEach(function(sourcePhrase) {
        if (sources[sourcePhrase] === undefined) sources[sourcePhrase] = {global: 0, local: 0}
        if (sourcePhrase !== ' ') {
          sources[sourcePhrase].global += targetTrainingPhrases.length // tally up all target phrases for global totals
        }
        sources[sourcePhrase].local += targetIntersection.length // if there is both source/target, tally up target phrases for local totals
      })
      //
      sourceIntersection.forEach(function(sourcePhrase) {
        // the intersection of the intersection is where to get the true tallies
        if (permutations[sourcePhrase] === undefined) permutations[sourcePhrase] = {}
        targetIntersection.forEach(function(targetPhrase) {
          // this next object is the basis of an alignment object
          var alignment = {tally: 0, staticScores: []}
          if (permutations[sourcePhrase][targetPhrase] === undefined) permutations[sourcePhrase][targetPhrase] = alignment
          permutations[sourcePhrase][targetPhrase].tally ++
          // go ahead and do static scoring while inside
          var staticScore = scoring.staticScore(options, sourcePhrase, targetPhrase, trainingPair[0], trainingPair[1])
          permutations[sourcePhrase][targetPhrase].staticScores.push(staticScore)
        })
      })
    })
    tools.forObject(permutations, function(source, _targets) {
      tools.forObject(_targets, function(target, alignment) {
        alignment.source = source
        alignment.target = target
        alignment.localSourceTotal  = sources[source].local
        alignment.globalSourceTotal = sources[source].global
        alignment.localTargetTotal  = targets[target].local
        alignment.globalTargetTotal = targets[target].global
        alignment.staticScore = tools.averageObjects(alignment.staticScores)
        alignment.sourceNeeded = true
        alignment.targetNeeded = true
        alignment.conflict = false
        alignment.sourceUsed = false
        alignment.correction = (tableName == 'corrections')
        alignment = scoring.score(options, alignmentPair, alignment)
        alignments.push(alignment)
      })
    })
    sources = {}
    targets = {}
    permutations = {}
    callback(alignments)
  }

  var sourceIndex = function(callback) {
    table.getItem('sourceIndex', function(err, _sourceIndex) {
      callback(_sourceIndex)
    })
  }
  this.sourceIndex = sourceIndex

  var targetIndex = function(callback) {
    table.getItem('targetIndex', function(err, _targetIndex) {
      callback(_targetIndex)
    })
  }
  this.targetIndex = targetIndex

  var trainingSet = function(callback) {
    table.getItem('trainingSet', function(err, _trainingSet) {
      callback(_trainingSet)
    })
  }
  this.trainingSet = trainingSet

  this.phrases = function(alignmentPair, callback) {
    sourceIndex(function(_sourceIndex) {
      targetIndex(function(_targetIndex) {
        trainingSet(function(_trainingSet) {
          dynamicTrain(_sourceIndex, _targetIndex, _trainingSet, alignmentPair, function(alignments) {
            callback(alignments)
          })
        })
      })
    })
  }
}

exports = module.exports = Table
