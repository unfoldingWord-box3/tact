
exports.ngrams = {
  sourceMax: 2,
  targetMax: 3,
  sourceScores: [0, 1.0, 0.9], //[0,1,2]
  targetScores: [0, 0.9, 1.0, 0.8, 0.7] //[0,1,2,3,4]
};

exports.penalties = {
  conflict: 10
}

exports.bonus = {
  correction: 1.0 // added to score
}

exports.weights = { // weighted averaged (Ar*Aw + Br*Bw + Cr*Cw)/Sum(weights)
  tableRatios: 10,
  sourceUniqueness: 4,
  targetUniqueness: 0,
  longerNgrams: 3,
  occurrenceDelta: 2,
  positionDelta: 4,
  sizeDelta: 5
};
