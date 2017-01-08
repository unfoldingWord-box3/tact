var tokenizer = require('./tokenizer.js')

var tools = {

  match: function(substring, string) {
    var regex = new RegExp('(^|\\s)('+substring+')(?=\\s|$)', 'g')
    // console.log(regex, string)
    var matches = []
    var m
    while ((m = regex.exec(string)) !== null) {
      // console.log(m)
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === regex.lastIndex) {
        regex.lastIndex++
      }
      // The result can be accessed through the `m`-variable.
      m.forEach(function(match, groupIndex) {
        if (groupIndex === 2) matches.push(match)
        // console.log(`Found match, group ${groupIndex}: ${match}`)
      });
    }
    return matches
  },

  closestWord: function(word, array) {
    array.sort()
    function isEqualToOrNext(element) {
      return element.toLowerCase() >= word.toLowerCase()
    }
    var _word = array.find(isEqualToOrNext)
    return _word
  },

  intersect: function(a, b) {
    a.sort()
    b.sort()
    var intersection = []
    var ai=0, bi=0
    while ( ai < a.length && bi < b.length ) {
       if      (a[ai] < b[bi] ){ ai++ }
       else if (a[ai] > b[bi] ){ bi++ }
       else { /* they're equal */
         intersection.push(a[ai])
         ai++
         bi++
       }
    }
    return intersection
  },

  getIndicesOf: function(phrase, string) {
    if (typeof phrase !== 'string') throw 'tools.getIndicesOf(phrase) phrase is not String: ' + phrase
    if (typeof string !== 'string') throw 'tools.getIndicesOf(string) string is not String: ' + string
    var phraseLength = phrase.length
    if (phraseLength == 0) return []
    var startIndex = 0, index, indices = []
    while ((index = tokenizer.tokenize(string).join(' ').indexOf(phrase, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + phraseLength;
    }
    return indices;
  },

  averageObjects: function(array) {
    if (array.length == 1) return array[0];
    var sums = {}, counts = {}, results = {}, keys;
    var keys = Object.keys(array[0])
    array.forEach(function(object) {
      keys.forEach(function(key) {
        if (!(key in sums)) {
          sums[key] = 0;
          counts[key] = 0;
        }
        sums[key] += object[key];
        counts[key]++;
      });
    });
    keys.forEach(function(key) {
      results[key] = sums[key] / counts[key];
    });
    return results;
  },

  unique: function(array) {
    var o = {}, i, l = array.length, r = [];
    for(i=0; i<l;i+=1) o[array[i]] = array[i];
    for(i in o) r.push(o[i]);
    return r;
  },

  sum: function(obj) {
    var sum = 0;
    for( var el in obj ) {
      if( obj.hasOwnProperty(el) ) sum += parseFloat(obj[el]);
    }
    return sum;
  },

  forObject: function(object, callback) {
    return Object.keys(object).map(function (key) {
      return callback(key, object[key]);
    });
  },

  countInArray: function(array, item) {
    var count = 0;
    for (var i = 0; i < array.length; i++) {
      if (array[i] === item) { count++; }
    }
    return count;
  }

}
module = module.exports = tools

if (typeof Object.merge !== 'function') {
  Object.merge = function (o1, o2) { // Function to merge all of the properties from one object into another
    for(var i in o2) { o1[i] = o2[i] }
    return o1
  };
}

if (typeof Array.find !== 'function') {
  Array.prototype.find = function(predicate) {
    for (var i = 0, value; i < this.length; i++) {
      value = this[i]
      if (predicate.call(this, value))
      return value
    }
    return undefined;
  }
}
