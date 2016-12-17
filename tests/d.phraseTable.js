// tests/aligner.js
var chai = require('chai')
var assert = chai.assert
var tact = require('./../tact/tact.js')
var corpusFaker = require('./../tact/src/corpusFaker.js')
var options = require('config').Client

var lexicon = corpusFaker.lexicon(100)
var corpus = corpusFaker.lexiconCorpusGenerate(1000, lexicon)
var pairForAlignment = corpusFaker.lexiconSentencePair(3, lexicon)

var phraseTable = new tact.PhraseTable(options)

describe('phraseTable', function() {
  it('generate() should add rows to the table', function(done) {
    phraseTable.generate(corpus, function(){}, function() {
      phraseTable.table.getCount(function(count) {
        assert.equal(count, 3)
        done()
      })
    })
  })
  it('prune() with one word pair should return 4 rows including possible blanks', function(done) {
    var alignmentPair = corpus[0]
    phraseTable.prune([alignmentPair[0].split(' ')[0], alignmentPair[1].split(' ')[1]], function(all) {
      assert.equal(all.length, 4)
      done()
    })
  })
  it('prune() with a long alignment pair should return lots of alignment options', function(done) {
    var alignmentPair = corpusFaker.lexiconSentencePair(20, lexicon)
    phraseTable.prune(alignmentPair, function(all) {
      assert.isAtLeast(all.length, 8)
      done()
    })
  })
  it('prune() with a long alignment pair should not have any alignments with a score of NaN', function(done) {
    var alignmentPair = corpusFaker.lexiconSentencePair(50, lexicon)
    phraseTable.prune(alignmentPair, function(alignments) {
      alignments.forEach(function(alignment, index) {
        assert.isNotNaN(alignment.confidence)
      })
      done()
    })
  })
  it('cleanup() should yield an table count of 0', function(done) {
    phraseTable.table.cleanup(function() {
      phraseTable.table.getCount(function(count) {
        assert.equal(count, 0)
        done()
      })
    })
  })
})
