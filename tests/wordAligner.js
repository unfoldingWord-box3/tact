// tests/aligner.js
var chai = require('chai');
var assert = chai.assert;
var table = require('./../src/table.js');
var wordAligner = require('./../src/wordAligner.js');
var natural = require('natural');
var tokenizer = new natural.WordTokenizer();

function reverse(s) {
  return s.split('').reverse().join('');
}

var sources = [
  "hello", "hello george", "hello taco", "hello all", "say hello", "no hello", "say hello to all",
  "world", "the world", "world reign", "save the world", "world of worlds", "king of the world", "hello to the world",
  "taco", "taco tuesdays", "i like tacos", "tacos taste good", "why tacos"
];
var targets = [];
sources.forEach(function(string, index){ targets.push(reverse(string)); });
var corpus = [];
sources.forEach(function(string, index){ corpus.push([string, targets[index]]); });
var pairForAlignment = ["hello taco world", "dlrow ocat olleh"];

var statisticalTable = table.generate(corpus);

describe('wordAligner.tableGenerate', function() {
  it('tableGenerate should return an object of which values are objects and its values are numbers.', function() {
    assert.isObject(statisticalTable);
    var sourceWords = Object.keys(statisticalTable);
    var sourceWord = sourceWords[0];
    var sourceWordValue = statisticalTable[sourceWord];
    assert.isObject(sourceWordValue);
    var targetWords = Object.keys(sourceWordValue);
    var targetWord = targetWords[0];
    var targetWordValue = sourceWordValue[targetWord];
    assert.isNumber(targetWordValue);
  });
});

describe('wordAligner.align', function() {
  var alignmentData = wordAligner.align(pairForAlignment, statisticalTable);
  console.log(alignmentData);
  it('align should return an array for each source word', function(){
    var count = tokenizer.tokenize(pairForAlignment[0]).length;
    assert.equal(count, alignmentData.length);
  });
  it('align should return an object of which values are an array of string and number.', function() {
    var alignment = alignmentData[0];
    assert.isArray(alignment);
    var sourceNgram = alignment[0];
    assert.isString(sourceNgram);
    var targetNgram = alignment[1];
    assert.isString(targetNgram);
    var score = alignment[2];
    assert.isNumber(score);
  });
  it('align should have results of high confidence if supporting data is in corrections.', function() {
    var correctionCorpus = [
      ["hello","olleh"]
    ];
    var tableCorrections = table.generate(correctionCorpus, true);
    alignmentData = wordAligner.align(pairForAlignment, statisticalTable, tableCorrections);
    var alignment = alignmentData[0];
    assert.isArray(alignment);
    var sourceNgram = alignment[0];
    assert.isString(sourceNgram);
    var targetNgram = alignment[1];
    assert.isString(targetNgram);
    var score = alignment[2];
    assert.isAtLeast(score, 1.0);
  });
});
