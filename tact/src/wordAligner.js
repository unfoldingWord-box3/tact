var config = require('../config.js')
var tools = require('./tools.js')
var scoring = require('./scoring.js')
var phraseTable = require('./phraseTable.js')
var correctionsTable = require('./correctionsTable.js')
var tokenizer = require('./tokenizer')

var wordAligner = {
  // determine the combination of best rows for highest combined score
  bestAlignments: function(sourceString, targetString, _alignmentData) {
    var alignment = [] // response
    var neededSource = tokenizer.tokenize(sourceString).join(' ')
    var neededTarget = tokenizer.tokenize(targetString).join(' ')
    var available = _alignmentData.slice(0)
    do { // use all source words
      available.sort(function(a,b) {
        return b.score - a.score
      })

      var best = this.bestAlignment(available)
      var regexSource = new RegExp("( |^)+?" + best.source + "( |$)+?", 'g')  // using g replaces all assumes all source occurences align to same target
      var regexTarget = new RegExp("( |^)+?" + best.target + "( |$)+?", 'g')
      if (best !== undefined && neededSource.match(regexSource) != null) {
        neededSource = neededSource.replace(regexSource, '  ')
        neededTarget = neededTarget.replace(regexTarget, '  ')
        available = this.penalizeUnneeded(best, available, neededSource, neededTarget)
        var bestPair = [best.source, best.target, best.score]
        alignment.push(bestPair)
      }
    } while (available.length > 0 && tokenizer.tokenize(neededSource).length > 0)
    return alignment
  },
  // instead of previous approach of conflicts, look to see what is needed
  isNeeded: function(row, neededSource, neededTarget) {
    var needed = true
    var regexSource = new RegExp("( |^)+?" + row.source + "( |$)+?", '')
    var regexTarget = new RegExp("( |^)+?" + row.target + "( |$)+?", '')
    if (neededSource.search(regexSource) == -1 ||
        neededTarget.search(regexTarget) == -1) {
          needed = false
        }
    return needed
  },
  // penalize remaining alignments so that they are less likely to be selected
  penalizeUnneeded: function(row, available, neededSource, neededTarget) {
    var _this = this
    if (config.align.features.penalties) {
      available.forEach(function(_row, index) {
        var needed = _this.isNeeded(_row, neededSource, neededTarget)
        if (!needed && !_row.correction) {
          available[index].conflict = true
          var newScore = row.score/config.align.penalties.conflict
          available[index].score = Math.round( newScore * 1000) / 1000
        }
      })
    }
    return available
  },
  // determine the best single row
  bestAlignment: function(alignmentData) {
    var row = alignmentData.shift()
    return row
  },
  // this function could be optimized by passing in alignment as an object instead of array
  // sourceTokens = [tokens...], alignment = [source, target, score]
  alignmentBySourceTokens: function(_sourceTokens, alignment) {
    var sourceTokens = _sourceTokens.slice(0)
    var orderedAlignment = [] // response
    // transform alignment into object to look up ngrams
    var unorderedAlignment = {}
    alignment.forEach(function(row, index) {
      if (unorderedAlignment[row[0]] === undefined || row[2] > unorderedAlignment[row[0]][2]) {
        unorderedAlignment[row[0]] = row
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
      for (n = config.global.ngram.source; n > 0; n--) {
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
  },

  alignments: function(sourceString, targetString, callback) {
    var _alignments = []
    phraseTable.prune(sourceString, targetString, function(_phraseTable) {
      correctionsTable.prune(sourceString, targetString, function(_correctionsTable) {
        _alignments = _correctionsTable.concat(_phraseTable)
        callback(_alignments)
      })
    })
  },

  // main alignment function that calls the other functions internally
  align: function(pairForAlignment, callback) {
    var alignment = [] // response
    var sourceString = pairForAlignment[0]
    var targetString = pairForAlignment[1]
    var _this = this
    this.alignments(sourceString, targetString, function(_alignments) {
      // process of elimination
      var _alignment = _this.bestAlignments(sourceString, targetString, _alignments)
      // reorder alignments to match source order
      _alignment = _this.alignmentBySourceTokens(tokenizer.tokenize(sourceString), _alignment)
      _alignment.forEach(function(row, index) {
        alignment.push(row)
      })
      callback(alignment)
    })
  }

}

exports = module.exports = wordAligner
