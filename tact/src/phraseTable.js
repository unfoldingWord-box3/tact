var tools = require('./tools.js')
var ngram = require('./ngram.js')
var table = require('./table.js')
var scoring = require('./scoring.js')
var tokenizer = require('./tokenizer.js')

var phraseTable = {
  tableName: 'phrases',
  table: table,
  sourceIndex: {},
  targetIndex: {},
  prune: function(options, alignmentPair, callback) {
    table.phrases(options, this.tableName, alignmentPair, callback)
  },

  append: function(options, pair, index) {
    var source = pair[0], target = pair[1]
    var sourceWords = tokenizer.tokenize(source)
    sourceWords.forEach(function(sourceWord, _index) {
      if (phraseTable.sourceIndex[sourceWord] === undefined) {
        phraseTable.sourceIndex[sourceWord] = []
      }
      phraseTable.sourceIndex[sourceWord].push(index)
    })
    var targetWords = tokenizer.tokenize(target)
    targetWords.forEach(function(targetWord, _index) {
      if (phraseTable.targetIndex[targetWord] === undefined) {
        phraseTable.targetIndex[targetWord] = []
      }
      phraseTable.targetIndex[targetWord].push(index)
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
        phraseTable.append(options, pair, index)
      })
      progress(0.33)
      console.log("storing phraseIndex...")
      table.store(options, phraseTable.tableName, phraseTable.sourceIndex, phraseTable.targetIndex, trainingSet, progress, function() {
        phraseTable.sourceIndex = {}
        phraseTable.targetIndex = {}
        callback()
      })
    })
  }
}

exports = module.exports = phraseTable
