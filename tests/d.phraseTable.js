// tests/aligner.js
var chai = require('chai')
var assert = chai.assert
var tact = require('./../tact/tact.js')
var corpusFaker = require('./../tact/src/corpusFaker.js')
var options = require('config').Client

function reverse(s) {
  return s.split('').reverse().join('')
}

var lexicon = corpusFaker.lexicon(100)
var corpus = corpusFaker.lexiconCorpusGenerate(1000, lexicon)
var pairForAlignment = corpusFaker.lexiconSentencePair(3, lexicon)

describe('phraseTable', function() {
  it('generate() should add rows to the table', function(done) {
    tact.phraseTable.generate(options, corpus, function(){}, function() {
      tact.phraseTable.table.getCount(options, tact.phraseTable.tableName, function(count) {
        assert.isAtLeast(count, 1)
        assert.isAtMost(count, 3)
        done()
      })
    })
  })
  it('prune() with one word pair should return 1 row', function(done) {
    var alignmentPair = corpus[0]
    tact.phraseTable.prune(options, alignmentPair[0].split(' ')[0], alignmentPair[1].split(' ')[1], function(all) {
      assert.equal(all.length, 1)
      done()
    })
  })
  it('prune() with a long alignment pair should return lots of alignment options', function(done) {
    var alignmentPair = corpusFaker.lexiconSentencePair(20, lexicon)
    tact.phraseTable.prune(options, alignmentPair[0], alignmentPair[1], function(all) {
      assert.isAtLeast(all.length, 24)
      done()
    })
  })
  it('prune() with a long alignment pair should not have any alignments with a score of NaN', function(done) {
    var alignmentPair = corpusFaker.lexiconSentencePair(50, lexicon)
    tact.phraseTable.prune(options, alignmentPair[0], alignmentPair[1], function(alignments) {
      alignments.forEach(function(alignment, index) {
        assert.isNotNaN(alignment.score)
      })
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
