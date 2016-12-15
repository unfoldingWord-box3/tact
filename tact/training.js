var CorrectionsTable = require('./src/correctionsTable.js')
var PhraseTable = require('./src/phraseTable.js')


function Training(options, corpus, corrections) {
  this.phraseTable = new PhraseTable(options)
  this.correctionsTable = new CorrectionsTable(options)

  this.train = function(corpusProgress, correctionsProgress, correctionsCallback, corpusCallback, callback) {
    console.log('training...')
    console.time('training')
    console.log('corrections...')
    console.time('correctionsTable')
    var _this = this
    this.correctionsTable.generate(corrections, correctionsProgress, function() {
      console.timeEnd('correctionsTable')
      correctionsCallback()
      console.log('corpus...')
      console.time('corpusTable')
      _this.phraseTable.generate(corpus, corpusProgress, function() {
        console.timeEnd('corpusTable')
        corpusCallback()
        console.timeEnd('training')
        callback()
      })
    })
  }

}
exports = module.exports = Training
