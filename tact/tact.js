process.env.SUPPRESS_NO_CONFIG_WARNING = 'y';
var tact = {
  ngram: require('./src/ngram.js'),
  corpus: require('./src/corpus.js'),

  Tokenizer: require('./src/tokenizer.js'),
  Alignment: require('./src/alignment.js'),
  Table: require('./src/table.js'),
  PhraseTable: require('./src/phraseTable.js'),
  CorrectionsTable: require('./src/correctionsTable.js'),
  Alignments: require('./src/alignments.js'),

  Training: require('./training.js'),
  Aligning: require('./aligning.js')
}

exports = module.exports = tact
