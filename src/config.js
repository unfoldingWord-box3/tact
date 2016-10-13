
exports.ngrams = {
  sourceMax: 1,
  targetMax: 4,
  sourceScores: [0, 1.0, 0.5], //[0,1,2]
  targetScores: [0, 0.9, 1.0, 0.8, 0.7] //[0,1,2,3,4]
};

exports.weights = {
  tableRatios: 10,
  sourceUniqueness: 4,
  targetUniqueness: 0,
  longerNgrams: 3,
  occurrenceDelta: 2,
  positionDelta: 4,
  sizeDelta: 5,
  conflict: 100
};
