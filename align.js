#!/usr/bin/env node
var tact = require('./tact.js');
var async = require('async');

var cli = require('cli');
var options = cli.parse({
  sourceFile: ['s', 'source file to be aligned', 'file', ''],
  targetFile: ['t', 'target file to be aligned', 'file', ''],
  first: ['f', 'first input line to use', 'int', 0],
  count: ['n', 'limit input to n lines', 'int', 20]
});

tact.corpus.parseFiles(options.sourceFile, options.targetFile, function(alignmentPairs) {
  alignmentPairs = alignmentPairs.slice(options.first,options.count);
  console.time('alignment');
  // due to sqlite single being threaded, while sql is using i/o, we can work on another.
  var count = alignmentPairs.length;
  var completed = 0;
  async.mapLimit(alignmentPairs, 2, // increasing more than 2 slows it down. 2 is 1/20 faster
    function(alignmentPair, callback) {
      tact.wordAligner.align(alignmentPair, function(alignments) {
        completed ++;
        cli.progress(completed/count);
        callback(null, alignments);
      });
    },
    function(err, allAlignments) {
      console.timeEnd('alignment');
      console.log(JSON.stringify(allAlignments, null, 2));
    }
  );
});
