
exports.segmentation = {
  corpus: true,
  aligner: false
}

exports.ngrams = {
  sourceMax: 2,
  targetMax: 3,
  sourceScores: [0, 1.0, 0.9, 0.8], //[0,1,2]
  targetScores: [0, 0.9, 1.0, 0.8, 0.7] //[0,1,2,3,4]
};

exports.penalties = {
  conflict: 10
}

exports.bonus = {
  correction: 1.0 // added to score
}

exports.corrections = {
  applyLongerNgramsFirst: 10 // multiplier for longerNgrams weight
};

exports.weights = { // weighted averaged (Ar*Aw + Br*Bw + Cr*Cw)/Sum(weights)
  localSourceRatio: 5,
  localTargetRatio: 2,
  globalSourceRatio: 3,
  globalTargetRatio: 1,
  sourceUniqueness: 2,
  targetUniqueness: 1,
  longerNgrams: 3,
  occurrenceDelta: 2,
  positionDelta: 4,
  sizeDelta: 5
};
