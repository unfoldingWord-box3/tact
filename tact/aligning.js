var WordAligner = require('./src/wordAligner.js')
var async = require('async')

function Aligning(options) {
  this.align = function(alignmentPairs, progress, callback) {
    console.log('aligning...')
    console.time('alignment')
    var count = alignmentPairs.length
    var completed = 0
    var _this = this
    async.mapLimit(alignmentPairs, options.align.concurrency, // cpu is currently pegged with just one
      function(alignmentPair, _callback) {
        var wordAligner = new WordAligner(options)
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
}

exports = module.exports = Aligning
