var chai = require('chai')
var assert = chai.assert
var tools = require('./../tact/src/tools.js')

describe('closestWord', function() {
  it('closestWord() should return a word if it exists', function() {
    var array = ['a', 'Aaron', 'Abraham', 'all', 'angel', 'hello', 'world', 'zebra']
    var word = 'all'
    var closest = tools.closestWord(word, array)
    assert.equal(closest, word)
  })
  it('closestWord() should return a word case insensitive', function() {
    var array = ['a', 'Aaron', 'Abraham', 'all', 'angel', 'hello', 'world', 'zebra']
    var word = 'aaron'
    var closest = tools.closestWord(word, array)
    assert.equal(closest, 'Aaron')
  })
  it('closestWord() should return the next word if one does not exist of same starting letter', function() {
    var array = ['a', 'Aaron', 'Abraham', 'angel', 'hello', 'world', 'zebra']
    var word = 'all'
    var closest = tools.closestWord(word, array)
    assert.equal(closest, 'angel')
  })
  it('closestWord() should return the next word if one does not exist of different starting letter', function() {
    var array = ['a', 'Aaron', 'Abraham', 'angel', 'hello', 'world', 'zebra']
    var word = 'firetruck'
    var closest = tools.closestWord(word, array)
    assert.equal(closest, 'hello')
  })
})
