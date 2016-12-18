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
var alignmentPair = ["hello taco world", "dlrow ocat olleh"]

describe('Alignments', function() {
  before(function(done) {
    // train for later used
    var phraseTable = new tact.PhraseTable(options)
    phraseTable.generate(corpus, function() {}, function() {
      done()
    })
  })
  after(function(done) {
    var phraseTable = new tact.PhraseTable(options)
    phraseTable.table.cleanup(function() {
      done()
    })
  })
  it('getAlignments() should populate alignments', function(done) {
    var alignments = new tact.Alignments(options)
    assert.equal(alignments.alignments.length, 0)
    alignments.getAlignments(['taco world', 'ocat dlrow'], null, function() {
      assert.equal(alignments.alignments.length, 7)
      done()
    })
  })
  it('penalizeUnneeded() should update alignments', function(done) {
    var alignments = new tact.Alignments(options)
    alignments.getAlignments(['taco world', 'ocat dlrow'], null, function() {
      var alignment = alignments.available[0]
      var scoreBefore = alignment.confidence
      alignments.penalizeUnneededTargets(alignment.source, '')
      alignment = alignments.available[0]
      var scoreAfter = alignment.confidence
      assert.isBelow(scoreAfter, scoreBefore)
      done()
    })
  })
  it('removeUnneededSources() should remove elements', function(done) {
    var alignments = new tact.Alignments(options)
    alignments.getAlignments(['taco world', 'ocat dlrow'], null, function() {
      var lengthBefore = alignments.available.length
      var alignment = alignments.available[0]
      alignment.sourceNeeded = false
      alignments.removeUnneededSources()
      var lengthAfter = alignments.available.length
      assert.isBelow(lengthAfter, lengthBefore)
      done()
    })
  })
  it('align() should return an array for each source word', function(done) {
    var alignmentPair = ['taco world', 'ocat dlrow']
    var alignments = new tact.Alignments(options)
    var tokens = tact.tokenizer.tokenize(alignmentPair[0])
    var count = tokens.length
    alignments.align(alignmentPair, null, function(orderedAlignment) {
      assert.equal(orderedAlignment.length, count)
      done()
    })
  })
  it('align() should return an object of which values are an array of string and number.', function(done) {
    var alignmentPair = ['taco world', 'ocat dlrow']
    var alignments = new tact.Alignments(options)
    alignments.align(alignmentPair, null, function(orderedAlignment) {
      var alignment = orderedAlignment[0]
      assert.isString(alignment.source)
      assert.isString(alignment.target)
      assert.isNumber(alignment.confidence)
      done()
    })
  })
  it('align() should return the same response after aligning multiple times.', function(done) {
    function confidence(alignments) {
      var sum = 0; alignments.forEach(function(alignment, i) { sum += alignment.confidence })
      return sum
    }
    function sourceTargetConcat(alignments) {
      var array = []; alignments.forEach(function(alignment, i) { array.push(alignment.source); array.push(alignment.target) })
      return array.join(' ')
    }
    var alignmentPair = ['taco world', 'ocat dlrow']
    var alignments = new tact.Alignments(options)
    alignments.align(alignmentPair, null, function(orderedAlignment) {
      var length1 = orderedAlignment.length
      var alignment1 = orderedAlignment
      alignments.align(alignmentPair, null, function(orderedAlignment) {
        var length2 = orderedAlignment.length
        var alignment2 = orderedAlignment
        assert.equal(length2, length1)
        assert.equal(confidence(alignment2), confidence(alignment1))
        assert.equal(sourceTargetConcat(alignment2), sourceTargetConcat(alignment1))
        done()
      })
    })
  })
  it('align() after another phrase should return the same response as running it fresh.', function(done) {
    function confidence(alignments) {
      var sum = 0; alignments.forEach(function(alignment, i) { sum += alignment.confidence })
      return sum
    }
    function sourceTargetConcat(alignments) {
      var array = []; alignments.forEach(function(alignment, i) { array.push(alignment.source); array.push(alignment.target) })
      return array.join(' ')
    }
    var alignments = new tact.Alignments(options)
    // now run one with new alignment pair and compare it to fresh copy
    alignments.align(alignmentPair, null, function(orderedAlignment) {
      alignments.align(['hello all king', 'lla gnik olleh'], null, function(orderedAlignment) {
        var length3 = orderedAlignment.length
        var alignment3 = orderedAlignment
        var _alignments = new tact.Alignments(options)
        _alignments.align(['hello all king', 'lla gnik olleh'], null, function(_orderedAlignment) {
          var length4 = _orderedAlignment.length
          var alignment4 = _orderedAlignment
          assert.equal(length4, length3)
          assert.equal(confidence(alignment4), confidence(alignment3))
          assert.equal(sourceTargetConcat(alignment4), sourceTargetConcat(alignment3))
          done()
        })
      })
    })
  })
  it('align() should have results of high confidence if supporting data is in corrections.', function(done) {
    var pairForAlignment = ['hello world', 'dlrow olleh']
    var alignments = new tact.Alignments(options)
    var correctionCorpus = [["hello","olleh"]]
    alignments.correctionsTable.generate(corrections, function(){}, function() {
      alignments.align(alignmentPair, null, function(orderedAlignment) {
        var alignment = orderedAlignment[0]
        assert.isAtLeast(alignment.confidence, 1.0)
        done()
      })
    })
  })
  it('correctionsBySource() should return alignments for all sub phrase corrections', function(done) {
    var sourcePhrase = 'hello world'
    var alignments = new tact.Alignments(options)
    alignments.correctionsBySource(sourcePhrase, function(alignments) {
      assert.equal(alignments.length, 1)
      done()
    })
  })
  it('align() should return empty array empty string is provided.', function(done) {
    var alignments = new tact.Alignments(options)
    alignments.align([' ', ' '], null, function(orderedAlignment) {
      assert.equal(orderedAlignment.length, 0)
      alignments.align(['hello', ' '], null, function(orderedAlignment) {
        assert.equal(orderedAlignment.length, 0)
        alignments.align([' ', 'olleh'], null, function(orderedAlignment) {
          assert.equal(orderedAlignment.length, 0)
          done()
        })
      })
    })
  })
})
