var tools = require('./tools.js')
var Table = require('./table.js')
var tokenizer = require('./tokenizer.js')

function CorrectionsTable(options) {
  this.options = options
  this.tableName = 'corrections'
  this.table = new Table(this.tableName, this.options)
  this.sourceIndex = {}
  this.targetIndex = {}
}

CorrectionsTable.prototype.prune = function(alignmentPair, callback) {
  this.table.phrases(alignmentPair, callback)
}

CorrectionsTable.prototype.getBySource = function(sourcePhrase, callback) {
  this.table.getBySource(sourcePhrase, callback)
}

CorrectionsTable.prototype.append = function(pair, index) {
  var source = pair[0], target = pair[1]
  var sourceWords = tokenizer.tokenizeSource(source)
  var that = this
  sourceWords.forEach(function(sourceWord, _index) {
    if (that.sourceIndex[sourceWord] === undefined) {
      that.sourceIndex[sourceWord] = []
    }
    that.sourceIndex[sourceWord].push(index)
  })
  var targetWords = tokenizer.tokenizeTarget(target)
  targetWords.forEach(function(targetWord, _index) {
    if (that.targetIndex[targetWord] === undefined) {
      that.targetIndex[targetWord] = []
    }
    that.targetIndex[targetWord].push(index)
  })
}

  // can pass in table so that it can incriment counts
CorrectionsTable.prototype.generate = function(trainingSet, progress, callback) {
  var that = this
  this.table.cleanup(function(){
    // loop through trainingSet
    // generate ngrams of source and target
    var count = trainingSet.length
    console.log("indexing phrases...")
    trainingSet.forEach(function(pair, index) {
      that.append(pair, index)
    })
    progress(0.25)
    console.log("storing phraseIndex...")
    that.table.store(that.sourceIndex, that.targetIndex, trainingSet, progress, function() {
      that.sourceIndex = {}
      that.targetIndex = {}
      callback()
    })
  })
}

exports = module.exports = CorrectionsTable
