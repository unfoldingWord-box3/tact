
var async = require('async');

var fileLines = function(file, callback) {
  var lines = []; // response
  require('fs').readFileSync(file).toString().split(/\r?\n/).forEach(function(line){
    lines.push(line);
  });
  callback(null, lines);
};
exports.fileLines = fileLines;

var pivot = function(sources, targets, callback) {
  var corpus = [];
  sources.forEach(function(sourceString, index) {
    var targetString = targets[index];
    corpus.push([sourceString.normalize('NFKC').toLowerCase(), targetString.normalize('NFKC').toLowerCase()]);
  });
  callback(corpus);
};
exports.pivot = pivot;

exports.parseFiles = function(sourceFile, targetFile, callback) {
  var corpus = [];
  async.map(
    [sourceFile, targetFile],
    fileLines,
    function(err, results) {
      pivot(results[0], results[1], callback);
    }
  );
};
