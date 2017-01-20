var tools = require('./tools.js')
var ngram = require('./ngram.js')
var Table = require('./table.js')
var Tokenizer = require('./tokenizer.js')

function PhraseTable(options) {
  this.options = options
  this.tableName = 'phrases'
  this.table = new Table(this.tableName, this.options)
  this.sourceIndex = {}
  this.targetIndex = {}
  this.tokenizer = new Tokenizer(options)
}

PhraseTable.prototype.prune = function(alignmentPair, callback) {
  this.table.phrases(alignmentPair, callback)
}

PhraseTable.prototype.getBySource = function(source, callback) {
  this.table.getBySource(source, callback)
}

PhraseTable.prototype.append = function(pair, index) {
  var source = pair[0], target = pair[1]
  var sourceWords = this.tokenizer.tokenizeSource(source)
  var that = this
  // sourceWords.push(' ')
  sourceWords.forEach(function(sourceWord, _index) {
    if (that.sourceIndex[sourceWord] === undefined) {
      that.sourceIndex[sourceWord] = []
    }
    that.sourceIndex[sourceWord].push(index)
  })
  var targetWords = this.tokenizer.tokenizeTarget(target)
  // targetWords.push(' ')
  targetWords.forEach(function(targetWord, _index) {
    if (that.targetIndex[targetWord] === undefined) {
      that.targetIndex[targetWord] = []
    }
    that.targetIndex[targetWord].push(index)
  })
}
// can pass in table so that it can incriment counts
PhraseTable.prototype.generate = function(trainingSet, progress, callback) {
  var that = this
  this.table.cleanup(function(){
    that.sourceIndex = {}
    that.targetIndex = {}
    // loop through trainingSet
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

exports = module.exports = PhraseTable
