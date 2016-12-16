var WordAligner = require('./src/wordAligner.js')
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
      var wordAligner = new WordAligner(that.options)
      wordAligner.align(alignmentPair, function(alignment) {
        completed++
        progress(completed/count)
        _callback(null, alignment)
      })
    },
    function(err, alignments) {
      // console.log(JSON.stringify(alignments, null, 2))
      console.timeEnd('alignment')
      callback(alignments)
    }
  )
}

exports = module.exports = Aligning
