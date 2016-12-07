var config = require('../config.js')
var tools = require('./tools.js')
var async = require('async')
var scoring = require('./scoring.js')
var db = require('./db.js')

db.init()

var table = function(tableName) {
  return db.localforage.createInstance({"name": config.global.sourceLanguage+'-'+config.global.targetLanguage+'-'+tableName});
}

var cleanup = function(tableName, callback) {
  table(tableName).clear(callback);
};
exports.cleanup = cleanup;

var init = function(tableName, callback) {
  cleanup(tableName, function(){
    callback(table(tableName));
  })
};
exports.init = init;

exports.getCount = function(tableName, callback) {
  table(tableName).length(function(err,length) {
    callback(length);
  });
};

var bulkInsert = function(tableName, permutations, progress, callback) {
  var sourcePhrases = Object.keys(permutations);
  var total = Object.keys(permutations).length
  var index = 0;
  async.mapLimit(sourcePhrases, 2,// increasing more than 2 slows it down. 2 is 1/20 faster
    function(sourcePhrase, _callback) {
      var targets = permutations[sourcePhrase];
      table(tableName).setItem(sourcePhrase, targets, function(err) {
        index ++;
        progress(index/total);
        _callback(null, err);
      });
    },
    function(err, errs) {
      callback();
    }
  );
};
exports.bulkInsert = bulkInsert;

var calculateRows = function(source, targets, tableName, sourceString, targetString, sourcePhrases, targetPhrases) {
  var rows = []
  var globalSourceTotal = 0;
  var localSourceTotal = 0;
  tools.forObject(targets, function(target, staticScores) {
    var tally = staticScores.length;
    globalSourceTotal = globalSourceTotal + tally;
    if (targetPhrases.indexOf(target) > -1) {
      localSourceTotal = localSourceTotal + tally;
    }
  });
  tools.forObject(targets, function(target, staticScores) {
    var tally = staticScores.length;
    var staticScore = tools.averageObjects(staticScores);
    if (targetPhrases.indexOf(target) > -1) {
      var row = {
        source: source, target: target, tally: tally,
        staticScore: staticScore,
        globalSourceTotal: globalSourceTotal,
        localSourceTotal: localSourceTotal,
        globalTargetTotal: 0,
        localTargetTotal: 0,
        conflict: false,
        sourceUsed: false,
        correction: (tableName == 'corrections')
      };
      row = scoring.score(sourceString, targetString, row);
      rows.push(row);
    }
  });
  return rows;
};

var phrases = function(tableName, sourceString, targetString, callback) {
  var sourcePhrases = tools.ngram(sourceString, config.global.ngram.source);
  var targetPhrases = tools.ngram(targetString, config.global.ngram.target);
  var alignments = [];
  async.mapLimit(sourcePhrases, 2, function(sourcePhrase, cb) {
    table(tableName).getItem(sourcePhrase).then(function(targets) {
      if (targets !== null) {
        var rows = calculateRows(sourcePhrase, targets, tableName, sourceString, targetString, sourcePhrases, targetPhrases);
        alignments = alignments.concat(rows);
      }
      cb();
    });
  }, function(err) {
    if (err) return console.log(err);
    callback(alignments);
  });
};
exports.phrases = phrases;
