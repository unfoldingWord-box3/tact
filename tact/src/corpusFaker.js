
var corpusFaker = {
  n: 3,

  random: function(min, max) {
    return Math.floor(Math.random() * max) + min;
  },

  character: function(number) {
    return 'abcdefghijklmnopqrstuvwxyz'[number];
  },

  randomCharacter: function() {
    return this.character(this.random(0,25));
  },

  randomWord: function(maxLength) {
    var maxLength = typeof maxLength !== 'undefined' ?  maxLength : 5;
    var word = [];
    var length = this.random(1, maxLength);
    var i;
    for (i=0; i < length; i++) {
      word.push(this.randomCharacter());
    }
    return word.join('');
  },

  randomPhrase: function(maxWords, maxWordLength) {
    if (typeof maxWords === 'undefined') throw "Error: Must pass in maxWords.";
    if (typeof maxWordLength === 'undefined') throw "Error: Must pass in maxWordLength.";
    var phrase = [];
    var length = this.random(1, maxWords);
    var i;
    for (i=0; i < length; i++) {
      var word = this.randomWord(maxWordLength);
      phrase.push(word);
    }
    return phrase.join(' ');
  },

  lexiconEntry: function(maxTranslations) {
    if (typeof maxTranslations === 'undefined') throw "Error: Must pass in maxTranslations."
    var word = this.randomPhrase(this.n,7);
    var translations = [];
    translationCount = this.random(1,maxTranslations);
    var i;
    for (i=0; i < translationCount; i++) {
      translations.push(this.randomPhrase(this.n,7));
    }
    return [word,translations];
  },

  lexicon: function(entryCount) {
    if (typeof entryCount === 'undefined') throw "Error: Must pass in entryCount."
    var _lexicon = {};
    var i;
    for (i=0; i < entryCount; i++) {
      var entry = this.lexiconEntry(3);
      _lexicon[entry[0]] = entry[1];
    }
    return _lexicon;
  },

  lexiconSentencePair: function(maxPhrases, _lexicon) {
    if (typeof maxPhrases === 'undefined') throw "Error: Must pass in maxPhrases."
    if (typeof _lexicon !== 'object') throw "Error: Must pass in lexicon."
    var sourceArray = [];
    var targetArray = [];
    var times = this.random(1,maxPhrases);
    var i;
    for(var i=0; i < times; i++) {
      var sourcePhrases = Object.keys(_lexicon);
      var randomSourcePhrase = sourcePhrases[ Math.floor( Math.random()*sourcePhrases.length ) ];
      var targetTranslations = _lexicon[randomSourcePhrase];
      var randomTargetTranslation = targetTranslations[ Math.floor( Math.random()*targetTranslations.length ) ];
      sourceArray.push(randomSourcePhrase);
      targetArray.push(randomTargetTranslation);
      targetArray.sort();
    }
    sourceArray.push('.');
    targetArray.push('.');
    return [sourceArray.join(' '), targetArray.join(' ')];
  },

  lexiconCorpusGenerate: function(length, _lexicon) {
    var lines = [];
    var i;
    for(var i=0; i < length; i++) {
      var line = this.lexiconSentencePair(5, _lexicon);
      lines.push(line);
    }
    return lines;
  }

}

exports = module.exports = corpusFaker;
