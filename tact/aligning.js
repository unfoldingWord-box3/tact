var Alignments = require('./src/alignments.js')
var async = require('async')

function Aligning(options) {
  this.options = options
}

Aligning.prototype.align = function(alignmentPairs, progress, callback) {
  console.log('aligning...')
  console.time('alignment')
  var count = alignmentPairs.length
  var completed = 0
  var that = this
  async.mapLimit(alignmentPairs, that.options.align.concurrency, // cpu is currently pegged with just one
    function(alignmentPair, _callback) {
      var alignments = new Alignments(that.options, alignmentPair)
      alignments.align(function(orderedAlignment) {
        completed++
        progress(completed/count)
        _callback(null, orderedAlignment)
      })
    },
    function(err, orderedAlignment) {
      // console.log(JSON.stringify(alignments, null, 2))
      console.timeEnd('alignment')
      callback(orderedAlignment)
    }
  )
}

exports = module.exports = Aligning
