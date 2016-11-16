var config = require('./config.js');
var tools = require('./tools.js');
var db = require('./db.js').db;
var async = require('async');
var scoring = require('./scoring.js');

var cleanup = function(tableName, callback) {
  db.run("DROP TABLE IF EXISTS " + tableName + ";", callback);
};
exports.cleanup = cleanup;

var init = function(tableName, callback) {
  cleanup(tableName, function(err) {
    db.run("CREATE TABLE IF NOT EXISTS " + tableName + " (source TEXT, targets TEXT);", callback);
  });
};
exports.init = init;

var bulkInsert = function(tableName, permutations, progress, callback) {
  var clauses = [];
  tools.forObject(permutations, function(source, targets){
    clause = "('" + source + "','" + JSON.stringify(targets) + "')";
    clauses.push(clause);
  });
  var statements = [];
  do {
    _clauses = clauses.splice(0,500);
    var statement = "INSERT INTO " + tableName + " (source,targets) VALUES ";
    statement = statement + _clauses.join(",") + ";";
    statements.push(statement);
  } while (clauses.length > 0);
  var count = statements.length;
  var completed = 0;
  async.eachLimit(statements, 2,
    function(statement, _callback) {
      db.run(statement, function() {
        completed ++;
        var percent = completed/count;
        progress(percent);
        _callback(null);
      });
    },
    function(err) {
      // Adding indices after inserts doubles speed of inserts
      db.run("CREATE UNIQUE INDEX SourceIndex ON " + tableName + " (source)", callback);
    }
  );
};
exports.bulkInsert = bulkInsert;

exports.getCount = function(tableName, callback) {
  db.all("SELECT COUNT(*) AS count FROM " + tableName + ";", function(err, all){
    callback( all === undefined ? -1 : all[0].count );
  });
};

var calculateRows = function(row, tableName, sourceString, targetString, sourcePhrases, targetPhrases) {
  var rows = []
  var targets = JSON.parse(row.targets);
  var globalSourceTotal = 0;
  var localSourceTotal = 0;
  tools.forObject(targets, function(target, tally) {
    globalSourceTotal = globalSourceTotal + tally;
    if (targetPhrases.indexOf(target) > -1) {
      localSourceTotal = localSourceTotal + tally;
    }
  });
  tools.forObject(targets, function(target, tally) {
    if (targetPhrases.indexOf(target) > -1) {
      var _row = {
        source: row.source, target: target, tally: tally,
        globalSourceTotal: globalSourceTotal,
        localSourceTotal: localSourceTotal,
        globalTargetTotal: 0,
        localTargetTotal: 0,
        conflict: false,
        sourceUsed: false,
        correction: (tableName == 'corrections')
      };
      _row = scoring.score(sourceString, targetString, _row);
      rows.push(_row);
    }
  });
  return rows;
};

var phrases = function(tableName, sourceString, targetString, sourcePhrases, targetPhrases, callback) {
  var rows = [];
  statement = "SELECT * FROM " + tableName + " WHERE source IN ('" + sourcePhrases.join("','") + "');"
  db.each(statement, function(err, row) {
    _rows = calculateRows(row, tableName, sourceString, targetString, sourcePhrases, targetPhrases);
    rows = rows.concat(_rows);
  }, function() {
    callback(rows);
  });
};
exports.phrases = phrases;
