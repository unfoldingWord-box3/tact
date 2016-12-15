var tools = require('./tools.js')
var ngram = require('./ngram.js')
var Table = require('./table.js')
var scoring = require('./scoring.js')
var tokenizer = require('./tokenizer.js')

function PhraseTable(options) {
  var tableName = 'phrases'
  this.table = new Table(tableName, options)
  var sourceIndex = {}
  var targetIndex = {}

  this.prune = function(alignmentPair, callback) {
    this.table.phrases(alignmentPair, callback)
  }

  var append = function(pair, index) {
    var source = pair[0], target = pair[1]
    var sourceWords = tokenizer.tokenize(source)
    // sourceWords.push(' ')
    sourceWords.forEach(function(sourceWord, _index) {
      if (sourceIndex[sourceWord] === undefined) {
        sourceIndex[sourceWord] = []
      }
      sourceIndex[sourceWord].push(index)
    })
    var targetWords = tokenizer.tokenize(target)
    // targetWords.push(' ')
    targetWords.forEach(function(targetWord, _index) {
      if (targetIndex[targetWord] === undefined) {
        targetIndex[targetWord] = []
      }
      targetIndex[targetWord].push(index)
    })
  }

  // can pass in table so that it can incriment counts
  this.generate = function(trainingSet, progress, callback) {
    var _this = this
    this.table.cleanup(function(){
      sourceIndex = {}
      targetIndex = {}
      // loop through trainingSet
      console.log("indexing phrases...")
      trainingSet.forEach(function(pair, index) {
        append(pair, index)
      })
      progress(0.25)
      console.log("storing phraseIndex...")
      _this.table.store(sourceIndex, targetIndex, trainingSet, progress, function() {
        sourceIndex = {}
        targetIndex = {}
        callback()
      })
    })
  }
}

exports = module.exports = PhraseTable
