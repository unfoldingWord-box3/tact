// tests/aligner.js
var chai = require('chai')
var assert = chai.assert
var tact = require('./../tact/tact.js')
var options = require('config').Client

function reverse(s) {
  return s.split('').reverse().join('')
}

describe('Alignment.ratioScore()', function() {
  it('should calculate ratios from tallies', function() {
    var alignment = new tact.Alignment(options, 'a', 'b', false, true)
    alignment.addTally(2)
    alignment.addLocalTotals(3,3)
    alignment.addGlobalTotals(9,9)
    alignment.ratioScore()
    assert.isAtLeast(alignment.ratios.localSource, 0)
    assert.isAtMost(alignment.ratios.localSource, 1)
    assert.isAtLeast(alignment.ratios.globalSource, 0)
    assert.isAtMost(alignment.ratios.globalSource, 1)
    assert.isAtLeast(alignment.scores.ratio, 0)
    assert.isAtMost(alignment.scores.ratio, 1)
  })
})

describe('Alignment.uniquenessScore()', function() {
  it('should calculate ratios from tallies', function() {
    var alignment = new tact.Alignment(options, 'a', 'b', false, true)
    alignment.addTally(2)
    alignment.addLocalTotals(3,3)
    alignment.addGlobalTotals(9,9)
    alignment.ratioScore()
    alignment.uniquenessScore()
    assert.isAtLeast(alignment.uniqueness.source, 0)
    assert.isAtMost(alignment.uniqueness.source, 1)
  })
})

describe('Alignment.ngramScore()', function() {
  it('should calculate score from ngrams', function() {
    var alignmentPair = ['a b d c', 'c b a d']
    var alignment = new tact.Alignment(options, 'a', 'b', false, true)
    alignment.ngramScore(alignmentPair)
    assert.isAtLeast(alignment.scores.ngram, 0)
    assert.isAtMost(alignment.scores.ngram, 1)
    var alignment = new tact.Alignment(options, 'a b', 'b a', false, true)
    alignment.ngramScore(alignmentPair)
    assert.isAtLeast(alignment.scores.ngram, 0)
    assert.isAtMost(alignment.scores.ngram, 1)
  })
  it('should calculate score from ngrams with varying use cases', function() {
    var alignmentPair = ['a b d c', 'a c b a d e']
    var alignment = new tact.Alignment(options, 'a', 'b a d', false, true)
    alignment.ngramScore(alignmentPair)
    assert.isAtLeast(alignment.scores.ngram, 0)
    assert.isAtMost(alignment.scores.ngram, 1)
    var alignment = new tact.Alignment(options, 'a b', 'b a d', false, true)
    alignment.ngramScore(alignmentPair)
    assert.isAtLeast(alignment.scores.ngram, 0)
    assert.isAtMost(alignment.scores.ngram, 1)
    var alignment = new tact.Alignment(options, 'a b', 'b', false, true)
    alignment.ngramScore(alignmentPair)
    assert.isAtLeast(alignment.scores.ngram, 0)
    assert.isAtMost(alignment.scores.ngram, 1)
    var alignmentPair = ['a b d c e f', 'a c b a']
    var alignment = new tact.Alignment(options, 'a', 'b a d', false, true)
    alignment.ngramScore(alignmentPair)
    assert.isAtLeast(alignment.scores.ngram, 0)
    assert.isAtMost(alignment.scores.ngram, 1)
    var alignment = new tact.Alignment(options, 'a b', 'b a d', false, true)
    alignment.ngramScore(alignmentPair)
    assert.isAtLeast(alignment.scores.ngram, 0)
    assert.isAtMost(alignment.scores.ngram, 1)
    var alignment = new tact.Alignment(options, 'a b', 'b', false, true)
    alignment.ngramScore(alignmentPair)
    assert.isAtLeast(alignment.scores.ngram, 0)
    assert.isAtMost(alignment.scores.ngram, 1)
    var alignmentPair = ['a b d e.', undefined]
    var alignment = new tact.Alignment(options, 'a', 'b a d', false, false)
    alignment.ngramScore(alignmentPair)
    assert.isAtLeast(alignment.scores.ngram, 0)
    assert.isAtMost(alignment.scores.ngram, 1)
    var alignment = new tact.Alignment(options, 'a b', 'b a d', false, false)
    alignment.ngramScore(alignmentPair)
    assert.isAtLeast(alignment.scores.ngram, 0)
    assert.isAtMost(alignment.scores.ngram, 1)
    var alignment = new tact.Alignment(options, 'a b', 'b', false, false)
    alignment.ngramScore(alignmentPair)
    assert.isAtLeast(alignment.scores.ngram, 0)
    assert.isAtMost(alignment.scores.ngram, 1)
  })
  it('should calculate score from ngrams where they are the entire string', function() {
    var alignmentPair = ['a', 'b']
    var alignment = new tact.Alignment(options, 'a', 'b', false, true)
    alignment.ngramScore(alignmentPair)
    assert.isAtLeast(alignment.scores.ngram, 0)
    assert.isAtMost(alignment.scores.ngram, 1)
    var alignmentPair = ['a b', 'b a']
    var alignment = new tact.Alignment(options, 'a b', 'b a', false, true)
    alignment.ngramScore(alignmentPair)
    assert.isAtLeast(alignment.scores.ngram, 0)
    assert.isAtMost(alignment.scores.ngram, 1)
  })
  it('should calculate score from ngrams where they are spaces', function() {
    var alignmentPair = ['a', 'b']
    var alignment = new tact.Alignment(options, 'a', ' ', false, true)
    alignment.ngramScore(alignmentPair)
    assert.isAtLeast(alignment.scores.ngram, 0)
    assert.isAtMost(alignment.scores.ngram, 1)
    var alignment = new tact.Alignment(options, ' ', ' ', false, true)
    alignment.ngramScore(alignmentPair)
    assert.isAtLeast(alignment.scores.ngram, 0)
    assert.isAtMost(alignment.scores.ngram, 1)
    var alignmentPair = ['a b', 'b a']
    var alignment = new tact.Alignment(options, ' ', 'b a', false, true)
    alignment.ngramScore(alignmentPair)
    assert.isAtLeast(alignment.scores.ngram, 0)
    assert.isAtMost(alignment.scores.ngram, 1)
  })
  it('should calculate score from ngrams if no target in alignment pair', function() {
    var alignmentPair = ['a b d c']
    var alignment = new tact.Alignment(options, 'a', 'b', false, true)
    alignment.ngramScore(alignmentPair)
    assert.isAtLeast(alignment.scores.ngram, 0)
    assert.isAtMost(alignment.scores.ngram, 1)
    var alignmentPair = ['a b d c']
    var alignment = new tact.Alignment(options, 'a b', 'b', false, true)
    alignment.ngramScore(alignmentPair)
    assert.isAtLeast(alignment.scores.ngram, 0)
    assert.isAtMost(alignment.scores.ngram, 1)
  })
})

describe('Alignment.phraseCountScore()', function() {
  it('should calculate score', function() {
    var alignmentPair = ['a b d c', 'c b a d']
    var alignment = new tact.Alignment(options, 'a', 'b', false, true)
    var phraseCountScore = alignment.phraseCountScore(alignmentPair)
    assert.isAtLeast(phraseCountScore, 0)
    assert.isAtMost(phraseCountScore, 1)
    var alignment = new tact.Alignment(options, 'a b d', 'b a d', false, true)
    var phraseCountScore = alignment.phraseCountScore(alignmentPair)
    assert.isAtLeast(phraseCountScore, 0)
    assert.isAtMost(phraseCountScore, 1)
  })
})

describe('Alignment.wordOrderScore()', function() {
  it('should calculate score', function() {
    var alignmentPair = ['a b d c', 'c b a d']
    var alignment = new tact.Alignment(options, 'a', 'b', false, true)
    var wordOrderScore = alignment.wordOrderScore(alignmentPair)
    assert.isAtLeast(wordOrderScore, 0)
    assert.isAtMost(wordOrderScore, 1)
    var alignment = new tact.Alignment(options, 'a b d', 'b a d', false, true)
    var wordOrderScore = alignment.wordOrderScore(alignmentPair)
    assert.isAtLeast(wordOrderScore, 0)
    assert.isAtMost(wordOrderScore, 1)
    var alignmentPair = ['a b, d c', 'c b-a d']
    var alignment = new tact.Alignment(options, 'a b d', 'b a d', false, true)
    var wordOrderScore = alignment.wordOrderScore(alignmentPair)
    assert.isAtLeast(wordOrderScore, 0)
    assert.isAtMost(wordOrderScore, 1)
  })
})

describe('Alignment.sizeDeltaScore()', function() {
  it('should calculate score', function() {
    var alignmentPair = ['a b d c', 'c b a d']
    var alignment = new tact.Alignment(options, 'a', 'b', false, true)
    var sizeDeltaScore = alignment.sizeDeltaScore(alignmentPair)
    assert.isAtLeast(sizeDeltaScore, 0)
    assert.isAtMost(sizeDeltaScore, 1)
    var alignment = new tact.Alignment(options, 'a b d', 'b a d', false, true)
    var sizeDeltaScore = alignment.sizeDeltaScore(alignmentPair)
    assert.isAtLeast(sizeDeltaScore, 0)
    assert.isAtMost(sizeDeltaScore, 1)
    var alignmentPair = ['a b, d c', 'c b-a d']
    var alignment = new tact.Alignment(options, 'a b d', 'b a d', false, true)
    var sizeDeltaScore = alignment.sizeDeltaScore(alignmentPair)
    assert.isAtLeast(sizeDeltaScore, 0)
    assert.isAtMost(sizeDeltaScore, 1)
  })
})

describe('Alignment.score()', function() {
  it('should calculate score', function() {
    var alignmentPair = ['a b d c', 'c b a d']
    var alignment = new tact.Alignment(options, 'a', 'b', false, true)
    alignment.addTally(2)
    alignment.addLocalTotals(3,3)
    alignment.addGlobalTotals(9,9)
    alignment.score(alignmentPair)
    assert.isAtLeast(alignment.confidence, 0)
    assert.isAtMost(alignment.confidence, 1)
    var alignment = new tact.Alignment(options, 'a b d', 'b a d', false, true)
    alignment.addTally(2)
    alignment.addLocalTotals(3,3)
    alignment.addGlobalTotals(9,9)
    alignment.score(alignmentPair)
    assert.isAtLeast(alignment.confidence, 0)
    assert.isAtMost(alignment.confidence, 1)
    var alignmentPair = ['a b, d c', 'c b-a d']
    var alignment = new tact.Alignment(options, 'a b d', 'b a d', false, true)
    alignment.addTally(2)
    alignment.addLocalTotals(3,3)
    alignment.addGlobalTotals(9,9)
    alignment.score(alignmentPair)
    assert.isAtLeast(alignment.confidence, 0)
    assert.isAtMost(alignment.confidence, 1)
  })
})

describe('Alignment.isNeeded()', function() {
  it('should update alignments', function() {
    var alignment = new tact.Alignment(options, 'a', 'b', false, true)
    alignment.isNeeded('z', alignment.target)
    assert.isNotTrue(alignment.sourceNeeded)
    assert.isTrue(alignment.targetNeeded)
    alignment = new tact.Alignment(options, 'a', 'b', false, true)
    alignment.isNeeded(alignment.source, 'y')
    assert.isTrue(alignment.sourceNeeded)
    assert.isNotTrue(alignment.targetNeeded)
    alignment = new tact.Alignment(options, 'a', 'b', false, true)
    alignment.isNeeded('z', 'y')
    assert.isNotTrue(alignment.sourceNeeded)
    assert.isNotTrue(alignment.targetNeeded)
  })
  it('should not update where target is " " alignments', function() {
    var alignment = new tact.Alignment(options, 'a', ' ', false, true)
    alignment.isNeeded('z', 'y')
    assert.isNotTrue(alignment.sourceNeeded)
    assert.isTrue(alignment.targetNeeded)
    alignment = new tact.Alignment(options, ' ', 'b', false, true)
    alignment.isNeeded('z', 'y')
    assert.isTrue(alignment.sourceNeeded)
    assert.isNotTrue(alignment.targetNeeded)
    alignment = new tact.Alignment(options, ' ', ' ', false, true)
    alignment.isNeeded('z', 'y')
    assert.isTrue(alignment.sourceNeeded)
    assert.isTrue(alignment.targetNeeded)
  })
})
