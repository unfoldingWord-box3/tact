var WordAligner = require('./wordAligner.js')

function PhraseAligner(options) {
  var wordAligner = new WordAligner(options)
  this.wordAligner = wordAligner
  // main alignment function that calls the other functions internally
  this.align = function(sourcePhrase, alignmentPair, callback) {
    var targetString = alignmentPair[1]
    alignmentPair = [sourcePhrase, targetString]
    if (sourcePhrase == '' || targetString == '') {
      callback([])
    } else {
      wordAligner.align(alignmentPair, function(alignments) {
        callback(alignments)
      })
    }
  }
}

exports = module.exports = PhraseAligner
