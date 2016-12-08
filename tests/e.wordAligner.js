// tests/aligner.js
var chai = require('chai')
var assert = chai.assert
var tact = require('./../tact/tact.js')

function reverse(s) {
  return s.split('').reverse().join('')
}

// corpus
var sources = [
  "hello", "hello george", "hello taco", "hello all", "say hello", "no hello", "say hello to all",
  "world", "the world", "world reign", "save the world", "world of worlds", "king of the world", "hello to the world",
  "taco", "taco tuesdays", "i like tacos", "tacos taste good", "why tacos"
]
var targets = []
sources.forEach(function(string, index){ targets.push(reverse(string)) })
var corpus = []
sources.forEach(function(string, index){ corpus.push([string, targets[index]]) })
// corrections
var sources = ["hello", "asdf"]
var targets = []
sources.forEach(function(string, index){ targets.push(reverse(string)) })
var corrections = []
sources.forEach(function(string, index){ corrections.push([string, targets[index]]) })
// pair to align
var pairForAlignment = ["hello taco world", "dlrow ocat olleh"]

describe('wordAligner', function() {
  it('isNeeded() should update alignments', function(done) {
    tact.phraseTable.generate(corpus, function(){}, function() {
      tact.correctionsTable.generate(corrections, function(){}, function() {
        tact.wordAligner.alignments('hello world', 'olleh dlrow', function(alignments) {
          tact.wordAligner.isNeeded(alignments[0], 'asdf', alignments[0].target)
          assert.isNotTrue(alignments[0].sourceNeeded)
          assert.isTrue(alignments[0].targetNeeded)
          tact.wordAligner.isNeeded(alignments[1], alignments[1].source, 'fdsa')
          assert.isTrue(alignments[1].sourceNeeded)
          assert.isNotTrue(alignments[1].targetNeeded)
          tact.wordAligner.isNeeded(alignments[2], 'asdf', 'fdsa')
          assert.isNotTrue(alignments[2].sourceNeeded)
          assert.isNotTrue(alignments[2].targetNeeded)
          done()
        })
      })
    })
  })
  it('removeUnneededSources() should remove elements', function(done) {
    tact.phraseTable.generate(corpus, function(){}, function() {
      tact.correctionsTable.generate(corrections, function(){}, function() {
        tact.wordAligner.alignments('hello world', 'olleh dlrow', function(alignments) {
          var count = alignments.length
          alignments[0].sourceNeeded = false
          alignments[count-1].sourceNeeded = false
          tact.wordAligner.removeUnneededSources(alignments)
          var count1 = alignments.length
          assert.equal(count1, count - 2)
          alignments[0].sourceNeeded = false
          tact.wordAligner.removeUnneededSources(alignments)
          var count2 = alignments.length
          assert.equal(count2, count - 3)
          done()
        })
      })
    })
  })
  it('align() should return an array for each source word', function(done) {
    tact.phraseTable.generate(corpus, function(){}, function() {
      tact.correctionsTable.generate(corrections, function(){}, function() {
        tact.wordAligner.align(pairForAlignment, function(alignment) {
          var count = tact.tokenizer.tokenize(pairForAlignment[0]).length
          assert.equal(count, alignment.length)
          done()
        })
      })
    })
  })
  it('align() should return an object of which values are an array of string and number.', function(done) {
    tact.wordAligner.align(pairForAlignment, function(alignments) {
      var alignment = alignments[0]
      assert.isArray(alignment)
      var sourceNgram = alignment[0]
      assert.isString(sourceNgram)
      var targetNgram = alignment[1]
      assert.isString(targetNgram)
      var score = alignment[2]
      assert.isNumber(score)
      done()
    })
  })

  it('align() should have results of high confidence if supporting data is in corrections.', function(done) {
    var correctionCorpus = [
      ["hello","olleh"]
    ]
    tact.correctionsTable.generate(correctionCorpus, function(){}, function() {
      tact.wordAligner.align(pairForAlignment, function(alignment) {
        alignmentData = alignment
        var alignment = alignmentData[0]
        assert.isArray(alignment)
        var sourceNgram = alignment[0]
        assert.isString(sourceNgram)
        var targetNgram = alignment[1]
        assert.isString(targetNgram)
        var score = alignment[2]
        assert.isAtLeast(score, 1.0)
        done()
      })
    })
  })

  it('align() should return empty array empty string is provided.', function(done) {
    tact.wordAligner.align(['',''], function(alignment) {
      assert.equal(alignment.length, 0)
      tact.wordAligner.align(['hello',''], function(alignment) {
        assert.equal(alignment.length, 0)
        tact.wordAligner.align(['','olleh'], function(alignment) {
          assert.equal(alignment.length, 0)
          done()
        })
      })
    })
  })

})
