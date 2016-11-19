// tests/aligner.js
var chai = require('chai');
var assert = chai.assert;
var table = require('./../tact/src/table.js');
var tokenizer = require('./../tact/src/tokenizer.js');

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
    table.bulkInsert(tableName, permutations, function(){}, function() {
      table.getCount(tableName, function(count) {
        assert.equal(count, 3);
        done();
      });
    });
  });
  it('phrases() should return tableRows with totals in each row', function(done) {
    var sourceString = 'hello', targetString = 'olleh';
    var sourcePhrase = 'hello', targetPhrase = 'olleh';
    var sourcePhrases = [sourcePhrase], targetPhrases = [targetPhrase];
    table.phrases(tableName, sourceString, targetString, sourcePhrases, targetPhrases, function(tableRows) {
      var row = tableRows[0];
      assert.equal(row.localSourceTotal, 3);
      // assert.equal(row.localTargetTotal, 3);
      assert.equal(row.globalSourceTotal, 6);
      // assert.equal(row.globalTargetTotal, 6);
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
