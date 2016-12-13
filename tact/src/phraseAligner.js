var wordAligner = require('./wordAligner.js')

var phraseAligner = {
  // main alignment function that calls the other functions internally
  align: function(options, sourcePhrase, alignmentPair, callback) {
    var targetString = alignmentPair[1]
    alignmentPair = [sourcePhrase, targetString]
    if (sourcePhrase == '' || targetString == '') {
      callback([])
    } else {
      wordAligner.align(options, alignmentPair, function(alignments) {
        callback(alignments)
      })
    }
  }
}

exports = module.exports = phraseAligner
