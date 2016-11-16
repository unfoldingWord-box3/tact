#!/usr/bin/env node --max_old_space_size=4096
var tact = require('./tact.js');
var async = require('async');

var cli = require('cli');
var options = cli.parse({
  sourceCorpusFile: ['s', 'source corpus file to train', 'file', './corpus/source.txt'],
  targetCorpusFile: ['t', 'target corpus file to be aligned', 'file', './corpus/target.txt'],
  sourceCorrectionsFile: ['a', 'source corrections file to train', 'file', './corrections/source.txt'],
  targetCorrectionsFile: ['b', 'target corrections file to be aligned', 'file', './corrections/target.txt']
});


tact.corpus.parseFiles(options.sourceCorrectionsFile, options.targetCorrectionsFile, function(corrections) {
  console.time('correctionsTable');
  tact.correctionsTable.generate(corrections,
    function(percent) {
      cli.progress(percent);
    },
    function() {
      console.timeEnd('correctionsTable');
      console.time('phraseTable');
      tact.corpus.parseFiles(options.sourceCorpusFile, options.targetCorpusFile, function(corpus) {
        tact.phraseTable.generate(corpus,
          function(percent) {
            cli.progress(percent);
          },
          function() {
            console.timeEnd('phraseTable');
          }
        );
      });
    }
  );
});
