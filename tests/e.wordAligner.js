// tests/aligner.js
var chai = require('chai');
var assert = chai.assert;
var phraseTable = require('./../src/phraseTable.js');
var correctionsTable = require('./../src/correctionsTable.js');
var wordAligner = require('./../src/wordAligner.js');
var natural = require('natural');
var tokenizer = new natural.WordTokenizer();

function reverse(s) {
  return s.split('').reverse().join('');
}

function check(done, f) {
  try { f(); done(); }
  catch(e) { done(e); }
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
// pair to align
var pairForAlignment = ["hello taco world", "dlrow ocat olleh"];

describe('wordAligner.align', function() {
  it('align should return an array for each source word', function(done) {
    phraseTable.generate(corpus, function() {
      correctionsTable.generate(corrections, function() {
        wordAligner.align(pairForAlignment, function(alignment) {
          var count = tokenizer.tokenize(pairForAlignment[0]).length;
          assert.equal(count, alignment.length);
          done();
        });
      });
    });
  });
  it('align should return an object of which values are an array of string and number.', function(done) {
    wordAligner.align(pairForAlignment, function(alignments) {
      var alignment = alignments[0];
      assert.isArray(alignment);
      var sourceNgram = alignment[0];
      assert.isString(sourceNgram);
      var targetNgram = alignment[1];
      assert.isString(targetNgram);
      var score = alignment[2];
      assert.isNumber(score);
      done();
    });
  });

  it('align should have results of high confidence if supporting data is in corrections.', function(done) {
    var correctionCorpus = [
      ["hello","olleh"]
    ];
    correctionsTable.generate(correctionCorpus, function() {
      wordAligner.align(pairForAlignment, function(alignment) {
        alignmentData = alignment;
        var alignment = alignmentData[0];
        assert.isArray(alignment);
        var sourceNgram = alignment[0];
        assert.isString(sourceNgram);
        var targetNgram = alignment[1];
        assert.isString(targetNgram);
        var score = alignment[2];
        assert.isAtLeast(score, 1.0);
        done();
      });
    });
  });

});
