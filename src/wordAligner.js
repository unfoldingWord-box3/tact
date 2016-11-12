var natural = require('natural');
var XRegExp = require('xregexp');
var tools = require('./tools.js');
var config = require('./config.js');
var scoring = require('./scoring.js');
var phraseTable = require('./phraseTable.js');
var correctionsTable = require('./correctionsTable.js');
var nonUnicodeLetter = XRegExp('\\PL+'); // var nonUnicodeLetter = XRegExp('[^\\pL]+');
var tokenizer = new natural.RegexpTokenizer({pattern: nonUnicodeLetter});
var unicodePunctuation = XRegExp("\\s*\\p{P}+\\s*");
var segmenter = new natural.RegexpTokenizer({pattern: unicodePunctuation});
var ngrams = natural.NGrams;

var alignmentData = function(source, target, tableRows, correction) {
  tableRows.forEach(function(row) {
    row.conflict = false;
    row.sourceUsed = false;
    row.correction = correction;
    row = scoring.score(source, target, row);
  });
  return tableRows;
};
// determine the combination of best rows for highest combined score
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
    var regexSource = new RegExp("( |^)+?" + best.source + "( |$)+?", '');
    var regexTarget = new RegExp("( |^)+?" + best.target + "( |$)+?", '');
    if (best !== undefined && neededSource.match(regexSource) != null) {
      neededSource = neededSource.replace(regexSource, '  ');
      neededTarget = neededTarget.replace(regexTarget, '  ');
      available = penalizeConflictingAlignments(best, available, neededSource, neededTarget);
      var bestPair = [best.source, best.target, best.score]
      alignment.push(bestPair);
    }
  } while (available.length > 0 && tokenizer.tokenize(neededSource).length > 0);
  return alignment;
}
// instead of previous approach of conflicts, look to see what is needed
var isNeeded = function(row, neededSource, neededTarget) {
  var needed = true;
  var regexSource = new RegExp("( |^)+?" + row.source + "( |$)+?", '');
  var regexTarget = new RegExp("( |^)+?" + row.target + "( |$)+?", '');
  if (neededSource.search(regexSource) == -1 ||
      neededTarget.search(regexTarget) == -1) {
        needed = false;
      }
  return needed
}
// penalize remaining alignments so that they are less likely to be selected
var penalizeConflictingAlignments = function(row, available, neededSource, neededTarget) {
  available.forEach(function(_row, index) {
    var needed = isNeeded(_row, neededSource, neededTarget);
    if (!needed && !_row.correction) {
      available[index].conflict = true;
      newScore = row.score/config.penalties.conflict;
      available[index].score = Math.round( newScore * 1000) / 1000
    }
  });
  return available;
}
// determine the best single row
var bestAlignment = function(alignmentData) {
  var row = alignmentData.shift();
  return row;
}
// this function could be optimized by passing in alignment as an object instead of array
// sourceTokens = [tokens...], alignment = [source, target, score]
var alignmentBySourceTokens = function(_sourceTokens, alignment) {
  sourceTokens = _sourceTokens.slice(0);
  var orderedAlignment = []; // response
  // transform alignment into object to look up ngrams
  unorderedAlignment = {};
  alignment.forEach(function(row, index) {
    if (unorderedAlignment[row[0]] === undefined) {
      unorderedAlignment[row[0]] = row;
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
var align = function(pairForAlignment, callback) {
  var alignment = []; // response
  var sourceString = pairForAlignment[0];
  var targetString = pairForAlignment[1];
  var sourceSegments = segmenter.tokenize(sourceString);
  var targetSegments = segmenter.tokenize(targetString);
  var segmentQueue = [];
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
    phraseTable.prune(_sourceString, _targetString, function(_phraseTable) {
      correctionsTable.prune(_sourceString, _targetString, function(_correctionsTable) {
        var _alignmentData = alignmentData(_sourceString, _targetString, _phraseTable, false);
        var correctionsAlignmentData = alignmentData(_sourceString, _targetString, _correctionsTable, true);
        _alignmentData = correctionsAlignmentData.concat(_alignmentData);
        // process of elimination
        _alignment = bestAlignments(_sourceString, _targetString, _alignmentData);
        // reorder alignments to match source order
        _alignment = alignmentBySourceTokens(tokenizer.tokenize(_sourceString), _alignment);
        _alignment.forEach(function(row, index) {
          alignment.push(row);
        });
        callback(alignment);
      });
    });
  });
};
exports.align = align;
