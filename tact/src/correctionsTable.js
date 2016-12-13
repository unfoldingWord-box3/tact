var tools = require('./tools.js')
var table = require('./table.js')
var scoring = require('./scoring.js')
var tokenizer = require('./tokenizer.js')

var correctionsTable = {
  tableName: 'corrections',
  table: table,
  sourceIndex: {},
  targetIndex: {},
  prune: function(options, alignmentPair, callback) {
    table.phrases(options, this.tableName, alignmentPair, callback)
  },

  append: function(pair, index) {
    var source = pair[0], target = pair[1]
    var sourceWords = tokenizer.tokenize(source)
    sourceWords.forEach(function(sourceWord, _index) {
      if (correctionsTable.sourceIndex[sourceWord] === undefined) {
        correctionsTable.sourceIndex[sourceWord] = []
      }
      correctionsTable.sourceIndex[sourceWord].push(index)
    })
    var targetWords = tokenizer.tokenize(target)
    targetWords.forEach(function(targetWord, _index) {
      if (correctionsTable.targetIndex[targetWord] === undefined) {
        correctionsTable.targetIndex[targetWord] = []
      }
      correctionsTable.targetIndex[targetWord].push(index)
    })
  },

  // can pass in table so that it can incriment counts
  generate: function(options, trainingSet, progress, callback) {
    table.init(options, this.tableName, function(){
      // loop through trainingSet
      // generate ngrams of source and target
      var count = trainingSet.length
      console.log("indexing phrases...")
      trainingSet.forEach(function(pair, index) {
        correctionsTable.append(pair, index)
      })
      progress(0.25)
      console.log("storing phraseIndex...")
      table.store(options, correctionsTable.tableName, correctionsTable.sourceIndex, correctionsTable.targetIndex, trainingSet, progress, function() {
        correctionsTable.sourceIndex = {}
        correctionsTable.targetIndex = {}
        callback()
      })
    })
  }
}

exports = module.exports = correctionsTable
