var chai = require('chai')
var assert = chai.assert
var tact = require('./../tact/tact.js')
var options = require('config').Client

var tableName = 'test'
var score = {
  phraseCountScore: 1,
  wordOrderScore: 1,
  sizeDeltaScore: 1
}

var trainingSet = [["hello taco world", "dlrow ocat olleh"]]

var sourceIndex = {
  "hello": [0],
  "world": [0],
  "taco": [0]
}

var targetIndex = {
  "olleh": [0],
  "dlrow": [0],
  "ocat": [0]
}

describe('table', function() {
  it('init() should start with an empty table', function(done) {
    tact.table.init(options, tableName, function() {
      tact.table.getCount(options, tableName, function(count) {
        assert.equal(count, 0)
        done()
      })
    })
  })
  it('store() should add rows to the table', function(done) {
    tact.table.store(options, tableName, sourceIndex, targetIndex, trainingSet, function(){}, function() {
      tact.table.getCount(options, tableName, function(count) {
        assert.equal(count, 3)
        done()
      })
    })
  })
  it('phrases() should return tableRows with totals in each row', function(done) {
    var sourceString = 'hello', targetString = 'olleh'
    tact.table.phrases(options, tableName, [sourceString, targetString], function(alignments) {
      var row = alignments[0]
      assert.equal(row.tally, 1)
      assert.equal(row.localSourceTotal, 7)
      assert.equal(row.localTargetTotal, 5)
      assert.equal(row.globalSourceTotal, 7)
      assert.equal(row.globalTargetTotal, 5)
      done()
    })
  })
  it('cleanup() should yield an table count of 0', function(done) {
    tact.table.cleanup(options, tableName, function() {
      tact.table.getCount(options, tableName, function(count) {
        assert.equal(count, 0)
        done()
      })
    })
  })
})
