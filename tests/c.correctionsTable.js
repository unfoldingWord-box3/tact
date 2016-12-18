// tests/aligner.js
var chai = require('chai')
var assert = chai.assert
var tact = require('./../tact/tact.js')
var ngram = require('./../tact/src/ngram.js')
var options = require('config').Client

function reverse(s) {
  return s.split('').reverse().join('')
}

var sources = ["hello", "asdf", "taco tuesdays"]
var targets = []
sources.forEach(function(string, index){ targets.push(reverse(string)) })
var trainingSet = []
sources.forEach(function(string, index){ trainingSet.push([string, targets[index]]) })
var pairForAlignment = ["hello taco world", "dlrow ocat olleh"]

var correctionsTable = new tact.CorrectionsTable(options)

describe('correctionsTable', function() {
  it('generate() should add rows to the table', function(done) {
    correctionsTable.generate(trainingSet, function(){}, function() {
      correctionsTable.table.getCount(function(count) {
        assert.equal(count, 3)
        done()
      })
    })
  })
  it('getBySource() should return 1 alignment if there is 1', function(done) {
    var sourcePhrase = 'hello'
    correctionsTable.getBySource(sourcePhrase, function(alignments) {
      assert.equal(alignments.length, 1)
      done()
    })
  })
  it('getBySource() should return alignments for all sub phrase corrections', function(done) {
    var sourcePhrase = 'hello asdf'
    correctionsTable.getBySource(sourcePhrase, function(alignments) {
      assert.equal(alignments.length, 2)
      done()
    })
  })
  it('prune() with one word pair should return 1 row', function(done) {
    correctionsTable.prune(['hello', 'olleh'], function(alignments) {
      assert.equal(alignments.length, 1)
      done()
    })
  })
  it('prune() with two word pair should return 1 row', function(done) {
    correctionsTable.prune(trainingSet[2], function(alignments) {
      assert.equal(alignments.length, 1)
      done()
    })
  })
  it('prune() should find corrections for sub strings', function(done) {
    correctionsTable.prune(['hello taco tuesdays', 'syadseut ocat olleh'], function(alignments) {
      assert.equal(alignments.length, 2)
      done()
    })
  })
  it('prune() should not return a substring rule from a multi token entry', function(done) {
    correctionsTable.prune(['taco', 'ocat'], function(alignments) {
      assert.equal(alignments.length, 0)
      done()
    })
  })
  it('prune() should return empty array when tokens not found', function(done) {
    correctionsTable.prune(['qwerty', 'ytrewq'], function(alignments) {
      assert.equal(alignments.length, 0)
      done()
    })
  })
  it('cleanup() should yield an table count of 0', function(done) {
    correctionsTable.table.cleanup(function() {
      correctionsTable.table.getCount(function(count) {
        assert.equal(count, 0)
        done()
      })
    })
  })
})
