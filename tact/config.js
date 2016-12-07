var defaults = {}

defaults.global = {
  features: {
    staticScores: true
  },
  sourceLanguage: 'greek',
  targetLanguage: 'english',
  ngram: {
    source: 2,
    target: 3
  }
}

defaults.train = {
  features: {
  }
}

defaults.align = {
  features: {
    ngramPriority: true,
    phraseCount: true,
    sizeDelta: true,
    penalties: true
  },
  penalties: {
    conflict: 2
  },
  bonus: {
    correction: 1.0 // added to score
  },
  corrections: {
    ngramMultiplier: 10 // multiplier for longerNgrams weight
  },
  ngrams: {
    sourceScores: [0, 1.0, 0.8, 0.6], //[0,1,2]
    targetScores: [0, 0.9, 1.0, 0.8, 0.7] //[0,1,2,3,4]
  },
  staticScoreRatios: {
    phraseCount: 0.5,
    wordOrder: 0.5
  },
  weights: { // weighted averaged (Ar*Aw + Br*Bw + Cr*Cw)/Sum(weights)
    ratio: 10,
    ngram: 3,
    phraseCount: 2,
    wordOrder: 4,
    sizeDelta: 5
  }
}

exports = module.exports = defaults
