var config = require('../config.js')
var tools = require('./tools.js')
var async = require('async')
var scoring = require('./scoring.js')
var db = require('./db.js')

db.init()

var table = {

  table: function(tableName) {
    return db.localforage.createInstance({"name": config.global.sourceLanguage+'-'+config.global.targetLanguage+'-'+tableName})
  },

  cleanup: function(tableName, callback) {
    this.table(tableName).clear(callback)
  },

  init: function(tableName, callback) {
    var _this = this
    this.cleanup(tableName, function(){
      callback(_this.table(tableName))
    })
  },

  getCount: function(tableName, callback) {
    this.table(tableName).length(function(err,length) {
      callback(length)
    });
  },

  store: function(tableName, phraseIndex, trainingSet, progress, callback) {
    var _this = this
    this.table(tableName).setItem('phraseIndex', phraseIndex, function() {
      progress(0.66)
      _this.table(tableName).setItem('trainingSet', trainingSet, function() {
        progress(1.0)
        callback()
      })
    })
  },

  calculateAlignments: function(tableName, source, trainingPairs, sourceString, targetString) {
    var alignments = []

    var sourcePhrases = tools.ngram(sourceString, config.global.ngram.source)
    var targetPhrases = tools.ngram(targetString, config.global.ngram.target)

    var globalSourceTotal = 0
    var localSourceTotal = 0
    var targets = {}

    trainingPairs.forEach(function(trainingPair, _index) {
      var trainingTargetLine = trainingPair[1]
      var trainingTargetPhrases = tools.ngram(trainingTargetLine, config.global.ngram.target)
      trainingTargetPhrases.forEach(function(target, index) {
        if (targetPhrases.indexOf(target) > -1) {
          if (targets[target] === undefined) targets[target] = []
          var staticScore = scoring.staticScore(source, target, trainingPair[0], trainingPair[1])
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
        conflict: false,
        sourceUsed: false,
        correction: (tableName == 'corrections')
      }
      alignment = scoring.score(sourceString, targetString, alignment)
      alignments.push(alignment)
    })
    return alignments
  },

  dynamicTrain: function(tableName, phraseIndex, trainingSet, sourceString, targetString, callback) {
    var _this = this
    var alignments = []
    var sourcePhrases = tools.ngram(sourceString, config.global.ngram.source)
    sourcePhrases.forEach(function(sourcePhrase, i) {
      var indices = phraseIndex[sourcePhrase]
      if (indices !== undefined) {
        var trainingPairs = []
        indices.forEach(function(index, _index) {
          var trainingPair = trainingSet[index]
          trainingPairs.push(trainingPair)
        })
        var _alignments = _this.calculateAlignments(tableName, sourcePhrase, trainingPairs, sourceString, targetString)
        alignments = alignments.concat(_alignments)
      }
    })
    callback(alignments)
  },

  phrases: function(tableName, sourceString, targetString, callback) {
    var _this = this
    this.table(tableName).getItem('phraseIndex', function(err, phraseIndex) {
      _this.table(tableName).getItem('trainingSet', function(err, trainingSet) {
        _this.dynamicTrain(tableName, phraseIndex, trainingSet, sourceString, targetString, callback)
      })
    })
  }
}

exports = module.exports = table
