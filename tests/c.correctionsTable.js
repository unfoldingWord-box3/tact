// tests/aligner.js
var chai = require('chai');
var assert = chai.assert;
var correctionsTable = require('./../src/correctionsTable.js');
var natural = require('natural');
var tokenizer = new natural.WordTokenizer();

function reverse(s) {
  return s.split('').reverse().join('');
}

var sources = ["hello", "asdf"];
var targets = [];
sources.forEach(function(string, index){ targets.push(reverse(string)); });
var corpus = [];
sources.forEach(function(string, index){ corpus.push([string, targets[index]]); });
var pairForAlignment = ["hello taco world", "dlrow ocat olleh"];

describe('correctionsTable', function() {
  it('generate() should add rows to the table', function(done) {
    correctionsTable.generate(corpus, function(){}, function() {
      correctionsTable.table.getCount(correctionsTable.tableName, function(count) {
        assert.isAtLeast(count, 1);
        done();
      });
    });
  });
  it('prune() with one word pair should return 1 row', function(done) {
    correctionsTable.prune('hello', 'olleh', function(all) {
      assert.equal(all.length, 1);
      done();
    });
  });
  it('cleanup() should yield an table count of -1', function(done) {
    correctionsTable.table.cleanup(correctionsTable.tableName, function() {
      correctionsTable.table.getCount(correctionsTable.tableName, function(count) {
        assert.equal(count, -1);
        done();
      });
    });
  });
});
