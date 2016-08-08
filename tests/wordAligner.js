// tests/aligner.js
var chai = require('chai');
var assert = chai.assert;
var corpusFaker = require('./../src/corpusFaker.js');
var wordAligner = require('./../src/wordAligner.js');
var natural = require('natural');
var tokenizer = new natural.WordTokenizer();
var ngrams = natural.NGrams;

var lexicon = corpusFaker.lexicon(1);
var pairForAlignment = corpusFaker.lexiconSentencePair(1, lexicon);
var corpus = corpusFaker.lexiconCorpusGenerate(1, lexicon);
var table = wordAligner.tableGenerate(corpus);

describe('wordAligner.tableGenerate', function() {
  it('tableGenerate should return an object of which values are objects and its values are numbers.', function() {
    assert.isObject(table);
    var sourceWords = Object.keys(table);
    var sourceWord = sourceWords[0];
    var sourceWordValue = table[sourceWord];
    assert.isObject(sourceWordValue);
    var targetWords = Object.keys(sourceWordValue);
    var targetWord = targetWords[0];
    var targetWordValue = sourceWordValue[targetWord];
    assert.isNumber(targetWordValue);
  });
});

describe('wordAligner.align', function() {
  it('align should return an object of which values are an array of string and number.', function() {
    var alignmentData = wordAligner.align(pairForAlignment, table);
    var alignment = alignmentData[0];
    assert.isArray(alignment);
    var sourceNgram = alignment[0];
    assert.isString(sourceNgram);
    var targetNgram = alignment[1];
    assert.isString(targetNgram);
    var score = alignment[2];
    assert.isNumber(score);
  });
});
