var natural = require('natural');
var XRegExp = require('xregexp');
var tools = require('./tools.js');
var config = require('./config.js');
var scoring = require('./scoring.js');
var nonUnicodeLetter = XRegExp('\\PL+');
// var nonUnicodeLetter = XRegExp('[^\\pL]+');
var tokenizer = new natural.RegexpTokenizer({pattern: nonUnicodeLetter});
var unicodePunctuation = XRegExp("\\s*\\p{P}+\\s*");
var segmenter = new natural.RegexpTokenizer({pattern: unicodePunctuation});
var ngrams = natural.NGrams;

var alignmentData = function(sourceString, targetString, table) {
  var _alignmentData = [];

  var sourceNgramArray = tools.ngram(sourceString, config.ngrams.sourceMax);
  var targetNgramArray = tools.ngram(targetString, config.ngrams.targetMax);

  sourceNgramArray.forEach(function(sourceNgram, index){
    var alignmentsPerSource = [];
    var total = 0; // rename to filtered
    var sourceNgramTotal = 0;
    if (table[sourceNgram] !== undefined) {
      tools.forObject(table[sourceNgram], function(targetNgram, times){
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
      alignmentObject = scoring.score(sourceString, targetString, sourceNgramArray, targetNgramArray, alignmentObject);
      _alignmentData.push(alignmentObject);
    });
  });
  // console.log(_alignmentData);
  return _alignmentData;
}

// determine the combination of best alignmentObjects for highest combined score
var bestAlignments = function(sourceString, targetString, _alignmentData) {
  var alignment = []; // response
  var neededSource = tokenizer.tokenize(sourceString).join('  ');
  var available = _alignmentData.slice(0);

  do { // use all source words
    available.sort(function(a,b) {
      return b.score - a.score;
    });
    var best = bestAlignment(available);
    var regex = new RegExp("( |^)+?" + best.sourceNgram + "( |$)+?", 'g');
    if (best != undefined && neededSource.match(regex) != null) {
      available = penalizeConflictingAlignments(best, available);
      var bestPair = [best.sourceNgram, best.targetNgram, best.score]
      alignment.push(bestPair);
      neededSource = neededSource.split(regex).join(' ');
      // console.log('bestPair', bestPair);
      // console.log('neededSource', neededSource);
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
  targetCommon = tools.arrayIntersect(targetWordsA, targetWordsB);
  if (targetCommon.length > 0) { conflict = true; }
  return conflict;
}

var penalizeConflictingAlignments = function(alignmentObject, available) {
  available.forEach(function(_alignmentObject, index) {
    var conflict = isConflict(alignmentObject, _alignmentObject)
    if (conflict) {
      available[index].conflict = true;
      var weightSum = tools.sum(config.weights);
      newScore = alignmentObject.score * Math.pow(( (weightSum - config.weights.conflict)/weightSum ), 2);
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

// this function could be optimized by passing in alignment as an object instead of array
// sourceTokens = [tokens...], alignment = [sourceNgram, targetNgram, score]
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
      if (queue.length == config.ngrams.sourceMax) {
        // since this one can't be found remove the first token and move on
        notfound.push(queue.shift());
        // put back remaining tokens to be queued in next loop
        while (queue.length > 0) {
          sourceTokens.unshift(queue.pop());
        }
      }
    }
  }
  // console.log("unorderedAlignment: ", unorderedAlignment); // console.log("SourceTokens: ", sourceTokens); // console.log("orderedAlignment: ", orderedAlignment); // console.log("queue: ", queue);
  if (notfound.length > 0) console.log("notfound: ", notfound);
  // console.log("found: ", found); // console.log("n: ", n);
  // Potentially re-align remaining tokens not already aligned
  return orderedAlignment;
}

var align = function(pairForAlignment, table) {
  var alignment = []; // response
  var sourceString = pairForAlignment[0];
  var targetString = pairForAlignment[1];

  var segmentQueue = [];

  var sourceSegments = segmenter.tokenize(sourceString);
  var targetSegments = segmenter.tokenize(targetString);
  if (sourceSegments.length == targetSegments.length) {
    sourceSegments.forEach(function(sourceSegment, _index){
      segmentQueue.push([sourceSegment, targetSegments[_index]]);
    });
  } else {
    segmentQueue.push([sourceString, targetString]);
  }

  segmentQueue.forEach(function(segmentPair, index) {
    var _sourceString = segmentPair[0];
    var _targetString = segmentPair[1];
    // align words/phrases found in userLexicon then keywordLexicon, then build statisticalLexicon from remaining ngrams.
    // var savedAlignmentData = alignmentData(sourceString, targetString, savedTable);
    // var lexiconAlignmentData = alignmentData(sourceString, targetString, lexiconTable);
    var statisticalAlignmentData = alignmentData(_sourceString, _targetString, table);
    // process of elimination
    _alignment = bestAlignments(_sourceString, _targetString, statisticalAlignmentData);
    // reorder alignments to match source order
    _alignment = alignmentBySourceTokens(tokenizer.tokenize(_sourceString), _alignment);
    _alignment.forEach(function(alignmentObject, index) {
      alignment.push(alignmentObject);
    });
  });

  return alignment;
};

exports.align = align;
