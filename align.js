#!/usr/bin/env node
var tact = require('./tact/tact.js');

var cli = require('cli');
var options = cli.parse({
  sourceLanguage: ['x', 'source language name', 'string', ''],
  targetLanguage: ['y', 'target language name', 'string', ''],
  sourceFile: ['s', 'source file to be aligned', 'file', ''],
  targetFile: ['t', 'target file to be aligned', 'file', ''],
  first: ['f', 'first input line to use', 'int', 0],
  count: ['n', 'limit input to n lines', 'int', 20]
});

tact.config.global.sourceLanguage = options.sourceLanguage
tact.config.global.targetLanguage = options.targetLanguage

function progress(percent) {
  cli.progress(percent);
};

tact.corpus.parseFiles(options.sourceFile, options.targetFile, function(alignmentPairs) {
  alignmentPairs = alignmentPairs.slice(options.first,options.first+options.count);
  // console.time('alignment-1');
  tact.aligning.align(alignmentPairs, progress, function(alignments) {
    console.log(JSON.stringify(alignments, null, 2));
    // console.timeEnd('alignment-1');
  });
});
