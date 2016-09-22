var natural = require('natural');
var XRegExp = require('xregexp');
var nonUnicodeLetter = XRegExp('\\PL+');
// var nonUnicodeLetter = XRegExp('[^\\pL]+');
var tokenizer = new natural.RegexpTokenizer({pattern: nonUnicodeLetter});
var ngrams = natural.NGrams;

var n = 4;

var weights = {
  tableRatios: 60,
  sourceUniqueness: 40,
  targetUniqueness: 0,
  longerNgrams: 10,
  occurrenceDelta: 10,
  positionDelta: 50,
  conflict: 500
}

function sum( obj ) {
  var sum = 0;
  for( var el in obj ) {
    if( obj.hasOwnProperty( el ) ) {
      sum += parseFloat( obj[el] );
    }
  }
  return sum;
}

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

// can pass in table so that it can incriment counts
var tableGenerate = function(trainingSet, table) {
  if (table == undefined) var table = {}; // response
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
    var total = 0; // rename to filtered
    var sourceNgramTotal = 0;
    if (table[sourceNgram] !== undefined) {
      forObject(table[sourceNgram], function(targetNgram, times){
        sourceNgramTotal = sourceNgramTotal + times;
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
      alignmentObject.sourceUniqueness = total/sourceNgramTotal;
      alignmentObject.conflict = false;
      alignmentObject.sourceUsed = false;
      alignmentObject = score(sourceString, targetString, sourceNgramArray, targetNgramArray, alignmentObject);
      _alignmentData.push(alignmentObject);
    });
  });
  // console.log(_alignmentData);
  return _alignmentData;
}

// score the alignmentObject based on the criteria such as ngram length
var score = function(sourceString, targetString, sourceNgramArray, targetNgramArray, alignmentObject) {
  var longerNgramScore, occurrenceDeltaScore, positionDeltaScore;

  var sourceNgram = alignmentObject.sourceNgram;
  var targetNgram = alignmentObject.targetNgram;

  // favor phrases over words
  var sourceNgramCount = tokenizer.tokenize(sourceNgram).length;
  var targetNgramCount = tokenizer.tokenize(targetNgram).length;
  // var boostSourceNgram = Math.pow(boostNgramCount, sourceNgramCount);
  // longerNgramScore = 1.1 - (targetNgramCount/10)
  if (targetNgramCount == 1) longerNgramScore = 0.8;
  if (targetNgramCount == 2) longerNgramScore = 1;
  if (targetNgramCount == 3) longerNgramScore = 0.7;
  if (targetNgramCount == 4) longerNgramScore = 0.6;

  // favor words/phrases that occur same number of times in source and target
  var sourceMatchCount = countInArray(sourceNgramArray, sourceNgram);
  var targetMatchCount = countInArray(targetNgramArray, targetNgram);
  var deltaCount = Math.abs(sourceMatchCount - targetMatchCount);
  occurrenceDeltaScore = 1/(deltaCount+1);

  // favor words/phrases that occur in the same place in the sentence
  var sourceLength = sourceString.length;
  var targetLength = targetString.length;
  var sourcePosition = sourceString.indexOf(sourceNgram);
  var targetPosition = targetString.indexOf(targetNgram);
  var sourceRatio = sourcePosition / sourceLength;
  var targetRatio = targetPosition / targetLength;
  var deltaRatio = Math.abs(sourceRatio - targetRatio);
  positionDeltaScore = (1 - deltaRatio);

  var ratio = alignmentObject.ratio;
  var sourceUniqueness = alignmentObject.sourceUniqueness;
  var weightSum = sum(weights) - weights.conflict;
  var score = (
    weights.tableRatios * ratio +
    weights.sourceUniqueness * sourceUniqueness +
    weights.longerNgrams * longerNgramScore +
    weights.occurrenceDelta * occurrenceDeltaScore +
    weights.positionDelta * positionDeltaScore
  ) / weightSum;
  alignmentObject.score = Math.round( score * 1000) / 1000;
  return alignmentObject;
}

// determine the combination of best alignmentObjects for highest combined score
var bestAlignments = function(sourceString, targetString, _alignmentData) {
  var alignment = []; // response
  var neededSource = tokenizer.tokenize(sourceString).join('  ');
  var available = _alignmentData.slice(0);
  available.sort(function(a,b) {
    return b.score - a.score;
  });

  do { // use all source words
    var best = bestAlignment(available);
    var regex = new RegExp("( |^)+?" + best.sourceNgram + "( |$)+?", 'g');
    if (best != undefined && neededSource.match(regex) != null) {
      available = penalizeConflictingAlignments(best, available);
      var bestPair = [best.sourceNgram, best.targetNgram, best.score]
      alignment.push(bestPair);
      neededSource = neededSource.split(regex).join(' ');
      console.log('bestPair', bestPair);
      console.log('neededSource', neededSource);
    }
  } while (available.length > 0 && tokenizer.tokenize(neededSource).length > 0);

  return alignment;
}

var isConflict = function(alignmentObjectA, alignmentObjectB) {
  var conflict = false; // response
  // var sourceWordsA = tokenizer.tokenize(alignmentObjectA.sourceNgram);
  // var sourceWordsB = tokenizer.tokenize(alignmentObjectB.sourceNgram);
  // sourceCommon = arrayIntersect(sourceWordsA, sourceWordsB);
  // if (sourceCommon.length > 0) { conflict = true; }
  var targetWordsA = tokenizer.tokenize(alignmentObjectA.targetNgram);
  var targetWordsB = tokenizer.tokenize(alignmentObjectB.targetNgram);
  targetCommon = arrayIntersect(targetWordsA, targetWordsB);
  if (targetCommon.length > 0) { conflict = true; }
  return conflict;
}

var penalizeConflictingAlignments = function(alignmentObject, available) {
  available.forEach(function(_alignmentObject, index) {
    var conflict = isConflict(alignmentObject, _alignmentObject)
    if (conflict) {
      available[index].conflict = true;
      var weightSum = sum(weights);
      newScore = alignmentObject.score * Math.pow(( (weightSum - weights.conflict)/weightSum ), 2);
      available[index].score = Math.round( newScore * 1000) / 1000
    }
  });
  return available;
}

// determine the best single alignmentObject
var bestAlignment = function(alignmentData) {
  var alignmentObject = alignmentData.shift();
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
