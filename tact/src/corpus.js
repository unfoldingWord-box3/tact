
var async = require('async')

var corpus = {

  fileLines: function(file, callback) {
    var lines = [] // response
    require('fs').readFileSync(file).toString().split(/\r?\n/).forEach(function(line){
      lines.push(line)
    })
    callback(null, lines)
  },

  pivot: function(sources, targets, callback) {
    var _corpus = []
    sources.forEach(function(sourceString, index) {
      var targetString = targets[index]
      _corpus.push([sourceString.normalize('NFKC').toLowerCase(), targetString.normalize('NFKC').toLowerCase()])
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
