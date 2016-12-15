var tools = require('./tools.js')
var scoring = require('./scoring.js')
var PhraseTable = require('./phraseTable.js')
var CorrectionsTable = require('./correctionsTable.js')
var tokenizer = require('./tokenizer')

function WordAligner(options) {
  this.phraseTable = new PhraseTable(options)
  this.correctionsTable = new CorrectionsTable(options)

  // main alignment function that calls the other functions internally
  this.align = function(alignmentPair, callback) {
    var _alignmentBySourceTokens = [] // response
    var sourceString = alignmentPair[0]
    var targetString = alignmentPair[1]
    if (sourceString == '' || targetString == '') {
      callback(_alignmentBySourceTokens)
    } else {
      this.alignments(alignmentPair, function(_alignments) {
        // process of elimination
        var _bestAlignments = bestAlignments(alignmentPair, _alignments)
        // reorder alignments to match source order
        _alignmentBySourceTokens = alignmentBySourceTokens(tokenizer.tokenize(sourceString), _bestAlignments)
        callback(_alignmentBySourceTokens)
      })
    }
  }

  // go get all alignments to later sort/filter to find best
  this.alignments = function(alignmentPair, callback) {
    var _alignments = []
    var _this = this
    this.phraseTable.prune(alignmentPair, function(_phraseTable) {
      _this.correctionsTable.prune(alignmentPair, function(_correctionsTable) {
        _alignments = _correctionsTable.concat(_phraseTable)
        callback(_alignments)
      })
    })
  }

  // determine the combination of best rows for highest combined score
  var bestAlignments = function(alignmentPair, _alignmentData) {
    var alignment = [] // response
    var neededSource = tokenizer.tokenize(alignmentPair[0]).join(' ')
    var neededTarget = tokenizer.tokenize(alignmentPair[1]).join(' ')
    var available = _alignmentData.slice(0)
    do { // use all source words
      bestAlignment(available, function(best, rest) {
        available = rest
        var regexSource = new RegExp("( |^)+?" + best.source + "( |$)+?", 'g')  // using g replaces all assumes all source occurences align to same target
        var regexTarget = new RegExp("( |^)+?" + best.target + "( |$)+?", 'g')
        if (best !== undefined && neededSource.match(regexSource) != null) {
          neededSource = neededSource.replace(regexSource, '  ')
          neededTarget = neededTarget.replace(regexTarget, '  ')
          available = penalizeUnneeded(available, neededSource, neededTarget)
          available = removeUnneededSources(available)
          var bestPair = [best.source, best.target, best.score]
          alignment.push(bestPair)
        }
      })
    } while (available.length > 0 && tokenizer.tokenize(neededSource).length > 0)
    return alignment
  }

  // determine the best single row
  var bestAlignment = function(alignments, callback) {
    alignments.sort(function(a,b) {
      return b.score - a.score
    })
    var alignment = alignments.shift()
    callback(alignment, alignments)
  }

  // penalize remaining alignments so that they are less likely to be selected
  var penalizeUnneeded = function(available, neededSource, neededTarget) {
    if (options.align.features.penalties) {
      available.forEach(function(alignment, index) {
        if (!alignment.correction) {
          var wasSourceNeeded = alignment.sourceNeeded
          var wasTargetNeeded = alignment.targetNeeded
          alignment = isNeeded(alignment, neededSource, neededTarget)
          if (wasTargetNeeded && !alignment.targetNeeded) { // only penalize it if it was needed before running isNeeded
            var newScore = alignment.score/options.align.penalties.divide - options.align.penalties.subtract
            alignment.score = Math.round( newScore * 1000) / 1000
            // if (Number.isNaN(_row.score)) console.log(_row)
          }
        }
      })
    }
    return available
  }
  this.penalizeUnneeded = penalizeUnneeded

  var removeUnneededSources = function(available) {
    for (var index = 0; index < available.length; index ++) {
      if (!available[index].sourceNeeded) {
        available.splice(index, 1)
        index --
      }
    }
    return available
  }
  this.removeUnneededSources = removeUnneededSources

  // instead of previous approach of conflicts, look to see what is needed
  var isNeeded = function(alignment, neededSource, neededTarget) {
    if (alignment.sourceNeeded) { // don't check again if it wasn't needed already
      var regexSource = new RegExp("( |^)+?" + alignment.source + "( |$)+?", '')
      if (neededSource.search(regexSource) == -1) {
        alignment.sourceNeeded = false
      }
    }
    if (alignment.targetNeeded && alignment.target !== ' ') { // don't check again if it wasn't needed already
      var regexTarget = new RegExp("( |^)+?" + alignment.target + "( |$)+?", '')
      if ((neededTarget.search(regexTarget) == -1)) {
        alignment.targetNeeded = false
      }
    }
    return alignment
  }
  this.isNeeded = isNeeded

  // this function could be optimized by passing in alignment as an object instead of array
  // sourceTokens = [tokens...], alignment = [source, target, score]
  var alignmentBySourceTokens = function(_sourceTokens, _alignments) {
    var sourceTokens = _sourceTokens.slice(0)
    var orderedAlignment = [] // response
    // transform alignment into object to look up ngrams
    var unorderedAlignment = {}
    _alignments.forEach(function(alignment, index) {
      if (unorderedAlignment[alignment[0]] === undefined || alignment[2] > unorderedAlignment[alignment[0]][2]) {
        unorderedAlignment[alignment[0]] = alignment
      }
    })
    // build queue of tokens to look up
    var queue = []
    var found
    var notfound = []
    while (sourceTokens.length > 0) {
      // Some tokens may be conjoined with next token if not found
      // Need to look for longer ngrams before shorter ones in case both are present
      var n
      for (n = options.global.ngram.source; n > 0; n--) {
        if (sourceTokens.length > 0) {
          queue.push(sourceTokens.shift())
        }
      }
      // Start with source string tokens and look up one by one
      while (queue.length > 0) {
        // Look up alignment from generated unordered alignment
        found = unorderedAlignment[queue.join(' ')]
        // see if queue is found and push to orderedAlignment array
        if (found !== undefined) {
          // check to see if first word has a higher confidence than the phrase.
          if ( queue.length > 1 ) {
            var firstWord = unorderedAlignment[queue.shift()]
            if (firstWord !== undefined && firstWord[2] > found[2]) {
              found = firstWord
              sourceTokens = queue.concat(sourceTokens)
            }
          }
          // Push each found alignment in order found to response array
          orderedAlignment.push(found)
          queue = []
        } else {
          // since this ngram can't be found remove the last token and move on
          sourceTokens.unshift(queue.pop())
          // put back one token to be queued in next loop if none was found in this loop
          if (queue.length == 0) { // found == undefined and queue is 0, that means none found this queue
            notfound.push(sourceTokens.shift())
          }
        }
      }
    }
    if (notfound.length > 0) console.log("notfound: ", notfound)
    return orderedAlignment
  }

}

exports = module.exports = WordAligner
