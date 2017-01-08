var CorrectionsTable = require('./src/correctionsTable.js')
var PhraseTable = require('./src/phraseTable.js')

function Training(options, corpus, corrections) {
  this.options = options
  this.corpus = corpus
  this.corrections = corrections
  this.phraseTable = new PhraseTable(this.options)
  this.correctionsTable = new CorrectionsTable(this.options)
}

Training.prototype.train = function(corpusProgress, correctionsProgress, correctionsCallback, corpusCallback, callback) {
  console.log('training...')
  console.time('training')
  console.log('corrections...')
  console.time('correctionsTable')
  var that = this
  that.correctionsTable.generate(that.corrections, correctionsProgress, function() {
    console.timeEnd('correctionsTable')
    correctionsCallback()
    console.log('corpus...')
    console.time('corpusTable')
    that.phraseTable.generate(that.corpus, corpusProgress, function() {
      console.timeEnd('corpusTable')
      corpusCallback()
      console.timeEnd('training')
      callback()
    })
  })
}
exports = module.exports = Training
