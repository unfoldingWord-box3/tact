// tests/aligner.js
var chai = require('chai')
var assert = chai.assert
var tact = require('./../tact/tact.js')
var corpusFaker = require('./../tact/src/corpusFaker.js')
var options = require('config').Client

var lexicon = corpusFaker.lexicon(100)
var corpus = corpusFaker.lexiconCorpusGenerate(1000, lexicon)
var alignmentPair = corpusFaker.lexiconSentencePair(3, lexicon)

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
    var alignmentPair = corpusFaker.lexiconSentencePair(10, lexicon)
    phraseTable.prune(alignmentPair, function(all) {
      assert.isAtLeast(all.length, 8)
      done()
    })
  })
  it('prune() should return the same response after aligning multiple times.', function(done) {
    function confidence(alignments) {
      var sum = 0; alignments.forEach(function(alignment, i) { sum += alignment.confidence})
      return sum
    }
    phraseTable.prune(alignmentPair, function(alignments) {
      var length1 = alignments.length
      var confidence1 = confidence(alignments)
      var alignment1 = alignments[0]
      phraseTable.prune(alignmentPair, function(alignments) {
        var length2 = alignments.length
        var alignment2 = alignments[0]
        var confidence2 = confidence(alignments)
        assert.equal(alignment2.confidence, alignment1.confidence)
        assert.equal(length2, length1)
        assert.equal(confidence2, confidence1)
        phraseTable.prune(alignmentPair, function(alignments) {
          var length3 = alignments.length
          var alignment3 = alignments[0]
          var confidence3 = confidence(alignments)
          assert.equal(length3, length1)
          assert.equal(alignment3.confidence, alignment1.confidence)
          assert.equal(confidence3, confidence1)
          done()
        })
      })
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
