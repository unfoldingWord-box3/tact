var config = require('../config.js')
var tools = require('./tools.js')
var table = require('./table.js')
var scoring = require('./scoring.js')
var segmenter = require('./segmenter.js')

var phraseTable = {
  tableName: 'phrases',
  table: table,
  phraseIndex: {},
  prune: function(sourceString, targetString, callback) {
    table.phrases(this.tableName, sourceString, targetString, callback)
  },

  append: function(source, index) {
    var _this = this
    var sourceArray = tools.ngram(source, config.global.ngram.source);
    sourceArray.forEach(function(sourcePhrase, _index) {
      if (_this.phraseIndex[sourcePhrase] === undefined) {
        _this.phraseIndex[sourcePhrase] = []
      }
      _this.phraseIndex[sourcePhrase].push(index);
    });
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
      table.store(__this.tableName, __this.phraseIndex, trainingSet, progress, callback)
    })
  }
}

exports = module.exports = phraseTable
