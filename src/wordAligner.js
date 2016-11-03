var natural = require('natural');
var XRegExp = require('xregexp');
var tools = require('./tools.js');
var config = require('./config.js');
var scoring = require('./scoring.js');
var nonUnicodeLetter = XRegExp('\\PL+'); // var nonUnicodeLetter = XRegExp('[^\\pL]+');
var tokenizer = new natural.RegexpTokenizer({pattern: nonUnicodeLetter});
var unicodePunctuation = XRegExp("\\s*\\p{P}+\\s*");
var segmenter = new natural.RegexpTokenizer({pattern: unicodePunctuation});
var ngrams = natural.NGrams;

var alignmentData = function(sourceString, targetString, table, isCorrections) {
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
      sourceNgramTokens = tokenizer.tokenize(sourceNgram);
      alignmentObject.total = total;
      var ratio = alignmentObject.times / total;
      alignmentObject.ratio = ratio;
      alignmentObject.sourceUniqueness = (total/sourceNgramTotal)/(sourceNgramTokens.length*2);
      alignmentObject.conflict = false;
      alignmentObject.sourceUsed = false;
      alignmentObject.correction = isCorrections;
      alignmentObject = scoring.score(sourceString, targetString, sourceNgramArray, targetNgramArray, alignmentObject);
      _alignmentData.push(alignmentObject);
    });
  });
  return _alignmentData;
}
// determine the combination of best alignmentObjects for highest combined score
var bestAlignments = function(sourceString, targetString, _alignmentData) {
  var alignment = []; // response
  var neededSource = tokenizer.tokenize(sourceString).join(' ');
  var neededTarget = tokenizer.tokenize(targetString).join(' ');
  var available = _alignmentData.slice(0);
  do { // use all source words
    available.sort(function(a,b) {
      return b.score - a.score;
    });
    var best = bestAlignment(available);
    var regexSource = new RegExp("( |^)+?" + best.sourceNgram + "( |$)+?", '');
    var regexTarget = new RegExp("( |^)+?" + best.targetNgram + "( |$)+?", '');
    if (best !== undefined && neededSource.match(regexSource) != null) {
      neededSource = neededSource.replace(regexSource, '  ');
      neededTarget = neededTarget.replace(regexTarget, '  ');
      available = penalizeConflictingAlignments(best, available, neededSource, neededTarget);
      var bestPair = [best.sourceNgram, best.targetNgram, best.score]
      alignment.push(bestPair);
    }
  } while (available.length > 0 && tokenizer.tokenize(neededSource).length > 0);
  return alignment;
}
// instead of previous approach of conflicts, look to see what is needed
var isNeeded = function(alignmentObject, neededSource, neededTarget) {
  var needed = true;
  var regexSource = new RegExp("( |^)+?" + alignmentObject.sourceNgram + "( |$)+?", '');
  var regexTarget = new RegExp("( |^)+?" + alignmentObject.targetNgram + "( |$)+?", '');
  if (neededSource.search(regexSource) == -1 ||
      neededTarget.search(regexTarget) == -1) {
        needed = false;
      }
  return needed
}
// penalize remaining alignments so that they are less likely to be selected
var penalizeConflictingAlignments = function(alignmentObject, available, neededSource, neededTarget) {
  available.forEach(function(_alignmentObject, index) {
    var needed = isNeeded(_alignmentObject, neededSource, neededTarget);
    if (!needed && !_alignmentObject.correction) {
      available[index].conflict = true;
      newScore = alignmentObject.score/config.penalties.conflict;
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
    if (unorderedAlignment[alignmentObject[0]] === undefined) {
      unorderedAlignment[alignmentObject[0]] = alignmentObject;
    }
  });
  // build queue of tokens to look up
  var queue = [];
  var found;
  var notfound = [];
  while (sourceTokens.length > 0) {
    // Some tokens may be conjoined with next token if not found
    // Need to look for longer ngrams before shorter ones in case both are present
    var n;
    for (n = config.ngrams.sourceMax; n > 0; n--) {
      if (sourceTokens.length > 0) {
        queue.push(sourceTokens.shift());
      }
    }
    // Start with source string tokens and look up one by one
    while (queue.length > 0) {
      // Look up alignment from generated unordered alignment
      found = unorderedAlignment[queue.join(' ')];
      // see if queue is found and push to orderedAlignment array
      if (found !== undefined) {
        // Push each found alignment in order found to response array
        orderedAlignment.push(found);
        queue = [];
      } else {
        // since this ngram can't be found remove the last token and move on
        sourceTokens.unshift(queue.pop());
        // put back one token to be queued in next loop if none was found in this loop
        if (queue.length == 0) { // found == undefined and queue is 0, that means none found this queue
          notfound.push(sourceTokens.shift());
        }
      }
    }
  }
  if (notfound.length > 0) console.log("notfound: ", notfound);
  return orderedAlignment;
}
// main alignment function that calls the other functions internally
var align = function(pairForAlignment, corpusTable, correctionsTable) {
  var alignment = []; // response
  var sourceString = pairForAlignment[0];
  var targetString = pairForAlignment[1];
  var segmentQueue = [];
  var sourceSegments = segmenter.tokenize(sourceString);
  var targetSegments = segmenter.tokenize(targetString);
  if (config.segmentation.aligner && sourceSegments.length == targetSegments.length) {
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
    // var lexiconAlignmentData = alignmentData(sourceString, targetString, lexiconTable);
    var _alignmentData = alignmentData(_sourceString, _targetString, corpusTable, false);
    if (correctionsTable !== undefined) {
      var correctionsAlignmentData = alignmentData(_sourceString, _targetString, correctionsTable, true);
      _alignmentData = correctionsAlignmentData.concat(_alignmentData);
    }
    // process of elimination
    _alignment = bestAlignments(_sourceString, _targetString, _alignmentData);
    // reorder alignments to match source order
    _alignment = alignmentBySourceTokens(tokenizer.tokenize(_sourceString), _alignment);
    _alignment.forEach(function(alignmentObject, index) {
      alignment.push(alignmentObject);
    });
  });
  return alignment;
};
exports.align = align;
