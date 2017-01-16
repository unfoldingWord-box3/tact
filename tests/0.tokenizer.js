// tests/aligner.js
var chai = require('chai')
var assert = chai.assert
var tact = require('./../tact/tact.js')
var options = require('config').Client
var regexpTokenizer = options.global.tokenizer.source

describe('Tokenizer', function() {
  it('tokenize() should return empty array for empty string', function() {
    var tokens = tact.tokenizer.tokenize('', options.global.tokenizer.source)
    assert.equal(tokens.length, 0)
  })
  it('tokenize() should return empty array for " " string', function() {
    var tokens = tact.tokenizer.tokenize(' ', options.global.tokenizer.source)
    assert.equal(tokens.length, 0)
  })
  it('tokenize() should return ["asdf"] array for "asdf" string', function() {
    var string = 'asdf'
    var tokens = tact.tokenizer.tokenize(string, options.global.tokenizer.source)
    assert.equal(tokens.length, 1)
    assert.equal(tokens[0], 'asdf')
  })
  it('tokenize() should return ["asdf", "qwerty"] array for "asdf qwerty" string', function() {
    var string = 'asdf qwerty'
    var tokens = tact.tokenizer.tokenize(string, options.global.tokenizer.source)
    assert.equal(tokens.length, 2)
    assert.equal(tokens[0], 'asdf')
    assert.equal(tokens[1], 'qwerty')
  })
  it('tokenize() should return ["taco", "world"] array for "taco world" string', function() {
    var alignmentPair = ['taco world', 'ocat dlrow']
    var tokens = tact.tokenizer.tokenize(alignmentPair[0], options.global.tokenizer.source)
    assert.equal(tokens.length, 2)
    assert.equal(tokens[0], 'taco')
    assert.equal(tokens[1], 'world')
  })
})
