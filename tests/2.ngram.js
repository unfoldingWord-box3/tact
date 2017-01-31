// tests/aligner.js
var chai = require('chai')
var assert = chai.assert
var tact = require('./../tact/tact.js')
var options = require('config').Client

var ngram = tact.ngram

describe('NGram', function() {
  it('should return empty array for empty string', function() {
    var ngrams = ngram.ngram('', 2)
    assert.equal(ngrams.length, 0)
  })
  it('should return empty array for " " string', function() {
    var ngrams = ngram.ngram(' ', 2)
    assert.equal(ngrams.length, 0)
  })
  it('should return ["asdf"] array for "asdf" string', function() {
    var string = 'asdf'
    var ngrams = ngram.ngram(string, 2)
    assert.equal(ngrams.length, 1)
    assert.equal(ngrams[0], 'asdf')
  })
  it('should return ["asdf", "qwerty", "asdf qwerty"] array for "asdf qwerty" string', function() {
    var string = 'asdf qwerty'
    var ngrams = ngram.ngram(string, 2)
    assert.equal(ngrams.length, 3)
    assert.equal(ngrams[0], 'asdf')
    assert.equal(ngrams[1], 'qwerty')
    assert.equal(ngrams[2], 'asdf qwerty')
  })
  it('should return ngram array of 6 for "taco world tuesdays" string with tri-gram', function() {
    var string = 'taco world tuesdays'
    var ngrams = ngram.ngram(string, 3)
    assert.equal(ngrams.length, 6)
    assert.equal(ngrams[0], 'taco')
    assert.equal(ngrams[5], 'taco world tuesdays')
  })
})
