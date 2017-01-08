// tests/aligner.js
var chai = require('chai')
var assert = chai.assert
var tact = require('./../tact/tact.js')
var options = require('config').Client

function reverse(s) {
  return s.split('').reverse().join('')
}

// corpus
var sources = [
  "hello", "hello george", "hello taco", "hello all", "say hello", "no hello", "say hello to all",
  "world", "the world", "world reign", "save the world", "world of worlds", "king of the world", "hello to the world",
  "taco", "taco tuesdays", "i like tacos", "tacos taste good", "why tacos"
]
var targets = []
sources.forEach(function(string, index){ targets.push(reverse(string)) })
var corpus = []
sources.forEach(function(string, index){ corpus.push([string, targets[index]]) })
// corrections
var sources = ["hello", "asdf"]
var targets = []
sources.forEach(function(string, index){ targets.push(reverse(string)) })
var corrections = []
sources.forEach(function(string, index){ corrections.push([string, targets[index]]) })

var training = new tact.Training(options, corpus, corrections)

describe('training.train', function() {
  it('should populate the corpus and corrections tables', function(done) {
    function progress() {}
    function corpusCallback() {}
    function correctionsCallback() {}
    function callback() {
      training.phraseTable.table.getCount(function(count) {
        assert.equal(count, 3)
        training.correctionsTable.table.getCount(function(count) {
          assert.equal(count, 3)
          done()
        })
      })
    }
    training.train(progress, progress, corpusCallback, correctionsCallback, callback)
  })
})
