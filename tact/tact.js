process.env.SUPPRESS_NO_CONFIG_WARNING = 'y';
var tact = {
  tokenizer: require('./src/tokenizer.js'),
  corpus: require('./src/corpus.js'),
  scoring: require('./src/scoring.js'),

  Table: require('./src/table.js'),
  PhraseTable: require('./src/phraseTable.js'),
  CorrectionsTable: require('./src/correctionsTable.js'),
  WordAligner: require('./src/wordAligner.js'),
  PhraseAligner: require('./src/phraseAligner.js'),

  Training: require('./training.js'),
  Aligning: require('./aligning.js')
}

exports = module.exports = tact
