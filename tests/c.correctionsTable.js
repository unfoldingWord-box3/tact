// tests/aligner.js
var chai = require('chai')
var assert = chai.assert
var tact = require('./../tact/tact.js')

function reverse(s) {
  return s.split('').reverse().join('')
}

var sources = ["hello", "asdf"]
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
    tact.correctionsTable.prune('hello', 'olleh', function(all) {
      assert.equal(all.length, 1)
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
