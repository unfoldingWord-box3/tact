process.env.SUPPRESS_NO_CONFIG_WARNING = 'y';
var tact = {
  table: require('./src/table.js'),
  scoring: require('./src/scoring.js'),
  phraseTable: require('./src/phraseTable.js'),
  correctionsTable: require('./src/correctionsTable.js'),
  wordAligner: require('./src/wordAligner.js'),
  phraseAligner: require('./src/phraseAligner.js'),
  corpus: require('./src/corpus.js'),
  tokenizer: require('./src/tokenizer.js'),

  training: require('./training.js'),
  aligning: require('./aligning.js')
}

exports = module.exports = tact
