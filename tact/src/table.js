var tools = require('./tools.js')
var ngram = require('./ngram.js')
var tokenizer = require('./tokenizer.js')
var async = require('async')
var scoring = require('./scoring.js')
var db = require('./db.js')

var table = {
  cache: {},
  table: function(options, tableName) {
    db.init()
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

  store: function(options, tableName, sourceIndex, targetIndex, trainingSet, progress, callback) {
    this.cache[tableName+'-sourceIndex'] = sourceIndex
    this.cache[tableName+'-targetIndex'] = targetIndex
    this.cache[tableName+'-trainingSet'] = trainingSet
    this.table(options, tableName).setItem('sourceIndex', sourceIndex, function() {
      progress(0.5)
      table.table(options, tableName).setItem('targetIndex', targetIndex, function() {
        progress(0.75)
        table.table(options, tableName).setItem('trainingSet', trainingSet, function() {
          progress(1.0)
          callback()
        })
      })
    })
  },

  dynamicTrain: function(options, tableName, sourceIndex, targetIndex, trainingSet, alignmentPair, callback) {
    var alignments = [] // response
    var isCorrection = (tableName == 'corrections')
    var sourceWords = tokenizer.tokenize(alignmentPair[0])
    var targetWords = tokenizer.tokenize(alignmentPair[1])
    var trainingIndices = {}
    sourceWords.forEach(function(sourceWord, i) {
      var indices = sourceIndex[sourceWord]
      if (indices !== undefined) {
        indices.forEach(function(indice) {
          trainingIndices[indice] = true
        })
      }
    })
    targetWords.forEach(function(targetWord, i) {
      var indices = targetIndex[targetWord]
      if (indices !== undefined) {
        indices.forEach(function(indice) {
          trainingIndices[indice] = true
        })
      }
    })
    var trainingPairs = []
    Object.keys(trainingIndices).forEach(function(indice, i) {
      var trainingPair = trainingSet[indice]
      trainingPairs.push(trainingPair)
    })
    alignments = table.permutations(options, tableName, alignmentPair, trainingPairs)
    callback(alignments)
  },

  permutations: function(options, tableName, alignmentPair, trainingPairs) {
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
      }

      var sourceIntersection = tools.intersect(sourceAlignmentPhrases, sourceTrainingPhrases)
      var targetIntersection = tools.intersect(targetAlignmentPhrases, targetTrainingPhrases)

      // loop through the inverse to get target global/local totals
      targetIntersection.forEach(function(targetPhrase) {
        if (targets[targetPhrase] === undefined) targets[targetPhrase] = {global: 0, local: 0}
        targets[targetPhrase].global = targets[targetPhrase].global + sourceTrainingPhrases.length // tally up all source phrases for global totals
        if (sourceIntersection.length > 0) targets[targetPhrase].local = targets[targetPhrase].local + sourceTrainingPhrases.length // if there is both source/target, tally up source phrases for local totals
      })
      // loop through source intersection and total up source global/local totals
      sourceIntersection.forEach(function(sourcePhrase) {
        if (sources[sourcePhrase] === undefined) sources[sourcePhrase] = {global: 0, local: 0}
        sources[sourcePhrase].global = sources[sourcePhrase].global + targetTrainingPhrases.length // tally up all target phrases for global totals
        if (targetIntersection.length > 0) sources[sourcePhrase].local = sources[sourcePhrase].local + targetTrainingPhrases.length // if there is both source/target, tally up target phrases for local totals
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
    return alignments
  },

  sourceIndex: function(options, tableName, callback) {
    var sourceIndex = table.cache[tableName+'-sourceIndex']
    if (sourceIndex !== undefined) {
      callback(sourceIndex)
    } else {
      table.table(options, tableName).getItem('sourceIndex', function(err, sourceIndex) {
        table.cache[tableName+'-sourceIndex'] = sourceIndex
        callback(sourceIndex)
      })
    }
  },

  targetIndex: function(options, tableName, callback) {
    var targetIndex = table.cache[tableName+'-targetIndex']
    if (targetIndex !== undefined) {
      callback(targetIndex)
    } else {
      table.table(options, tableName).getItem('targetIndex', function(err, targetIndex) {
        table.cache[tableName+'-targetIndex'] = targetIndex
        callback(targetIndex)
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

  phrases: function(options, tableName, alignmentPair, callback) {
    table.sourceIndex(options, tableName, function(sourceIndex) {
      table.targetIndex(options, tableName, function(targetIndex) {
        table.trainingSet(options, tableName, function(trainingSet) {
          table.dynamicTrain(options, tableName, sourceIndex, targetIndex, trainingSet, alignmentPair, function(alignments) {
            callback(alignments)
          })
        })
      })
    })
  }
}

exports = module.exports = table
