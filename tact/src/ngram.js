var ngram = function(array, length) {
  var ngramsArray = [];
  for (var i = 0; i < array.length - (length - 1); i++) {
    var subNgramsArray = [];
    for (var j = 0; j < length; j++) {
      subNgramsArray.push(array[i + j])
    }
    ngramsArray.push(subNgramsArray);
  }
  return ngramsArray;
}
exports.ngram = ngram;
