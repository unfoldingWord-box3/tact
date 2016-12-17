var tools = require('./tools.js')
var ngram = require('./ngram.js')
var tokenizer = require('./tokenizer.js')
var async = require('async')
var DB = require('./db.js')
var Alignment = require('./alignment.js')

function Table(tableName, options) {
  this.tableName = tableName
  this.options = options
  this.isCorrections = (this.tableName === 'corrections')
  this.db = new DB()
  this.namespace = this.options.global.sourceLanguage+'-'+this.options.global.targetLanguage+'-'+this.tableName
  this.table = this.db.table(this.namespace)
}

Table.prototype.cleanup = function(callback) {
  var that = this
  that.table.setItem('phraseIndex', {}, function() {
    that.table.setItem('trainingSet', [], function() {
      that.table.clear(callback)
    })
  })
}

Table.prototype.getCount = function(callback) {
  this.table.length(function(err,length) {
    callback(length)
  })
}

Table.prototype.store = function(_sourceIndex, _targetIndex, _trainingSet, progress, callback) {
  var that = this
  that.table.setItem('sourceIndex', _sourceIndex, function() {
    progress(0.5)
    that.table.setItem('targetIndex', _targetIndex, function() {
      progress(0.75)
      that.table.setItem('trainingSet', _trainingSet, function() {
        progress(1.0)
        callback()
      })
    })
  })
}

Table.prototype.dynamicTrain = function(_sourceIndex, _targetIndex, _trainingSet, alignmentPair, callback) {
  var alignments = [] // response
  if (_trainingSet === null) _trainingSet = []
  if (_trainingSet.length === 0) {
    callback(alignments)
  } else {
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
    this.permutations(alignmentPair, trainingPairs, callback)
  }
}

Table.prototype.permutations = function(alignmentPair, trainingPairs, callback) {
  var alignments = [] // response
  if (trainingPairs.length > 0) {
    var that = this
    var sourceAlignmentPhrases = ngram.ngram(alignmentPair[0], that.options.global.ngram.source)
    var targetAlignmentPhrases = ngram.ngram(alignmentPair[1], that.options.global.ngram.target)

    var sources = {}, targets = {}, permutations = {}
    trainingPairs.forEach(function(trainingPair, i) {
      var sourceTrainingPhrases, targetTrainingPhrases
      if (that.isCorrections) {
        sourceTrainingPhrases = [trainingPair[0]]
        targetTrainingPhrases = [trainingPair[1]]
      } else {
        sourceTrainingPhrases = ngram.ngram(trainingPair[0], that.options.global.ngram.source)
        targetTrainingPhrases = ngram.ngram(trainingPair[1], that.options.global.ngram.target)
        sourceTrainingPhrases.push(' ')
        targetTrainingPhrases.push(' ')
      }
      var sourceIntersection = tools.intersect(sourceAlignmentPhrases, sourceTrainingPhrases)
      var targetIntersection = tools.intersect(targetAlignmentPhrases, targetTrainingPhrases)
      if (sourceIntersection.length > 0 || targetIntersection.length > 0) {
        if (!that.isCorrections) {
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

        sourceIntersection.forEach(function(sourcePhrase) {
          // the intersection of the intersection is where to get the true tallies
          if (permutations[sourcePhrase] === undefined) permutations[sourcePhrase] = {}
          targetIntersection.forEach(function(targetPhrase) {
            // this next object is the basis of an alignment object
            var alignment = new Alignment(that.options, sourcePhrase, targetPhrase, that.isCorrections)
            alignment.addTally(1)
            // go ahead and do static scoring while inside
            alignment.addStaticScore(trainingPair[0], trainingPair[1])
            permutations[sourcePhrase][targetPhrase] = alignment
          })
        })
      }
    })

    tools.forObject(permutations, function(source, _targets) {
      tools.forObject(_targets, function(target, alignment) {
        alignment.addLocalTotals(sources[source].local, targets[target].local)
        alignment.addGlobalTotals(sources[source].global, targets[target].global)
        alignment.score(alignmentPair)
        alignments.push(alignment)
      })
    })
    sources = {}
    targets = {}
    permutations = {}
  }
  callback(alignments)
}

Table.prototype.sourceIndex = function(callback) {
  this.table.getItem('sourceIndex', function(err, _sourceIndex) {
    callback(_sourceIndex)
  })
}

Table.prototype.targetIndex = function(callback) {
  this.table.getItem('targetIndex', function(err, _targetIndex) {
    callback(_targetIndex)
  })
}

Table.prototype.trainingSet = function(callback) {
  this.table.getItem('trainingSet', function(err, _trainingSet) {
    callback(_trainingSet)
  })
}

Table.prototype.phrases = function(alignmentPair, callback) {
  var that = this
  that.sourceIndex(function(_sourceIndex) {
    that.targetIndex(function(_targetIndex) {
      that.trainingSet(function(_trainingSet) {
        that.dynamicTrain(_sourceIndex, _targetIndex, _trainingSet, alignmentPair, function(alignments) {
          callback(alignments)
        })
      })
    })
  })
}


exports = module.exports = Table
