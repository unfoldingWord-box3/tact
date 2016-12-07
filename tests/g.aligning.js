// tests/aligner.js
var chai = require('chai')
var assert = chai.assert
var tact = require('./../tact/tact.js')

function reverse(s) {
  return s.split('').reverse().join('');
}

// corpus
var sources = [
  "hello", "hello george", "hello taco", "hello all", "say hello", "no hello", "say hello to all",
  "world", "the world", "world reign", "save the world", "world of worlds", "king of the world", "hello to the world",
  "taco", "taco tuesdays", "i like tacos", "tacos taste good", "why tacos"
];
var targets = [];
sources.forEach(function(string, index){ targets.push(reverse(string)); });
var corpus = [];
sources.forEach(function(string, index){ corpus.push([string, targets[index]]); });
// corrections
var sources = ["hello", "asdf"];
var targets = [];
sources.forEach(function(string, index){ targets.push(reverse(string)); });
var corrections = [];
sources.forEach(function(string, index){ corrections.push([string, targets[index]]); });

describe('aligning.align', function() {
  it('should populate the corpus and corrections tables', function(done) {
    function progress(){};
    tact.aligning.align(corpus, progress, function(alignments) {
      done();
    });
  });
});
