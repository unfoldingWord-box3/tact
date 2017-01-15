// tests/aligner.js
var chai = require('chai')
var assert = chai.assert
var tact = require('./../tact/tact.js')
var options = require('config').Client

function reverse(s) {
  return s.split('').reverse().join('')
}

describe('Alignment.isPhraseScore()', function() {
  it('should return 1 when corpus and tally totals are 1 and phrase size is 0', function() {
    var alignment = new tact.Alignment(options, 'a', ' ', false, true)
    alignment.addTally(1)
    alignment.addCorpusTotals(1,1)
    var isPhraseScore = alignment.isPhraseScore()
    assert.equal(isPhraseScore, 0.9)
    alignment.addCorpusTotals(0,1)
    isPhraseScore = alignment.isPhraseScore()
    assert.equal(isPhraseScore, 0.9)
    var alignment = new tact.Alignment(options, ' ', 'b', false, true)
    alignment.addTally(1)
    alignment.addCorpusTotals(1,1)
    var isPhraseScore = alignment.isPhraseScore()
    assert.equal(isPhraseScore, 0.8)
    alignment.addCorpusTotals(0,1)
    isPhraseScore = alignment.isPhraseScore()
    assert.equal(isPhraseScore, 0.8)
  })
  it('should return 1 when corpus and tally totals are 1 and phrase size is 1', function() {
    var alignment = new tact.Alignment(options, 'a', 'b', false, true)
    alignment.addTally(1)
    alignment.addCorpusTotals(1,1)
    var isPhraseScore = alignment.isPhraseScore()
    assert.equal(isPhraseScore, 1)
    alignment.addCorpusTotals(0,1)
    isPhraseScore = alignment.isPhraseScore()
    assert.equal(isPhraseScore, 1)
  })
  it('should return 1 when either corpus totals are 1 and phrase size is 1', function() {
    var alignment = new tact.Alignment(options, 'a', 'b', false, true)
    alignment.addTally(1)
    alignment.addCorpusTotals(10,1)
    var isPhraseScore = alignment.isPhraseScore()
    assert.equal(isPhraseScore, 1)
    alignment = new tact.Alignment(options, 'a', 'b', false, true)
    alignment.addTally(1)
    alignment.addCorpusTotals(1,10)
    isPhraseScore = alignment.isPhraseScore()
    assert.equal(isPhraseScore, 1)
  })
  it('should return 0.1 when corpus and tally totals are 1 and phrase size is 2', function() {
    var alignment = new tact.Alignment(options, 'a b', 'b a', false, true)
    alignment.addTally(1)
    alignment.addCorpusTotals(1,1)
    var isPhraseScore = alignment.isPhraseScore()
    assert.equal(isPhraseScore, 0.1)
    alignment.addCorpusTotals(0,1)
    isPhraseScore = alignment.isPhraseScore()
    assert.equal(isPhraseScore, 0.1)
  })
  it('should return 0.1 when either corpus totals are 1 and phrase size is 2', function() {
    var alignment = new tact.Alignment(options, 'a b', 'b a', false, true)
    alignment.addTally(1)
    alignment.addCorpusTotals(10,1)
    var isPhraseScore = alignment.isPhraseScore()
    assert.equal(isPhraseScore, 0.1)
    alignment = new tact.Alignment(options, 'a b', 'b a', false, true)
    alignment.addTally(1)
    alignment.addCorpusTotals(1,10)
    isPhraseScore = alignment.isPhraseScore()
    assert.equal(isPhraseScore, 0.1)
  })
  it('should return 1 when totals are 2 and phrase size is 1', function() {
    var alignment = new tact.Alignment(options, 'a', 'b', false, true)
    alignment.addTally(2)
    alignment.addCorpusTotals(2,2)
    var isPhraseScore = alignment.isPhraseScore()
    assert.equal(isPhraseScore, 1)
  })
  it('should return 0.5 when totals are 2 and phrase size is 2', function() {
    var alignment = new tact.Alignment(options, 'a b', 'b a', false, true)
    alignment.addTally(2)
    alignment.addCorpusTotals(2,2)
    var isPhraseScore = alignment.isPhraseScore()
    assert.equal(isPhraseScore, 0.5)
  })

})

describe('Alignment.commonScore()', function() {
  it('should return 0.1 when corpus and tally totals are 1', function() {
    var alignment = new tact.Alignment(options, 'a', 'b', false, true)
    alignment.addTally(1)
    alignment.addCorpusTotals(1,1)
    var commonScore = alignment.commonScore()
    assert.equal(commonScore, 0.1)
    alignment.addCorpusTotals(0,1)
    commonScore = alignment.commonScore()
    assert.equal(commonScore, 0.1)
  })
  it('should return 0.1 when either corpus totals are 1', function() {
    var alignment = new tact.Alignment(options, 'a', 'b', false, true)
    alignment.addTally(1)
    alignment.addCorpusTotals(10,1)
    var commonScore = alignment.commonScore()
    assert.equal(commonScore, 0.1)
    alignment = new tact.Alignment(options, 'a', 'b', false, true)
    alignment.addTally(1)
    alignment.addCorpusTotals(1,10)
    commonScore = alignment.commonScore()
    assert.equal(commonScore, 0.1)
  })
  it('should return 0.5 when totals are 2', function() {
    var alignment = new tact.Alignment(options, 'a', 'b', false, true)
    alignment.addTally(2)
    alignment.addCorpusTotals(2,2)
    var commonScore = alignment.commonScore()
    assert.equal(commonScore, 0.5)
  })
  it('should return 0.667 when totals are 3', function() {
    var alignment = new tact.Alignment(options, 'a', 'b', false, true)
    alignment.addTally(3)
    alignment.addCorpusTotals(3,3)
    var commonScore = alignment.commonScore()
    assert.equal(commonScore, 0.6666666666666667)
  })
  it('should return 0.75 when totals are 4', function() {
    var alignment = new tact.Alignment(options, 'a', 'b', false, true)
    alignment.addTally(4)
    alignment.addCorpusTotals(4,4)
    var commonScore = alignment.commonScore()
    assert.equal(commonScore, 0.75)
  })
  it('should return 0.8 when totals are 5', function() {
    var alignment = new tact.Alignment(options, 'a', 'b', false, true)
    alignment.addTally(5)
    alignment.addCorpusTotals(5,5)
    var commonScore = alignment.commonScore()
    assert.equal(commonScore, 0.8)
  })
})

describe('Alignment.ratioScore()', function() {
  it('should calculate ratios from tallies', function() {
    var alignment = new tact.Alignment(options, 'a', 'b', false, true)
    alignment.addTally(2)
    alignment.addLocalTotals(3,3)
    alignment.addGlobalTotals(9,9)
    alignment.addCorpusTotals(2,2)
    alignment.ratioScore(true)
    assert.equal(alignment.ratios.localSource, 2/3)
    assert.equal(alignment.ratios.globalSource, 2/9)
    assert.isAtLeast(alignment.scores.ratio, alignment.ratios.globalSource)
    assert.isAtMost(alignment.scores.ratio, alignment.ratios.localSource)
  })
})

describe('Alignment.uniquenessScore()', function() {
  it('should be 0.5/1.0 in case where local is half of global', function() {
    var alignment = new tact.Alignment(options, 'a', 'b', false, true)
    alignment.addLocalTotals(1,1)
    alignment.addGlobalTotals(2,2)
    alignment.uniquenessScore()
    assert.equal(alignment.uniqueness.source, 0.5)
    assert.equal(alignment.uniqueness.target, 0.5)
    assert.equal(alignment.scores.uniqueness, 1.0)
  })
  it('should 0.6/1.0 when local is 3 and global is 5', function() {
    var alignment = new tact.Alignment(options, 'a', 'b', false, true)
    alignment.addLocalTotals(3,3)
    alignment.addGlobalTotals(5,5)
    alignment.uniquenessScore()
    assert.equal(alignment.uniqueness.source, 0.6)
    assert.equal(alignment.uniqueness.target, 0.6)
    assert.equal(alignment.scores.uniqueness, 1.0)

  })
  it('should be 0.5/0.6/0.9 when source/target are 2/4 and 3/5', function() {
    var alignment = new tact.Alignment(options, 'a', 'b', false, true)
    alignment.addLocalTotals(1,3)
    alignment.addGlobalTotals(2,5)
    alignment.uniquenessScore()
    assert.equal(alignment.uniqueness.source, 0.5)
    assert.equal(alignment.uniqueness.target, 0.6)
    assert.equal(alignment.scores.uniqueness, 0.9)
  })
  it('should be 1.0/0.02/0.02 when source/target are 2/4 and 3/5', function() {
    var alignment = new tact.Alignment(options, 'a', 'b', false, true)
    alignment.addLocalTotals(2,1)
    alignment.addGlobalTotals(2,10)
    alignment.uniquenessScore()
    assert.equal(alignment.uniqueness.source, 1.0)
    assert.equal(alignment.uniqueness.target, 0.1)
    assert.equal(alignment.scores.uniqueness, 0.09999999999999998)
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
  it('should return 1.0 if a word for both are found once each', function() {
    var alignmentPair = ['a b d c', 'c b a d']
    var alignment = new tact.Alignment(options, 'a', 'b', false, true)
    var phraseCountScore = alignment.phraseCountScore(alignmentPair)
    assert.equal(phraseCountScore, 1)
  })
  it('should return 1.0 if phrases are both found once each', function() {
    var alignmentPair = ['a b d c', 'c b a d']
    var alignment = new tact.Alignment(options, 'a b', 'b a d', false, true)
    var phraseCountScore = alignment.phraseCountScore(alignmentPair)
    assert.equal(phraseCountScore, 1)
  })
  it('should return 0.5 if one is found twice as much', function() {
    var alignmentPair = ['a b a d c', 'c b a d']
    var alignment = new tact.Alignment(options, 'a', 'b', false, true)
    var phraseCountScore = alignment.phraseCountScore(alignmentPair)
    assert.equal(phraseCountScore, 0.5)
  })
  it('should return 0.1 if one is found 10x as much', function() {
    var alignmentPair = ['a a a a b a a a aa d a a c a aa', 'c b a d']
    var alignment = new tact.Alignment(options, 'a', 'b', false, true)
    var phraseCountScore = alignment.phraseCountScore(alignmentPair)
    assert.equal(phraseCountScore, 0.1)
  })
})

describe('Alignment.wordOrderScore()', function() {
  it('should return 1 when both are same place', function() {
    var alignmentPair = ['a b d c', 'c b a d']
    var alignment = new tact.Alignment(options, 'a', 'c', false, true)
    var wordOrderScore = alignment.wordOrderScore(alignmentPair)
    assert.equal(wordOrderScore, 1)
  })
  it('should return 0.1 when they are on opposite sides', function() {
    var alignmentPair = ['a b d c e f g h ii j', 'c b a d e f g h ii j']
    var alignment = new tact.Alignment(options, 'a', 'j', false, true)
    var wordOrderScore = alignment.wordOrderScore(alignmentPair)
    assert.equal(wordOrderScore, 0.050000000000000044)
  })
  it('should return 1.0 when they are phrases at the beginning', function() {
    var alignmentPair = ['a b d c', 'c b a d']
    var alignment = new tact.Alignment(options, 'a b', 'c b a', false, true)
    var wordOrderScore = alignment.wordOrderScore(alignmentPair)
    assert.equal(wordOrderScore, 1)
  })
  it('should work when phrases were seperated by non word chars', function() {
    var alignmentPair = ['a b, d c', 'c b-a d']
    var alignment = new tact.Alignment(options, 'd c', 'b a d', false, true)
    var wordOrderScore = alignment.wordOrderScore(alignmentPair)
    assert.isAtLeast(wordOrderScore, 0)
    assert.isAtMost(wordOrderScore, 1)
  })
})

describe('Alignment.sizeDeltaScore()', function() {
  it('should be 1.0 for same length', function() {
    var alignment = new tact.Alignment(options, 'a', 'b', false, true)
    var sizeDeltaScore = alignment.sizeDeltaScore()
    assert.equal(sizeDeltaScore, 1)
    var alignment = new tact.Alignment(options, 'a b d', 'b a d', false, true)
    var sizeDeltaScore = alignment.sizeDeltaScore()
    assert.equal(sizeDeltaScore, 1)
  })
  it('should be 0.2 for much longer length', function() {
    var alignment = new tact.Alignment(options, 'a', 'b a d', false, true)
    var sizeDeltaScore = alignment.sizeDeltaScore()
    assert.equal(sizeDeltaScore, 0.2)
  })
  it('should be 0.8 for little longer length', function() {
    var alignment = new tact.Alignment(options, 'a bd', 'b a d', false, true)
    var sizeDeltaScore = alignment.sizeDeltaScore()
    assert.equal(sizeDeltaScore, 0.8)
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
