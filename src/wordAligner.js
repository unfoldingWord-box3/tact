var natural = require('natural');
var XRegExp = require('xregexp');
var nonUnicodeLetter = XRegExp('\\PL');
var tokenizer = new natural.RegexpTokenizer({pattern: nonUnicodeLetter});
var ngrams = natural.NGrams;

var n = 4;

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
    var sourceArray = ngram(source, 1);
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

var alignmentData = function(sourceString, targetString, table) {
  var _alignmentData = [];

  var sourceNgramArray = ngram(sourceString, 1);
  var targetNgramArray = ngram(targetString, n);

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
      alignmentObject = score(sourceString, targetString, sourceNgramArray, targetNgramArray, alignmentObject);
      _alignmentData.push(alignmentObject);
    });
  });
  // console.log(_alignmentData);
  return _alignmentData;
}

// score the alignmentObject based on the criteria such as ngram length
var score = function(sourceString, targetString, sourceNgramArray, targetNgramArray, alignmentObject) {
  var boostNgramCount = 1; // anything over 1 is increasing
  var boostMatchCount = 0.5; // anything over 1 is increasing
  var boostMatchOrder = 2; // anything over 1 is increasing

  var sourceNgram = alignmentObject.sourceNgram;
  var targetNgram = alignmentObject.targetNgram;

  // favor phrases over words
  var sourceNgramCount = tokenizer.tokenize(sourceNgram).length;
  var targetNgramCount = tokenizer.tokenize(targetNgram).length;
  // var boostSourceNgram = Math.pow(boostNgramCount, sourceNgramCount);
  if (targetNgramCount == 1) boostTargetNgram = 1.1;
  if (targetNgramCount == 2) boostTargetNgram = 2;
  if (targetNgramCount == 3) boostTargetNgram = 1.5;
  if (targetNgramCount == 4) boostTargetNgram = 1.3;
  // boostTargetNgram = (1-(1/(targetNgramCount+1))) + 0.5;

  // favor words/phrases that occur same number of times in source and target
  var sourceMatchCount = countInArray(sourceNgramArray, sourceNgram);
  var targetMatchCount = countInArray(targetNgramArray, targetNgram);
  var deltaCount = Math.abs(sourceMatchCount - targetMatchCount);
  boostMatchCount = Math.pow( (1/(deltaCount+1)), boostMatchCount);

  // favor words/phrases that occur in the same place in the sentence
  var sourceLength = sourceString.length;
  var targetLength = targetString.length;
  var sourcePosition = sourceString.indexOf(sourceNgram);
  var targetPosition = targetString.indexOf(targetNgram);
  var sourceRatio = sourcePosition / sourceLength;
  var targetRatio = targetPosition / targetLength;
  var deltaRatio = Math.abs(sourceRatio - targetRatio);
  boostMatchOrder = Math.pow((1 - deltaRatio), boostMatchOrder);

  var ratio = alignmentObject.ratio;
  var score = ratio * boostTargetNgram * boostMatchCount * boostMatchOrder;
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

// not useful now but the start of an alternate approach if not based on removing all conflicts to end the loop
var penalizeConflictingAlignments = function(alignmentObject, available) {
  var penalty = 2;
  available.forEach(function(_alignmentObject, index) {
    var conflict = isConflict(alignmentObject, _alignmentObject)
    if (conflict) {
      _alignmentObject.score = _alignmentObject.score / penalty;
    }
  });
  return available;
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

// sourceTokens = [tokens...]
// alignment = [sourceNgram, targetNgram, score]
// this function could be optimized by passing in alignment as an object instead of array
var alignmentBySourceTokens = function(_sourceTokens, alignment) {
  sourceTokens = _sourceTokens.slice(0);
  var orderedAlignment = []; // response

  // transform alignment into object to look up ngrams
  unorderedAlignment = {};
  alignment.forEach(function(alignmentObject, index) {
    unorderedAlignment[alignmentObject[0]] = alignmentObject;
  });

  // build queue of tokens to look up
  var queue = [];
  var found;
  var notfound = [];
  while (sourceTokens.length > 0) {
    // Start with source string tokens and look up one by one
    // Some tokens may be conjoined with next token if not found
    queue.push(sourceTokens.shift());
    // Look up alignment from generated unordered alignment
    found = unorderedAlignment[queue.join(' ')];
    // see if queue is found and push to orderedAlignment array
    if (found != undefined) {
      // Push each found alignment in order found to response array
      orderedAlignment.push(found);
      queue = [];
    } else {
      if (queue.length == n) {
        // since this one can't be found remove the first token and move on
        notfound.push(queue.shift());
        // put back remaining tokens to be queued in next loop
        while (queue.length > 0) {
          sourceTokens.unshift(queue.pop());
        }
      }
    }
  }
  // console.log("unorderedAlignment: ", unorderedAlignment);
  // console.log("SourceTokens: ", sourceTokens);
  // console.log("orderedAlignment: ", orderedAlignment);
  // console.log("queue: ", queue);
  if (notfound.length > 0) console.log("notfound: ", notfound);
  // console.log("found: ", found);
  // console.log("n: ", n);

  // Potentially re-align remaining tokens not already aligned
  return orderedAlignment;
}

var align = function(pairForAlignment, table) {
  var alignment; // response
  var sourceString = pairForAlignment[0];
  var targetString = pairForAlignment[1];

  var _alignmentData = alignmentData(sourceString, targetString, table);
  alignment = bestAlignments(sourceString, targetString, _alignmentData);
  // process of elimination
    // align words/phrases found in userLexicon
    // align words/phrases found in keywordLexicon
    // build statisticalLexicon from remaining ngrams.

  // reorder alignments to match source order
  alignment = alignmentBySourceTokens(tokenizer.tokenize(sourceString), alignment);

  return alignment;
};

exports.align = align;
exports.tableGenerate = tableGenerate;
