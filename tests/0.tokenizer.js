// tests/aligner.js
var chai = require('chai')
var assert = chai.assert
var tact = require('./../tact/tact.js')
var options = require('config').Client

var tokenizer = new tact.Tokenizer(options)

describe('Tokenizer', function() {
  it('tokenize() should return empty array for empty string', function() {
    var tokens = tokenizer.tokenize('', options.global.tokenizer.source)
    assert.equal(tokens.length, 0)
  })
  it('tokenize() should return empty array for " " string', function() {
    var tokens = tokenizer.tokenize(' ', options.global.tokenizer.source)
    assert.equal(tokens.length, 0)
  })
  it('tokenize() should return ["asdf"] array for "asdf" string', function() {
    var string = 'asdf'
    var tokens = tokenizer.tokenize(string, options.global.tokenizer.source)
    assert.equal(tokens.length, 1)
    assert.equal(tokens[0], 'asdf')
  })
  it('tokenize() should return ["asdf", "qwerty"] array for "asdf qwerty" string', function() {
    var string = 'asdf qwerty'
    var tokens = tokenizer.tokenize(string, options.global.tokenizer.source)
    assert.equal(tokens.length, 2)
    assert.equal(tokens[0], 'asdf')
    assert.equal(tokens[1], 'qwerty')
  })
  it('tokenizeSource() should return ["asdf", "qwerty"] array for "asdf qwerty" string', function() {
    var string = 'asdf qwerty'
    var tokens = tokenizer.tokenizeSource(string)
    assert.equal(tokens.length, 2)
    assert.equal(tokens[0], 'asdf')
    assert.equal(tokens[1], 'qwerty')
  })
  it('tokenize() should return ["taco", "world"] array for "taco world" string', function() {
    var alignmentPair = ['taco world', 'ocat dlrow']
    var tokens = tokenizer.tokenize(alignmentPair[0], options.global.tokenizer.source)
    assert.equal(tokens.length, 2)
    assert.equal(tokens[0], 'taco')
    assert.equal(tokens[1], 'world')
  })
  it('tokenizeTarget() should return ["taco", "world"] array for "taco world" string', function() {
    var alignmentPair = ['taco world', 'ocat dlrow']
    var tokens = tokenizer.tokenizeTarget(alignmentPair[0])
    assert.equal(tokens.length, 2)
    assert.equal(tokens[0], 'taco')
    assert.equal(tokens[1], 'world')
  })
})
