// tests/aligner.js
var chai = require('chai');
var assert = chai.assert;
var table = require('./../src/table.js');
var natural = require('natural');
var tokenizer = new natural.WordTokenizer();

var tableName = 'test';
var permutations = {
  "hello": {
    "olleh": 3,
    "dlrow": 2,
    "ocat": 1
  },
  "world": {
    "olleh": 2,
    "dlrow": 3,
    "ocat": 1
  },
  "taco": {
    "olleh": 1,
    "dlrow": 2,
    "ocat": 3
  }
};

describe('table', function() {
  it('init() should start with an empty table', function(done) {
    table.init(tableName, function() {
      table.getCount(tableName, function(count) {
        assert.equal(count, 0);
        done();
      });
    });
  });
  it('bulkInsert() should add rows to the table', function(done) {
    table.bulkInsert(tableName, permutations, function() {
      table.getCount(tableName, function(count) {
        assert.equal(count, 9);
        done();
      });
    });
  });
  it('getPhrases() with one word pair should return 1 row', function(done) {
    table.getPhrases(tableName, ['hello'], ['olleh'], function(all) {
      assert.equal(all.length, 1);
      done();
    });
  });
  it('localTotals() should return totals object with counts', function(done) {
    var sourcePhrase = 'hello', targetPhrase = 'olleh';
    table.getPhrases(tableName, [sourcePhrase], [targetPhrase], function(tableRows) {
      table.localTotals(tableRows, function(localSourceTotals, localTargetTotals) {
        assert.equal(localSourceTotals[sourcePhrase], 3);
        assert.equal(localTargetTotals[targetPhrase], 3);
        done();
      });
    });
  });
  it('globalTotals() for source should return phrase with count of 3', function(done) {
    var phrase = 'hello';
    table.globalTotals(tableName, 'source', [phrase], function(totals) {
      assert.equal(totals[phrase], 6);
      done();
    });
  });
  it('globalTotals() for target should return phrase with count of 3', function(done) {
    var phrase = 'olleh';
    table.globalTotals(tableName, 'target', [phrase], function(totals) {
      assert.equal(totals[phrase], 6);
      done();
    });
  });
  it('globalTotalsBatching() for source should work with > 64 phrases', function(done) {
    var phrase = 'hello';
    var phrases = [];
    var index = 0;
    do { phrases.push(phrase + ' '.repeat(index)); index ++; } while (phrases.length < 200);
    table.globalTotalsBatching(tableName, 'source', phrases, function(totals) {
      assert.equal(totals[phrase], 6);
      assert.equal(Object.keys(totals).length, 200);
      done();
    });
  });
  it('calculateTotals() should return tableRows with totals in each row', function(done) {
    var sourcePhrase = 'hello', targetPhrase = 'olleh';
    var sourcePhrases = [sourcePhrase], targetPhrases = [targetPhrase];
    table.getPhrases(tableName, sourcePhrases, targetPhrases, function(tableRows) {
      table.calculateTotals(tableName, sourcePhrases, targetPhrases, tableRows, function(tableRows) {
        var row = tableRows[0];
        assert.equal(row.localSourceTotal, 3);
        assert.equal(row.localTargetTotal, 3);
        assert.equal(row.globalSourceTotal, 6);
        assert.equal(row.globalTargetTotal, 6);
        done();
      });
    });
  });
  it('phrases() should return tableRows with totals in each row', function(done) {
    var sourcePhrase = 'hello', targetPhrase = 'olleh';
    var sourcePhrases = [sourcePhrase], targetPhrases = [targetPhrase];
    table.phrases(tableName, sourcePhrases, targetPhrases, function(tableRows) {
      var row = tableRows[0];
      assert.equal(row.localSourceTotal, 3);
      assert.equal(row.localTargetTotal, 3);
      assert.equal(row.globalSourceTotal, 6);
      assert.equal(row.globalTargetTotal, 6);
      done();
    });
  });
  it('cleanup() should yield an table count of -1', function(done) {
    table.cleanup(tableName, function() {
      table.getCount(tableName, function(count) {
        assert.equal(count, -1);
        done();
      });
    });
  });
});
