var Tokenizer = require('./tokenizer.js')
var async = require('async')

var corpus = {

  fileLines: function(file, callback) {
    var lines = [] // response
    require('fs').readFileSync(file).toString().split(/\r?\n/).forEach(function(line){
      lines.push(line)
    })
    callback(null, lines)
  },

  pivot: function(options, sources, targets, callback) {
    var _corpus = []
    var tokenizer = new Tokenizer(options)
    sources.forEach(function(sourceString, index) {
      var targetString = targets[index]
      var trainingPair = [
        tokenizer.tokenizeSource(sourceString).join(' ').normalize('NFKC').toLowerCase(),
        tokenizer.tokenizeTarget(targetString).join(' ').normalize('NFKC').toLowerCase()
      ]
      _corpus.push(trainingPair)
    })
    callback(_corpus)
  },

  parseFiles: function(sourceFile, targetFile, callback) {
    async.map(
      [sourceFile, targetFile],
      corpus.fileLines,
      function(err, results) {
        corpus.pivot(results[0], results[1], callback)
      }
    )
  }
}

exports = module.exports = corpus
