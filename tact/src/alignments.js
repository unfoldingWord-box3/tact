var tokenizer = require('./tokenizer')
var PhraseTable = require('./phraseTable.js')
var CorrectionsTable = require('./correctionsTable.js')

function Alignments(options, alignmentPair, sourcePhrase) {
  if (options.constructor !== Object) throw 'Alignments() options is not Object: ' + options
  if (alignmentPair.constructor !== Array) throw 'Alignments() alignmentPair is not Array: ' + alignmentPair
  if (typeof alignmentPair[0] !== 'string') throw 'Alignments() source is not String: ' + alignmentPair[0]
  if (typeof alignmentPair[1] !== 'string') throw 'Alignments() target is not String: ' + alignmentPair[1]
  if (sourcePhrase !== undefined && typeof sourcePhrase !== 'string') throw 'Alignments() sourcePhrase is not String: ' + sourcePhrase
  this.options = options

  if (typeof sourcePhrase === 'string') {
    this.alignmentPair = [sourcePhrase, alignmentPair[1]]
  } else {
    this.alignmentPair = alignmentPair
  }
  this.alignmentSource = alignmentPair[0]
  this.alignmentTarget = alignmentPair[1]
  this.alignmentSourceTokens = tokenizer.tokenize(this.alignmentSource)
  this.alignmentTargetTokens = tokenizer.tokenize(this.alignmentTarget)

  this.phraseTable = new PhraseTable(this.options)
  this.correctionsTable = new CorrectionsTable(this.options)

  this.alignments = []
  this.available = []
  this.bestAlignments = []
  this.orderedAlignment = []
}
// chain the callbacks for getting alignment
Alignments.prototype.align = function(callback) {
  var that = this
  if (this.alignmentSourceTokens.length === 0 || this.alignmentTargetTokens.length === 0) {
    callback(that.orderedAlignment)
  } else {
    this.getAlignments(function() {
      that.selectBestAlignments()
      that.orderBySourceToken()
      callback(that.orderedAlignment)
    })
  }
}

// get the alignments from phraseTable and correctionsTable
Alignments.prototype.getAlignments = function(callback) {
  var that = this
  this.phraseTable.prune(this.alignmentPair, function(_phraseTable) {
    that.correctionsTable.prune(that.alignmentPair, function(_correctionsTable) {
      var alignments = _correctionsTable.concat(_phraseTable)
      that.alignments = alignments
      that.available = alignments
      callback()
    })
  })
}
// determine the combination of best rows for highest combined score
Alignments.prototype.selectBestAlignments = function() {
  var neededSource = this.alignmentSourceTokens.join(' ')
  var neededTarget = this.alignmentTargetTokens.join(' ')
  // use all source words, until you run out of words or alignments
  var that = this
  while (that.available.length > 0 && tokenizer.tokenize(neededSource).length > 0) {
    var best = that.bestAlignment()
    var regexSource = new RegExp("( |^)+?" + best.source + "( |$)+?", 'g')  // using g replaces all assumes all source occurences align to same target
    var regexTarget = new RegExp("( |^)+?" + best.target + "( |$)+?", 'g')
    that.bestAlignments.push(best)
    if (best !== undefined && neededSource.match(regexSource) != null) {
      neededSource = neededSource.replace(regexSource, '  ')
      neededTarget = neededTarget.replace(regexTarget, '  ')
      that.penalizeUnneededTargets(neededSource, neededTarget)
      that.removeUnneededSources()
    }
  }
}
// get the best alignment and remove from available
Alignments.prototype.bestAlignment = function(){
  var that = this
  that.available.sort(function(a,b) {
    return b.confidence - a.confidence
  })
  var bestAlignment = that.available.shift()
  return bestAlignment
}
// penalize remaining alignments so that they are less likely to be selected
Alignments.prototype.penalizeUnneededTargets = function(neededSource, neededTarget){
  var that = this
  if (that.options.align.features.penalties) {
    that.available.forEach(function(alignment, index) {
      if (!alignment.isCorrection) {
        var wasSourceNeeded = alignment.sourceNeeded
        var wasTargetNeeded = alignment.targetNeeded
        alignment.isNeeded(neededSource, neededTarget)
        if (wasTargetNeeded && !alignment.targetNeeded) { // only penalize it if it was needed before running isNeeded
          var newScore = alignment.confidence/that.options.align.penalties.divide - that.options.align.penalties.subtract
          alignment.confidence = Math.round( newScore * 1000) / 1000
          // if (Number.isNaN(_row.score)) console.log(_row)
        }
      }
    })
  }
}
// remove all alignments that source is already used
Alignments.prototype.removeUnneededSources = function(){
  var that = this
  for (var index = 0; index < this.available.length; index ++) {
    if (!that.available[index].sourceNeeded) {
      that.available.splice(index, 1)
      index --
    }
  }
}
// loop through best alignments and put them in order of source
Alignments.prototype.orderBySourceToken = function() {
  var sourceTokens = this.alignmentSourceTokens
  // transform alignment into object to look up ngrams
  var that = this
  var unorderedAlignment = {}
  that.bestAlignments.forEach(function(alignment, index) {
    if (unorderedAlignment[alignment.source] === undefined || alignment.confidence > unorderedAlignment[alignment.source].confidence) {
      unorderedAlignment[alignment.source] = alignment
    }
  })
  // build queue of tokens to look up
  var queue = []
  var found
  var notfound = []
  var that = this
  while (sourceTokens.length > 0) {
    // Some tokens may be conjoined with next token if not found
    // Need to look for longer ngrams before shorter ones in case both are present
    var n
    for (n = that.options.global.ngram.source; n > 0; n--) {
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
        that.orderedAlignment.push(found)
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
}

exports = module.exports = Alignments
