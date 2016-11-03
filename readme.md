## TACT: Translation Alignment Correction Tool
Javascript based nlp statistical word/phrase aligner.

## Status: Pre-Alpha
Due to the regularly evolving codebase, documentation is limited to high level concepts and workflow.

## Approach: Process of elimination
Generate permutations of all possible alignments. Score them based on weighted average of common patterns. Pick the best single option. Remove obvious results it can no longer be. Penalize conflicting remaining results. Pick the next best single result... repeat until all words are aligned. Reorder alignment to original source order.

## Learning: Correction and Appending
To prioritize the learning ability, correctional tables and phrase table appending are leveraged.

Correctional tables only store human verified word/phrase alignment. There are no permutations. These are scored and sorted with the rest of the possible alignment options but with a boost to ensure they are used before the statistical permutations.

Phrase table generation stops at statistical tallies of permutations. The trade off is more burden in the alignment step. This way the table can be appended to at any point and not result in any difference from complete retraining.

## More info:
### [A. Workflow/Overview](https://github.com/unfoldingWord-dev/tact/wiki/A.-Workflow-Overview)
### [B. Prerequisites](https://github.com/unfoldingWord-dev/tact/wiki/B.-Prerequisites)
### [C. Preprocessing](https://github.com/unfoldingWord-dev/tact/wiki/C.-Preprocessing-data)


### Scope
Create a tool for creating word/phrase level alignment information for each verse of the bible between any source/target language such as Greek/English, English/Hindi, Hindi/Punjabi then chain-able from Greek/Punjabi (stretch goal).

Expecting users to manually align each word/phrase for each verse would be overly daunting and tedious. Providing a statistical best guess to the alignment could help depending on the accuracy. Finding a way to "learn" from each manual alignment that is performed and saved allows the user to not have to keep performing the same alignment when it is commonly repeated.

### Primary goals
---
1. Statistically align words/phrases in Source/Target Language.
1. Allow users to manually correct the alignment and override the statistical output.
1. Dynamic workflow to aid in appending training data without typical problems associated.

### Secondary goals
1. Improved alignment accuracy by adding features to handle complexity of languages.
2. Improved performance by refactoring code.
3. Integrate existing alignment data from existing lexicons/dictionaries for increasing accuracy and/or testing output accuracy.

### Implementation
The intended implementation is to be run as a module inside of tC (translationCore). That project is an electron/node.js/react/flux stack that allows modules to be built that run node.js code and react user interfaces. For development and testing purposes, other interfaces will be built.

### User Interface
The correctional user interface should be easy to see how words are aligned in a clear manner as well as efficient to correct.

The aligner user interface will be a node.js module and potentially a CLI.

### Usage
Setup: `npm install`

Run Tests: `npm test`

Run Greek to English example: `npm run greek-english`
