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

var sourcePhrase = 'hello world'
var alignmentPair = ['i say hello world', 'olleh dlrow yas i']

var phraseAligner = new tact.PhraseAligner(options)

describe('phraseAligner', function() {
  it('align() should return alignment pairs to cover all source phrase tokens', function(done) {
    phraseAligner.wordAligner.phraseTable.generate(corpus, function(){}, function() {
      phraseAligner.wordAligner.correctionsTable.generate(corrections, function(){}, function() {
        phraseAligner.align(sourcePhrase, alignmentPair, function(alignments) {
          var alignedSource = []
          alignments.forEach(function(alignment) {
            alignedSource.push(alignment[0])
          })
          assert.equal(alignedSource.join(' '), sourcePhrase)
          done()
        })
      })
    })
  })

  it('align() should return an object of which values are an array of string and number.', function(done) {
    phraseAligner.align(sourcePhrase, alignmentPair, function(alignments) {
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
    phraseAligner.wordAligner.correctionsTable.generate(correctionCorpus, function(){}, function() {
      phraseAligner.align(sourcePhrase, alignmentPair, function(alignment) {
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
    phraseAligner.align('', ['',''], function(alignment) {
      assert.equal(alignment.length, 0)
      phraseAligner.align('hello', ['',''], function(alignment) {
        assert.equal(alignment.length, 0)
        phraseAligner.align('', ['','olleh'], function(alignment) {
          assert.equal(alignment.length, 0)
          done()
        })
      })
    })
  })

})
