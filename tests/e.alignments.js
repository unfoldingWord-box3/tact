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
    var alignments = new tact.Alignments(options, ['taco world', 'ocat dlrow'])
    assert.equal(alignments.alignments.length, 0)
    alignments.getAlignments(function() {
      assert.equal(alignments.alignments.length, 7)
      done()
    })
  })
  it('penalizeUnneeded() should update alignments', function(done) {
    var alignments = new tact.Alignments(options, ['taco world', 'ocat dlrow'])
    alignments.getAlignments(function() {
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
    var alignments = new tact.Alignments(options, ['taco world', 'ocat dlrow'])
    alignments.getAlignments(function() {
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
    var alignments = new tact.Alignments(options, alignmentPair)
    var tokens = tact.tokenizer.tokenize(alignmentPair[0])
    var count = tokens.length
    alignments.align(function(orderedAlignment) {
      assert.equal(orderedAlignment.length, count)
      done()
    })
  })
  it('align() should return an object of which values are an array of string and number.', function(done) {
    var alignmentPair = ['taco world', 'ocat dlrow']
    var alignments = new tact.Alignments(options, alignmentPair)
    alignments.align(function(orderedAlignment) {
      var alignment = orderedAlignment[0]
      assert.isString(alignment.source)
      assert.isString(alignment.target)
      assert.isNumber(alignment.confidence)
      done()
    })
  })
  it('align() should have results of high confidence if supporting data is in corrections.', function(done) {
    var pairForAlignment = ['hello world', 'dlrow olleh']
    var alignments = new tact.Alignments(options, alignmentPair)
    var correctionCorpus = [["hello","olleh"]]
    alignments.correctionsTable.generate(corrections, function(){}, function() {
      alignments.align(function(orderedAlignment) {
        var alignment = orderedAlignment[0]
        assert.isAtLeast(alignment.confidence, 1.0)
        done()
      })
    })
  })

  it('align() should return empty array empty string is provided.', function(done) {
    var alignments = new tact.Alignments(options, [' ', ' '])
    alignments.align(function(orderedAlignment) {
      assert.equal(orderedAlignment.length, 0)
      var alignments = new tact.Alignments(options, ['hello', ' '])
      alignments.align(function(orderedAlignment) {
        assert.equal(orderedAlignment.length, 0)
        var alignments = new tact.Alignments(options, [' ', 'olleh'])
        alignments.align(function(orderedAlignment) {
          assert.equal(orderedAlignment.length, 0)
          done()
        })
      })
    })
  })
})
