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

describe('aligning.align', function() {
  it('should return alignments', function(done) {
    function progress(){}
    tact.aligning.align(options, corpus, progress, function(alignments) {
      assert.isArray(alignments)
      assert.equal(alignments.length, corpus.length)
      var firstPairAlignment = alignments[0]
      assert.isArray(firstPairAlignment)
      var firstWordAlignment = firstPairAlignment[0]
      assert.isArray(firstWordAlignment)
      done()
    })
  })
})
