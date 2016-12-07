var config = require('../config.js')
var tools = require('./tools.js')
var table = require('./table.js')
var scoring = require('./scoring.js')


var correctionsTable = {
  tableName: 'corrections',
  table: table,
  phraseIndex: {},
  prune: function(sourceString, targetString, callback) {
    table.phrases(this.tableName, sourceString, targetString, function(alignments) {
      callback(alignments)
    })
  },

  append: function(source, index) {
    if (this.phraseIndex[source] === undefined) {
      this.phraseIndex[source] = []
    }
    this.phraseIndex[source].push(index);
  },

  // can pass in table so that it can incriment counts
  generate: function(trainingSet, progress, callback) {
    var __this = this
    table.init(this.tableName, function(){
      // loop through trainingSet
      // generate ngrams of source and target
      var count = trainingSet.length
      console.log("indexing phrases...")
      trainingSet.forEach(function(pair, index) {
        var source = pair[0]
        __this.append(source, index)
      })
      progress(0.33)
      console.log("storing phraseIndex...")
      table.store(__this.tableName, __this.phraseIndex, trainingSet, progress, function() {
        __this.phraseIndex = {}
        callback()
      })
    })
  }
}

exports = module.exports = correctionsTable
