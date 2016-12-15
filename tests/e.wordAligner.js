// tests/aligner.js
var chai = require('chai')
var assert = chai.assert
var tact = require('./../tact/tact.js')
var options = require('config').Client

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

var wordAligner = new tact.WordAligner(options)

describe('wordAligner', function() {
  it('isNeeded() should update alignments', function(done) {
    wordAligner.phraseTable.generate(corpus, function(){}, function() {
      wordAligner.correctionsTable.generate(corrections, function(){}, function() {
        wordAligner.alignments(['hello world', 'olleh dlrow'], function(alignments) {
          wordAligner.isNeeded(alignments[0], 'asdf', alignments[0].target)
          assert.isNotTrue(alignments[0].sourceNeeded)
          assert.isTrue(alignments[0].targetNeeded)
          wordAligner.isNeeded(alignments[3], alignments[1].source, 'fdsa')
          assert.isTrue(alignments[3].sourceNeeded)
          assert.isNotTrue(alignments[3].targetNeeded)
          wordAligner.isNeeded(alignments[4], 'asdf', 'fdsa')
          assert.isNotTrue(alignments[4].sourceNeeded)
          assert.isNotTrue(alignments[4].targetNeeded)
          done()
        })
      })
    })
  })
  it('isNeeded() should not update where target is " " alignments', function(done) {
    wordAligner.phraseTable.generate(corpus, function(){}, function() {
      wordAligner.correctionsTable.generate(corrections, function(){}, function() {
        wordAligner.alignments(['hello world', 'olleh dlrow'], function(alignments) {
          assert.isTrue(alignments[2].sourceNeeded)
          assert.isTrue(alignments[2].targetNeeded)
          wordAligner.isNeeded(alignments[2], alignments[1].source, 'fdsa')
          assert.isTrue(alignments[2].sourceNeeded)
          assert.isTrue(alignments[2].targetNeeded)
          done()
        })
      })
    })
  })
  it('penalizeUnneeded() should update alignments', function(done) {
    wordAligner.phraseTable.generate(corpus, function(){}, function() {
      wordAligner.correctionsTable.generate(corrections, function(){}, function() {
        wordAligner.alignments(['taco world', 'ocat dlrow'], function(alignments) {
          var scoreBefore = alignments[4].score
          wordAligner.penalizeUnneeded(alignments, alignments[0].source, 'fdsa')
          var scoreAfter = alignments[4].score
          assert.isBelow(scoreAfter, scoreBefore)
          done()
        })
      })
    })
  })
  it('removeUnneededSources() should remove elements', function(done) {
    wordAligner.phraseTable.generate(corpus, function(){}, function() {
      wordAligner.correctionsTable.generate(corrections, function(){}, function() {
        wordAligner.alignments(['hello world', 'olleh dlrow'], function(alignments) {
          var count = alignments.length
          alignments[0].sourceNeeded = false
          alignments[count-1].sourceNeeded = false
          wordAligner.removeUnneededSources(alignments)
          var count1 = alignments.length
          assert.equal(count1, count - 2)
          alignments[0].sourceNeeded = false
          wordAligner.removeUnneededSources(alignments)
          var count2 = alignments.length
          assert.equal(count2, count - 3)
          done()
        })
      })
    })
  })
  it('align() should return an array for each source word', function(done) {
    wordAligner.phraseTable.generate(corpus, function(){}, function() {
      wordAligner.correctionsTable.generate(corrections, function(){}, function() {
        wordAligner.align(pairForAlignment, function(alignment) {
          var count = tact.tokenizer.tokenize(pairForAlignment[0]).length
          assert.equal(count, alignment.length)
          done()
        })
      })
    })
  })
  it('align() should return an object of which values are an array of string and number.', function(done) {
    wordAligner.align(pairForAlignment, function(alignments) {
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
    wordAligner.correctionsTable.generate(correctionCorpus, function(){}, function() {
      wordAligner.align(pairForAlignment, function(alignment) {
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
    wordAligner.align(['',''], function(alignment) {
      assert.equal(alignment.length, 0)
      wordAligner.align(['hello',''], function(alignment) {
        assert.equal(alignment.length, 0)
        wordAligner.align(['','olleh'], function(alignment) {
          assert.equal(alignment.length, 0)
          done()
        })
      })
    })
  })

})
