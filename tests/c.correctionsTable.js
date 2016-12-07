// tests/aligner.js
var chai = require('chai')
var assert = chai.assert
var tact = require('./../tact/tact.js')

function reverse(s) {
  return s.split('').reverse().join('')
}

var sources = ["hello", "asdf", "taco tuesdays"]
var targets = []
sources.forEach(function(string, index){ targets.push(reverse(string)) })
var corpus = []
sources.forEach(function(string, index){ corpus.push([string, targets[index]]) })
var pairForAlignment = ["hello taco world", "dlrow ocat olleh"]

describe('correctionsTable', function() {
  it('generate() should add rows to the table', function(done) {
    tact.correctionsTable.generate(corpus, function(){}, function() {
      tact.correctionsTable.table.getCount(tact.correctionsTable.tableName, function(count) {
        assert.isAtLeast(count, 1)
        done()
      })
    })
  })
  it('prune() with one word pair should return 1 row', function(done) {
    tact.correctionsTable.prune('hello', 'olleh', function(alignments) {
      assert.equal(alignments.length, 1)
      done()
    })
  })
  it('prune() with two word pair should return 1 row', function(done) {
    tact.correctionsTable.prune('taco tuesdays', 'syadseut ocat', function(alignments) {
      assert.equal(alignments.length, 1)
      done()
    })
  })
  it('prune() with should find corrections for sub strings', function(done) {
    tact.correctionsTable.prune('hello taco tuesdays', 'syadseut ocat olleh', function(alignments) {
      assert.equal(alignments.length, 2)
      done()
    })
  })
  it('prune() should not return a substring rule from a multi token entry', function(done) {
    tact.correctionsTable.prune('taco', 'ocat', function(alignments) {
      assert.equal(alignments.length, 0)
      done()
    })
  })
  it('cleanup() should yield an table count of 0', function(done) {
    tact.correctionsTable.table.cleanup(tact.correctionsTable.tableName, function() {
      tact.correctionsTable.table.getCount(tact.correctionsTable.tableName, function(count) {
        assert.equal(count, 0)
        done()
      })
    })
  })
})
