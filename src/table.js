var config = require('./config.js');
var tools = require('./tools.js');
var db = require('./db.js').db;
var async = require('async');

var cleanup = function(tableName, callback) {
  db.run("DROP TABLE IF EXISTS " + tableName + ";", callback);
};
exports.cleanup = cleanup;

var init = function(tableName, callback) {
  cleanup(tableName, function(err) {
    db.run("CREATE TABLE IF NOT EXISTS " + tableName + " (source TEXT, target TEXT, tally INT);", callback);
  });
};
exports.init = init;

var bulkInsert = function(tableName, permutations, callback) {
  var batches = [];
  var clauses = [];
  tools.forObject(permutations, function(source, sourceData){
    tools.forObject(sourceData, function(target, tally){
      if (clauses.length == 0) {
        clause = "SELECT '"+source+"' as source, '"+target+"' as target, "+tally+" as tally";
      } else {
        clause = "SELECT '"+source+"', '"+target+"', "+tally+"";
      }
      clauses.push(clause);
      if (clauses.length == 64) {  // sqlite3 has a hard limit of 64 joins
        batches.push(clauses);
        clauses = [];
      }
    });
  });
  if (clauses.length > 0) {  // sqlite3 has a hard limit of 64 joins
    batches.push(clauses);
    clauses = [];
  }
  var statements = [];
  batches.forEach(function(batch) {
    var statement = "INSERT INTO " + tableName + " \n";
    var statement = statement + batch.join("\n UNION ")
    statements.push(statement);
  });
  db.exec("PRAGMA synchronous = OFF;");
  db.exec("PRAGMA journal_mode = OFF;");
  db.run("BEGIN TRANSACTION;");
  statements.forEach(function(statement) {
    db.run(statement);
  });
  db.run("END TRANSACTION;");
  db.run("COMMIT;", callback);
};
exports.bulkInsert = bulkInsert;

var bulkInsert = function(tableName, permutations, callback) {
  var clauses = [];
  tools.forObject(permutations, function(source, sourceData){
    tools.forObject(sourceData, function(target, tally){
      clause = "('" + source + "','" + target + "'," + tally + ")";
      clauses.push(clause);
    });
  });
  db.run("BEGIN TRANSACTION;");
  do {
    _clauses = clauses.splice(0,1000);
    var statement = "INSERT INTO " + tableName + " (source,target,tally) VALUES ";
    statement = statement + _clauses.join(", ") + ";";
    db.run(statement);
  } while (clauses.length > 0);
  db.run("END TRANSACTION;");
  db.run("COMMIT;", function(){
    // Adding indices after inserts doubles speed of inserts
    db.run("CREATE INDEX SourceIndex ON " + tableName + " (source)", function(err) {
      db.run("CREATE INDEX TargetIndex ON " + tableName + " (target)", function(err) {
        db.run("CREATE UNIQUE INDEX SourceTargetIndex ON " + tableName + " (source, target)", callback);
      });
    });
  });
};
exports.bulkInsert = bulkInsert;

exports.getCount = function(tableName, callback) {
  db.all("SELECT COUNT(*) AS count FROM " + tableName + ";", function(err, all){
    callback( all === undefined ? -1 : all[0].count );
  });
};

var phrases = function(tableName, sourcePhrases, targetPhrases, callback) {
  getPhrases(tableName, sourcePhrases, targetPhrases, function(tableRows) {
    calculateTotals(tableName, sourcePhrases, targetPhrases, tableRows, function(tableRows) {
      callback(tableRows);
    });
  });
};
exports.phrases = phrases;

var getPhrases = function(tableName, sourcePhrases, targetPhrases, callback) {
  var clauses = [];
  sourcePhrases.forEach(function(source, index){
    clauses.push("( source = '" + source + "' " +
      "AND target IN ('" + targetPhrases.join("', '") + "') ) ");
  });
  statement = "SELECT * FROM " + tableName + " WHERE " + clauses.join(' OR ') + " ORDER BY tally DESC;"
  db.all(statement, function(err, all) {
    callback(all);
  });
};
exports.getPhrases = getPhrases;

var calculateTotals = function(tableName, sourcePhrases, targetPhrases, tableRows, callback){
  globalTotalsBatching(tableName, 'source', sourcePhrases, function(globalSourceTotals) {
    globalTotalsBatching(tableName, 'target', targetPhrases, function(globalTargetTotals) {
      localTotals(tableRows, function(localSourceTotals, localTargetTotals) {
        tableRows.forEach(function(row) {
          row.globalSourceTotal = globalSourceTotals[row.source];
          row.globalTargetTotal = globalTargetTotals[row.target];
          row.localSourceTotal = localSourceTotals[row.source];
          row.localTargetTotal = localTargetTotals[row.target];
        });
        callback(tableRows);
      });
    });
  });
};
exports.calculateTotals = calculateTotals;

var localTotals = function(tableRows, callback) {
  var localSourceTotals = {};
  var localTargetTotals = {};
  tableRows.forEach(function(row) {
    var lastSourceTotal = localSourceTotals[row.source];
    localSourceTotals[row.source] = ((lastSourceTotal === undefined) ? row.tally : (lastSourceTotal + row.tally));
    lastTargetTotal = localTargetTotals[row.target];
    localTargetTotals[row.target] = ((lastTargetTotal === undefined) ? row.tally : (lastTargetTotal + row.tally));
  });
  callback(localSourceTotals, localTargetTotals);
};
exports.localTotals = localTotals;

var globalTotalsBatching = function(tableName, type, phrases, callback) {
  var batches = [];
  do {
    batch = phrases.splice(0,64); // sqlite3 has a hard limit of 64 joins
    batches.push(batch);
  } while (phrases.length > 0);
  async.map(batches,
    function(batch, _callback){
      globalTotals(tableName, type, batch, function(totals) {
        _callback(null, totals);
      });
    },
    function(err, batchesResult){
      var totals = {};
      do {
        batchResult = batchesResult.shift();
        Object.merge(totals, batchResult);
      } while (batchesResult.length > 0);
      callback(totals);
    }
  );
};
exports.globalTotalsBatching = globalTotalsBatching;

var globalTotals = function(tableName, type, phrases, callback) {
  var clauses = [];
  phrases.forEach(function(phrase) {
    var clause = "( SELECT SUM(tally) as '" + phrase + "' FROM " + tableName + " WHERE " + type + " = '" + phrase + "' )";
    clauses.push(clause);
  });
  var statement = "SELECT * FROM " + clauses.join(" INNER JOIN ") + " ;";
  clauses = undefined;
  db.all(statement, function(err, result) {
    var totals = result[0];
    callback(totals);
  });
};
exports.globalTotals = globalTotals;
