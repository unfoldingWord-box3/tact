var chai = require('chai')
var assert = chai.assert
var tact = require('./../tact/tact.js')
var ngram = require('./../tact/src/ngram.js')
var options = require('config').Client

var tableName = 'test'
var score = {
  phraseCountScore: 1,
  wordOrderScore: 1,
  sizeDeltaScore: 1
}

var trainingSet = [["hello taco world", "dlalignment ocat olleh"]]

var sourceIndex = {
  "hello": [0],
  "world": [0],
  "taco": [0]
}

var targetIndex = {
  "olleh": [0],
  "dlalignment": [0],
  "ocat": [0]
}

var table = new tact.Table(tableName, options)

var _alignments
describe('table', function() {
  it('table should start empty', function(done) {
    table.cleanup(function() {
      table.getCount(function(count) {
        assert.equal(count, 0)
        done()
      })
    })
  })
  it('store() should add alignments to the table', function(done) {
    table.store(sourceIndex, targetIndex, trainingSet, function(){}, function() {
      table.getCount(function(count) {
        assert.equal(count, 3)
        done()
      })
    })
  })
  it('getBySource() should return alignments for all targets', function(done) {
    var sourcePhrase = 'hello'
    table.getBySource(sourcePhrase, function(alignments) {
      var count = ngram.ngram(trainingSet[0][1], options.global.ngram.target).length + 1
      count = count * 2 // handle injection of ' ' source
      assert.equal(alignments.length, count)
      done()
    })
  })
  it('phrases() should return tablealignments with totals in each alignment', function(done) {
    var sourceString = 'hello', targetString = 'olleh'
    table.phrases([sourceString, targetString], function(alignments) {
      var alignment = alignments[0]
      assert.isAtLeast(alignment.source.length, 0)
      assert.equal(alignment.totals.tally, 1)
      assert.equal(alignment.totals.localSource, 2)
      assert.equal(alignment.totals.localTarget, 2)
      assert.equal(alignment.totals.globalSource, 7)
      assert.equal(alignment.totals.globalTarget, 6)
      done()
    })
  })
  it('phrases() should return same totals a second time', function(done) {
    var sourceString = 'hello', targetString = 'olleh'
    table.phrases([sourceString, targetString], function(alignments) {
      var alignment = alignments[0]
      assert.equal(alignment.totals.tally, 1)
      assert.equal(alignment.totals.localSource, 2)
      assert.equal(alignment.totals.localTarget, 2)
      assert.equal(alignment.totals.globalSource, 7)
      assert.equal(alignment.totals.globalTarget, 6)
      done()
    })
  })
  it('phrases() should return same totals a third time', function(done) {
    var sourceString = 'hello', targetString = 'olleh'
    table.phrases([sourceString, targetString], function(alignments) {
      var alignment = alignments[0]
      assert.equal(alignment.totals.tally, 1)
      assert.equal(alignment.totals.localSource, 2)
      assert.equal(alignment.totals.localTarget, 2)
      assert.equal(alignment.totals.globalSource, 7)
      assert.equal(alignment.totals.globalTarget, 6)
      done()
    })
  })
  it('phrases() should return empty array when token not found', function(done) {
    var sourceString = 'asdf', targetString = 'fdsa'
    table.phrases([sourceString, targetString], function(alignments) {
      assert.equal(alignments.length, 0)
      done()
    })
  })
  it('cleanup() should yield an table count of 0', function(done) {
    table.cleanup(function() {
      table.getCount(function(count) {
        assert.equal(count, 0)
        done()
      })
    })
  })
})
