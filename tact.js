var corpusFaker = require('./src/corpusFaker.js');
var wordAligner = require('./src/wordAligner.js');

console.time('corpus');
var lexicon = corpusFaker.lexicon(3000);
// console.log("\n\n\tLexicon:\n\n", lexicon);
var pairForAlignment = corpusFaker.lexiconSentencePair(5, lexicon);
// console.log("\n\n\tpairForAlignment:\n\n", pairForAlignment);
var corpus = corpusFaker.lexiconCorpusGenerate(10000, lexicon);
// console.log("\n\n\tCorpus:\n\n", corpus);
corpus.push(pairForAlignment);
console.timeEnd('corpus');

console.time('table');
var table = wordAligner.tableGenerate(corpus);
// console.log("\n\n\tTable:\n\n", table);
console.timeEnd('table');

console.time('alignment');
var alignment = wordAligner.align(pairForAlignment, table);
console.log("\n\n\tpairForAlignment:\n\n", pairForAlignment);
console.log("\n\n\tAlignment:\n\n", alignment);
console.timeEnd('alignment');
