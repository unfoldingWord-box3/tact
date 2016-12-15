// tests/aligner.js
var chai = require('chai')
var assert = chai.assert
var tact = require('./../tact/tact.js')
var options = require('config').Client

function reverse(s) {
  return s.split('').reverse().join('')
}

describe('scoring', function() {
  it('ratioScore() should calculate ratios from tallies', function(done) {
    var alignment = {source: 'a', target: 'b', tally: 2, localSourceTotal: 3, globalSourceTotal: 9, localTargetTotal: 3, globalTargetTotal: 9}
    alignment = tact.scoring.ratioScore(alignment)
    assert.isAtLeast(alignment.localSourceRatio, 0)
    assert.isAtMost(alignment.localSourceRatio, 1)
    assert.isAtLeast(alignment.globalSourceRatio, 0)
    assert.isAtMost(alignment.globalSourceRatio, 1)
    assert.isAtLeast(alignment.ratioScore, 0)
    assert.isAtMost(alignment.ratioScore, 1)
    done()
  })
  it('uniquenessScore() should calculate ratios from tallies', function(done) {
    var alignment = {source: 'a', target: 'b', tally: 2, localSourceTotal: 3, globalSourceTotal: 9, localTargetTotal: 3, globalTargetTotal: 9}
    alignment = tact.scoring.ratioScore(alignment)
    alignment = tact.scoring.uniquenessScore(alignment)
    assert.isAtLeast(alignment.sourceUniqueness, 0)
    assert.isAtMost(alignment.sourceUniqueness, 1)
    done()
  })
  it('ngramScore() should calculate score from ngrams', function(done) {
    var alignment = {source: 'a', target: 'b', tally: 2, localSourceTotal: 3, globalSourceTotal: 9 }
    var alignment = tact.scoring.ngramScore(options, alignment)
    assert.isAtLeast(alignment.ngramScore, 0)
    assert.isAtMost(alignment.ngramScore, 1)
    var alignment = {source: 'a b d', target: 'b a d', tally: 2, localSourceTotal: 3, globalSourceTotal: 9 }
    var alignment = tact.scoring.ngramScore(options, alignment)
    assert.isAtLeast(alignment.ngramScore, 0)
    assert.isAtMost(alignment.ngramScore, 1)
    done()
  })
  it('phraseCountScore() should calculate score', function(done) {
    var alignmentPair = [['a', 'b', 'd', 'c'], ['c', 'b', 'a', 'd']]
    var alignment = {source: 'a', target: 'b', tally: 2, localSourceTotal: 3, globalSourceTotal: 9 }
    var phraseCountScore = tact.scoring.phraseCountScore(alignment.source, alignment.target, alignmentPair[0], alignmentPair[1])
    assert.isAtLeast(phraseCountScore, 0)
    assert.isAtMost(phraseCountScore, 1)
    var alignment = {source: 'a b d', target: 'b a d', tally: 2, localSourceTotal: 3, globalSourceTotal: 9 }
    var phraseCountScore = tact.scoring.phraseCountScore(alignment.source, alignment.target, alignmentPair[0], alignmentPair[1])
    assert.isAtLeast(phraseCountScore, 0)
    assert.isAtMost(phraseCountScore, 1)
    done()
  })
  it('wordOrderScore() should calculate score', function(done) {
    var alignmentPair = ['a b d c', 'c b a d']
    var alignment = {source: 'a', target: 'b', tally: 2, localSourceTotal: 3, globalSourceTotal: 9 }
    var wordOrderScore = tact.scoring.wordOrderScore(alignment.source, alignment.target, alignmentPair[0], alignmentPair[1])
    assert.isAtLeast(wordOrderScore, 0)
    assert.isAtMost(wordOrderScore, 1)
    var alignment = {source: 'a b d', target: 'b a d', tally: 2, localSourceTotal: 3, globalSourceTotal: 9 }
    var wordOrderScore = tact.scoring.wordOrderScore(alignment.source, alignment.target, alignmentPair[0], alignmentPair[1])
    assert.isAtLeast(wordOrderScore, 0)
    assert.isAtMost(wordOrderScore, 1)
    var alignmentPair = ['a b, d c', 'c b-a d']
    var alignment = {source: 'a b d', target: 'b a d', tally: 2, localSourceTotal: 3, globalSourceTotal: 9 }
    var wordOrderScore = tact.scoring.wordOrderScore(alignment.source, alignment.target, alignmentPair[0], alignmentPair[1])
    assert.isAtLeast(wordOrderScore, 0)
    assert.isAtMost(wordOrderScore, 1)
    done()
  })
  it('sizeDeltaScore() should calculate score', function(done) {
    var alignmentPair = ['a b d c', 'c b a d']
    var alignment = {source: 'a', target: 'b', tally: 2, localSourceTotal: 3, globalSourceTotal: 9, localTargetTotal: 3, globalTargetTotal: 9}
    var sizeDeltaScore = tact.scoring.sizeDeltaScore(alignment.source, alignment.target, alignmentPair[0], alignmentPair[1])
    assert.isAtLeast(sizeDeltaScore, 0)
    assert.isAtMost(sizeDeltaScore, 1)
    var alignment = {source: 'a b d', target: 'b a d', tally: 2, localSourceTotal: 3, globalSourceTotal: 9, localTargetTotal: 3, globalTargetTotal: 9}
    var sizeDeltaScore = tact.scoring.sizeDeltaScore(alignment.source, alignment.target, alignmentPair[0], alignmentPair[1])
    assert.isAtLeast(sizeDeltaScore, 0)
    assert.isAtMost(sizeDeltaScore, 1)
    var alignmentPair = ['a b, d c', 'c b-a d']
    var alignment = {source: 'a b d', target: 'b a d', tally: 2, localSourceTotal: 3, globalSourceTotal: 9, localTargetTotal: 3, globalTargetTotal: 9}
    var sizeDeltaScore = tact.scoring.sizeDeltaScore(alignment.source, alignment.target, alignmentPair[0], alignmentPair[1])
    assert.isAtLeast(sizeDeltaScore, 0)
    assert.isAtMost(sizeDeltaScore, 1)
    done()
  })
  it('score() should calculate score', function(done) {
    var alignmentPair = ['a b d c', 'c b a d']
    var alignment = {source: 'a', target: 'b', tally: 2, localSourceTotal: 3, globalSourceTotal: 9, localTargetTotal: 3, globalTargetTotal: 9, staticScore: {phraseCountScore: 1, wordOrderScore: 1}}
    var alignment = tact.scoring.score(options, alignmentPair, alignment)
    assert.isAtLeast(alignment.score, 0)
    assert.isAtMost(alignment.score, 1)
    var alignment = {source: 'a b d', target: 'b a d', tally: 2, localSourceTotal: 3, globalSourceTotal: 9, localTargetTotal: 3, globalTargetTotal: 9, staticScore: {phraseCountScore: 1, wordOrderScore: 1}}
    var alignment = tact.scoring.score(options, alignmentPair, alignment)
    assert.isAtLeast(alignment.score, 0)
    assert.isAtMost(alignment.score, 1)
    var alignmentPair = ['a b, d c', 'c b-a d']
    var alignment = {source: 'a b d', target: 'b a d', tally: 2, localSourceTotal: 3, globalSourceTotal: 9, localTargetTotal: 3, globalTargetTotal: 9, staticScore: {phraseCountScore: 1, wordOrderScore: 1}}
    var alignment = tact.scoring.score(options, alignmentPair, alignment)
    assert.isAtLeast(alignment.score, 0)
    assert.isAtMost(alignment.score, 1)
    done()
  })
})
