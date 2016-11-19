#!/usr/bin/env node
var tact = require('./tact.js');
var async = require('async');

var align = function(alignmentPairs, progress, callback) {
  console.log('aligning...')
  console.time('alignment');
  var count = alignmentPairs.length;
  var completed = 0;
  // due to sqlite single being threaded, while sql is using i/o, we can work on another.
  async.mapLimit(alignmentPairs, 2, // increasing more than 2 slows it down. 2 is 1/20 faster
    function(alignmentPair, _callback) {
      tact.wordAligner.align(alignmentPair, function(alignment) {
        completed ++;
        progress(completed/count);
        _callback(null, alignment);
      });
    },
    function(err, alignments) {
      // console.log(JSON.stringify(alignments, null, 2));
      console.timeEnd('alignment');
      callback(alignments);
    }
  );
};
exports.align = align;
