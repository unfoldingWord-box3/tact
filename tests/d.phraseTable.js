// tests/aligner.js
var chai = require('chai')
var assert = chai.assert
var tact = require('./../tact/tact.js')
var options = require('config').Client

function reverse(s) {
  return s.split('').reverse().join('')
}

var sources = [
  "hello", "hello george", "hello taco", "hello all", "say hello", "no hello", "say hello to all",
  "world", "the world", "world reign", "save the world", "world of worlds", "king of the world", "hello to the world",
  "taco", "taco tuesdays", "i like tacos", "tacos taste good", "why tacos"
]
var targets = []
sources.forEach(function(string, index){ targets.push(reverse(string)) })
var corpus = []
sources.forEach(function(string, index){ corpus.push([string, targets[index]]) })
var pairForAlignment = ["hello taco world", "dlrow ocat olleh"]

describe('phraseTable', function() {
  it('generate() should add rows to the table', function(done) {
    tact.phraseTable.generate(options, corpus, function(){}, function() {
      tact.phraseTable.table.getCount(options, tact.phraseTable.tableName, function(count) {
        assert.equal(count, 2)
        done()
      })
    })
  })
  it('prune() with one word pair should return 1 row', function(done) {
    tact.phraseTable.prune(options, 'hello', 'olleh', function(all) {
      assert.equal(all.length, 1)
      done()
    })
  })
  it('cleanup() should yield an table count of 0', function(done) {
    tact.phraseTable.table.cleanup(options, tact.phraseTable.tableName, function() {
      tact.phraseTable.table.getCount(options, tact.phraseTable.tableName, function(count) {
        assert.equal(count, 0)
        done()
      })
    })
  })
})
