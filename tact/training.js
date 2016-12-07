var correctionsTable = require('./src/correctionsTable.js');
var phraseTable = require('./src/phraseTable.js');

var train = function(corpus, corrections, corpusProgress, correctionsProgress, correctionsCallback, corpusCallback, callback) {
  console.log('training...');
  console.time('training');
  console.log('corrections...');
  console.time('correctionsTable');
  correctionsTable.generate(corrections, correctionsProgress, function() {
    console.timeEnd('correctionsTable');
    correctionsCallback();
    console.log('corpus...');
    console.time('corpusTable');
    phraseTable.generate(corpus, corpusProgress, function() {
      console.timeEnd('corpusTable');
      corpusCallback();
      console.timeEnd('training');
      callback();
    });
  });
};
exports.train = train;
