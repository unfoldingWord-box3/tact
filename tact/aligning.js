var wordAligner = require('./src/wordAligner.js')
var async = require('async')

var align = function(options, alignmentPairs, progress, callback) {
  console.log('aligning...')
  console.time('alignment')
  var count = alignmentPairs.length
  var completed = 0
  async.mapLimit(alignmentPairs, 1, // cpu is currently pegged with just one
    function(alignmentPair, _callback) {
      wordAligner.align(options, alignmentPair, function(alignment) {
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
exports.align = align
