#!/usr/bin/env node --max_old_space_size=4096
var tact = require('./tact/tact.js')
var async = require('async')

var cli = require('cli')
var options = cli.parse({
  sourceCorpusFile: ['s', 'source corpus file to train', 'file', './corpus/source.txt'],
  targetCorpusFile: ['t', 'target corpus file to be aligned', 'file', './corpus/target.txt'],
  sourceCorrectionsFile: ['a', 'source corrections file to train', 'file', './corrections/source.txt'],
  targetCorrectionsFile: ['b', 'target corrections file to be aligned', 'file', './corrections/target.txt']
})

function progress(percent) {
  cli.progress(percent)
}

tact.corpus.parseFiles(options.sourceCorrectionsFile, options.targetCorrectionsFile, function(corrections) {
  // console.time('training-1')
  // console.time('correctionsTable-1')
  tact.corpus.parseFiles(options.sourceCorpusFile, options.targetCorpusFile, function(corpus) {
    // console.time('corpusTable-1')
    tact.training.train(corpus, corrections, progress, progress,
      function() {
        // console.timeEnd('correctionsTable-1')
      },
      function() {
        // console.timeEnd('corpusTable-1')
      },
      function() {
        // console.timeEnd('training-1')
        console.log('trained') // output here helps callback return and not hang.
      }
    )
  })
})
