// tests/corpusFaker.js
var chai = require('chai')
var assert = chai.assert
var corpusFaker = require('./../tact/src/corpusFaker.js')
var tokenizer = require('./../tact/src/tokenizer.js')
var options = require('config').Client

describe('corpusFaker.random', function() {
  it('random should return a number between min and max.', function() {
    var min = 1;
    var max = 3;
    var random = corpusFaker.random(min, max);
    assert.isNumber(random);
    assert.isAtLeast(random, min);
    assert.isAtMost(random, max);
  });
});

describe('corpusFaker.character', function() {
  it('character should return a character that corresponds with its ordinal.', function() {
    assert.equal(corpusFaker.character(0), 'a');
    assert.equal(corpusFaker.character(25), 'z');
  });
});

describe('corpusFaker.randomCharacter', function() {
  it('randomCharacter should return a string with a length of one.', function() {
    assert.isString(corpusFaker.randomCharacter());
    assert.lengthOf(corpusFaker.randomCharacter(), 1);
  });
});

describe('corpusFaker.randomWord', function() {
  it('randomWord should return a string with a length less than number passed in.', function() {
    var word = corpusFaker.randomWord(5);
    assert.isString(word);
    assert.isAtLeast(word.length, 1);
    assert.isAtMost(word.length, 5);
  });
  it('randomWord should return a string with a length less than 5 if no number passed in.', function() {
    var word = corpusFaker.randomWord();
    assert.isString(word);
    assert.isAtLeast(word.length, 1);
    assert.isAtMost(word.length, 5);
  });
});

describe('corpusFaker.randomPhrase', function() {
  it('randomPhrase should return a string with the number of words less than number passed in.', function() {
    var string = corpusFaker.randomPhrase(3,3);
    assert.isString(string);
    var tokens = tokenizer.tokenize(string, options.global.tokenizer.source);
    assert.isAtLeast(tokens.length, 1);
    assert.isAtMost(tokens.length, 3);
  });
  it('randomPhrase should throw an error if no numbers are passed in.', function() {
    assert.throws(corpusFaker.randomPhrase, /Error/);
  });
});

describe('corpusFaker.lexiconEntry', function() {
  it('lexiconEntry should return an array with of a string and an array of strings.', function() {
    var response = corpusFaker.lexiconEntry(3);
    assert.isArray(response);
    assert.isString(response[0]);
    assert.isArray(response[1]);
    assert.isString(response[1][0]);
  });
  it('lexiconEntry should include max translations of what is passed in.', function() {
    var max = 3;
    var response = corpusFaker.lexiconEntry(max);
    assert.isAtMost(response[1].length, max);
  });
  it('lexiconEntry should throw an error if no numbers are passed in.', function() {
    assert.throws(corpusFaker.lexiconEntry, /Error/);
  });
});

describe('corpusFaker.lexicon', function() {
  it('lexicon should return an object with n items.', function() {
    var response = corpusFaker.lexicon(3);
    assert.isObject(response);
    var keys = Object.keys(response);
    var count = keys.length;
    assert.equal(count, 3);
  });
  it('lexiconEntry should throw an error if no numbers are passed in.', function() {
    assert.throws(corpusFaker.lexiconEntry, /Error/);
  });
});

describe('corpusFaker.lexiconSentencePair', function() {
  it('lexiconSentencePair should return an Array of strings.', function() {
    var entryCount = 5;
    var wordCount = 5;
    var lexicon = corpusFaker.lexicon(entryCount);
    var array = corpusFaker.lexiconSentencePair(wordCount, lexicon);
    assert.isArray(array);
    assert.isString(array[0]);
    assert.isString(array[1]);
  });
  it('lexiconSentencePair should throw an error if no numbers are passed in.', function() {
    assert.throws(corpusFaker.lexiconEntry, /Error/);
  });
});

describe('corpusFaker.lexiconCorpusGenerate', function() {
  it('lexiconCorpusGenerate should return an array of N arrays.', function() {
    var lexicon = corpusFaker.lexicon(5);
    var lineCount = 10;
    var corpus = corpusFaker.lexiconCorpusGenerate(lineCount, lexicon);
    assert.isArray(corpus);
    assert.equal(corpus.length, lineCount);
    var linePair = corpus[0];
    assert.isArray(linePair);
  });
});
