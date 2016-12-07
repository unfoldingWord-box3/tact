// tests/aligner.js
var chai = require('chai')
var assert = chai.assert
var tact = require('./../tact/tact.js')

var tableName = 'test';
var score = {
  phraseCountScore: 1,
  wordOrderScore: 1,
  sizeDeltaScore: 1
}

var permutations = {
  "hello": {
    "olleh": [score,score,score],
    "dlrow": [score,score],
    "ocat": [score]
  },
  "world": {
    "olleh": [score,score],
    "dlrow": [score,score,score],
    "ocat": [score]
  },
  "taco": {
    "olleh": [score],
    "dlrow": [score,score],
    "ocat": [score,score,score]
  }
};

describe('table', function() {
  it('init() should start with an empty table', function(done) {
    tact.table.init(tableName, function() {
      tact.table.getCount(tableName, function(count) {
        assert.equal(count, 0);
        done();
      });
    });
  });
  it('bulkInsert() should add rows to the table', function(done) {
    tact.table.bulkInsert(tableName, permutations, function(){}, function() {
      tact.table.getCount(tableName, function(count) {
        assert.equal(count, 3);
        done();
      });
    });
  });
  it('phrases() should return tableRows with totals in each row', function(done) {
    var sourceString = 'hello', targetString = 'olleh';
    tact.table.phrases(tableName, sourceString, targetString, function(alignments) {
      var row = alignments[0];
      assert.equal(row.localSourceTotal, 3);
      // assert.equal(row.localTargetTotal, 3);
      assert.equal(row.globalSourceTotal, 6);
      // assert.equal(row.globalTargetTotal, 6);
      done();
    });
  });
  it('cleanup() should yield an table count of 0', function(done) {
    tact.table.cleanup(tableName, function() {
      tact.table.getCount(tableName, function(count) {
        assert.equal(count, 0);
        done();
      });
    });
  });
});
