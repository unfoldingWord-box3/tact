var tact = {
  config: require('./config.js'),

  table: require('./src/table.js'),
  phraseTable: require('./src/phraseTable.js'),
  correctionsTable: require('./src/correctionsTable.js'),
  wordAligner: require('./src/wordAligner.js'),
  corpus: require('./src/corpus.js'),
  segmenter: require('./src/segmenter.js'),
  tokenizer: require('./src/tokenizer.js'),

  training: require('./training.js'),
  aligning: require('./aligning.js')
}

exports = module.exports = tact
