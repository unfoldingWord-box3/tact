var natural = require('natural');
var XRegExp = require('xregexp');
var nonUnicodeLetter = XRegExp('\\PL');
var tokenizer = new natural.RegexpTokenizer({pattern: nonUnicodeLetter});
var ngrams = natural.NGrams;

var n = 2;

function forObject(object, callback) {
  return Object.keys(object).map(function (key) {
    return callback(key, object[key]);
  });
}

function arrayIntersect(a, b) {
  var ai=0, bi=0;
  var result = [];
  while( ai < a.length && bi < b.length )
  {
     if      (a[ai] < b[bi] ){ ai++; }
     else if (a[ai] > b[bi] ){ bi++; }
     else /* they're equal */
     { result.push(a[ai]); ai++; bi++; }
  }
  return result;
}

function countInArray(array, item) {
    var count = 0;
    for (var i = 0; i < array.length; i++) {
        if (array[i] === item) { count++; }
    }
    return count;
}

var ngram = function(string, n) {
  ngramArray = []
  var i;
  for (i=1; i < n+1; i++) {
    var tokens = tokenizer.tokenize(string);
    var _ngrams = ngrams.ngrams(tokens, i);
    _ngrams.forEach(function(_ngramArray, _i) {
      var ngramString = _ngramArray.join(' ');
      ngramArray.push(ngramString);
    });
  }
  return ngramArray;
}

var tableGenerate = function(trainingSet) {
  var table = {}; // response
  // loop through trainingSet
  // generate ngrams of source and target
  trainingSet.forEach(function(pair, index) {
    var source = pair[0];
    var target = pair[1];
    var sourceArray = ngram(source, n);
    var targetArray = ngram(target, n);
    sourceArray.forEach(function(sourceNgram, index) {
      if (table[sourceNgram] === undefined) {
        table[sourceNgram] = {};
      }
      targetArray.forEach(function(targetNgram, index) {
        if (table[sourceNgram][targetNgram] === undefined) {
          table[sourceNgram][targetNgram] = 1;
        } else {
          table[sourceNgram][targetNgram] ++;
        }
      });
    });
  });
  trainingSet = [];
  return table;
};

var alignmentData = function(sourceNgramArray, targetNgramArray, table) {
  var _alignmentData = [];
  sourceNgramArray.forEach(function(sourceNgram, index){
    var alignmentsPerSource = [];
    var total = 0;
    if (table[sourceNgram] !== undefined) {
      forObject(table[sourceNgram], function(targetNgram, times){
        if (targetNgramArray.indexOf(targetNgram) > -1) {
          total = total + times;
          var alignmentObject = {
            sourceNgram: sourceNgram,
            targetNgram: targetNgram,
            times: times
          };
          alignmentsPerSource.push(alignmentObject);
        }
      });
    }
    alignmentsPerSource.forEach(function(alignmentObject) {
      alignmentObject.total = total;
      var ratio = alignmentObject.times / total;
      alignmentObject.ratio = ratio;
      alignmentObject = score(sourceNgramArray, targetNgramArray, alignmentObject);
      _alignmentData.push(alignmentObject);
    });
  });
  // console.log(_alignmentData);
  return _alignmentData;
}

// score the alignmentObject based on the criteria such as ngram length
var score = function(sourceNgramArray, targetNgramArray, alignmentObject) {
  var boostNgramCount = 0.25;
  var boostMatchCount = 2;

  var sourceNgramCount = tokenizer.tokenize(alignmentObject.sourceNgram).length;
  var targetNgramCount = tokenizer.tokenize(alignmentObject.targetNgram).length;
  var boostSourceNgram = Math.pow(sourceNgramCount, boostNgramCount);
  var boostTargetNgram = Math.pow(targetNgramCount, boostNgramCount);

  var sourceMatchCount = countInArray(sourceNgramArray, alignmentObject.sourceNgram);
  var targetMatchCount = countInArray(targetNgramArray, alignmentObject.targetNgram);
  if (sourceMatchCount != targetMatchCount) {
    boostMatchCount = 1;
  }

  var ratio = alignmentObject.ratio;
  var score = ratio * boostSourceNgram * boostTargetNgram * boostMatchCount;
  alignmentObject.score = score;
  return alignmentObject;
}

// determine the combination of best alignmentObjects for highest combined score
var bestAlignments = function(sourceString, targetString, _alignmentData) {
  var alignment = []; // response
  var available = _alignmentData.slice(0);
  available.sort(function(a,b) {
    return b.score - a.score;
  });
  do { // use all words
    var best = bestAlignment(available);
    available = removeConflictingAlignments(best, available);
    var bestPair = [best.sourceNgram, best.targetNgram, Math.round( best.score * 1000) / 1000]
    alignment.push(bestPair);
  } while (available.length > 0);
  return alignment;
}

var isConflict = function(alignmentObjectA, alignmentObjectB) {
  var conflict = false; // response
  var sourceWordsA = tokenizer.tokenize(alignmentObjectA.sourceNgram);
  var targetWordsA = tokenizer.tokenize(alignmentObjectA.targetNgram);
  var sourceWordsB = tokenizer.tokenize(alignmentObjectB.sourceNgram);
  var targetWordsB = tokenizer.tokenize(alignmentObjectB.targetNgram);
  sourceCommon = arrayIntersect(sourceWordsA, sourceWordsB);
  targetCommon = arrayIntersect(targetWordsA, targetWordsB);
  if (sourceCommon.length > 0) { conflict = true; }
  if (targetCommon.length > 0) { conflict = true; }
  return conflict;
}

var removeConflictingAlignments = function(alignmentObject, _available) {
  var available = _available.slice(0);
  available.forEach(function(_alignmentObject, index) {
    var conflict = isConflict(alignmentObject, _alignmentObject)
    if (conflict) {
      var currentRoamingIndex = _available.indexOf(_alignmentObject);
      _available.splice(currentRoamingIndex, 1);
    }
  });
  return _available;
}

// determine the best single alignmentObject
var bestAlignment = function(_alignmentData) {
  var alignmentObject;
  alignmentObject = _alignmentData[0];
  return alignmentObject;
}

var align = function(pairForAlignment, table) {
  var alignment; // response
  var sourceString = pairForAlignment[0];
  var targetString = pairForAlignment[1];
  var sourceNgramArray = ngram(sourceString, n);
  var targetNgramArray = ngram(targetString, n);

  var _alignmentData = alignmentData(sourceNgramArray, targetNgramArray, table);
  alignment = bestAlignments(sourceString, targetString, _alignmentData);
  // process of elimination
    // align words/phrases found in userLexicon
    // align words/phrases found in keywordLexicon
    // build statisticalLexicon from remaining ngrams.
  return alignment;
};

exports.align = align;
exports.tableGenerate = tableGenerate;
