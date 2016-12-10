var tools = require('./tools.js')
var ngram = require('./ngram.js')
var async = require('async')
var scoring = require('./scoring.js')
var db = require('./db.js')

var table = {
  cache: {},
  table: function(options, tableName) {
    db.init(options)
    return db.localforage.createInstance({"name": options.global.sourceLanguage+'-'+options.global.targetLanguage+'-'+tableName})
  },

  cleanup: function(options, tableName, callback) {
    var _this = this
    this.table(options, tableName).setItem('phraseIndex', {}, function() {
      _this.table(options, tableName).setItem('trainingSet', [], function() {
        _this.table(options, tableName).clear(callback)
      })
    })
  },

  init: function(options, tableName, callback) {
    var _this = this
    this.cleanup(options, tableName, function(){
      callback(_this.table(options, tableName))
    })
  },

  getCount: function(options, tableName, callback) {
    this.table(options, tableName).length(function(err,length) {
      callback(length)
    });
  },

  store: function(options, tableName, phraseIndex, trainingSet, progress, callback) {
    var _this = this
    this.cache[tableName+'-phraseIndex'] = phraseIndex
    this.cache[tableName+'-trainingSet'] = trainingSet
    this.table(options, tableName).setItem('phraseIndex', phraseIndex, function() {
      progress(0.66)
      _this.table(options, tableName).setItem('trainingSet', trainingSet, function() {
        progress(1.0)
        callback()
      })
    })
  },

  calculateAlignments: function(options, tableName, source, trainingPairs, sourceString, targetString) {
    var alignments = []

    var isCorrection = (tableName == 'corrections')
    var targetPhrases = ngram.ngram(targetString, options.global.ngram.target)

    var globalSourceTotal = 0
    var localSourceTotal = 0
    var targets = {}

    trainingPairs.forEach(function(trainingPair, _index) {
      var trainingSourceLine = trainingPair[0]
      var trainingTargetLine = trainingPair[1]
      var trainingTargetPhrases = isCorrection ? [trainingTargetLine] : ngram.ngram(trainingTargetLine, options.global.ngram.target)
      trainingTargetPhrases.forEach(function(target, index) {
        if (targetPhrases.indexOf(target) > -1) {
          if (targets[target] === undefined) targets[target] = []
          var staticScore = scoring.staticScore(options, source, target, trainingSourceLine, trainingTargetLine)
          targets[target].push(staticScore)
          localSourceTotal ++
        }
        globalSourceTotal ++
      })
    })

    tools.forObject(targets, function(target, staticScores) {
      var tally = staticScores.length
      var staticScore = tools.averageObjects(targets[target])
      var alignment = {
        source: source, target: target, tally: tally,
        staticScore: staticScore,
        globalSourceTotal: globalSourceTotal,
        localSourceTotal: localSourceTotal,
        globalTargetTotal: 0,
        localTargetTotal: 0,
        sourceNeeded: true,
        targetNeeded: true,
        conflict: false,
        sourceUsed: false,
        correction: (tableName == 'corrections')
      }
      alignment = scoring.score(options, sourceString, targetString, alignment)
      alignments.push(alignment)
    })
    return alignments
  },

  dynamicTrain: function(options, tableName, phraseIndex, trainingSet, sourceString, targetString, callback) {
    var _this = this
    var alignments = []
    var isCorrection = (tableName == 'corrections')
    var sourcePhrases = ngram.ngram(sourceString, options.global.ngram.source)
    sourcePhrases.forEach(function(sourcePhrase, i) {
      var indices = phraseIndex[sourcePhrase]
      if (indices !== undefined) {
        var trainingPairs = []
        indices.forEach(function(index, _index) {
          var trainingPair = trainingSet[index]
          trainingPairs.push(trainingPair)
        })
        var _alignments = _this.calculateAlignments(options, tableName, sourcePhrase, trainingPairs, sourceString, targetString)
        alignments = alignments.concat(_alignments)
      }
    })
    callback(alignments)
  },

  phraseIndex: function(options, tableName, callback) {
    var phraseIndex = table.cache[tableName+'-phraseIndex']
    if (phraseIndex !== undefined) {
      callback(phraseIndex)
    } else {
      table.table(options, tableName).getItem('phraseIndex', function(err, phraseIndex) {
        table.cache[tableName+'-phraseIndex'] = phraseIndex
        callback(phraseIndex)
      })
    }
  },

  trainingSet: function(options, tableName, callback) {
    var trainingSet = table.cache[tableName+'-trainingSet']
    if (trainingSet !== undefined) {
      callback(trainingSet)
    } else {
      table.table(options, tableName).getItem('trainingSet', function(err, trainingSet) {
        table.cache[tableName+'-trainingSet'] = trainingSet
        callback(trainingSet)
      })
    }
  },

  phrases: function(options, tableName, sourceString, targetString, callback) {
    table.phraseIndex(options, tableName, function(phraseIndex) {
      table.trainingSet(options, tableName, function(trainingSet) {
        table.dynamicTrain(options, tableName, phraseIndex, trainingSet, sourceString, targetString, function(alignments) {
          callback(alignments)
        })
      })
    })
  }
}

exports = module.exports = table
