TACT (Translation Alignment Correction Tool)
===

Scope
---
Tool for creating word/phrase level alignment information for each verse of the bible between any source/target language such as Greek/English, English/Hindi, Hindi/Punjabi then chain-able from Greek/Punjabi (stretch goal).

Expecting users to manually align each word/phrase for each verse would be overly daunting and tedious. Providing a statistical best guess to the alignment could help depending on the accuracy. Finding a way to "learn" from each manual alignment that is performed and saved allows the user to not have to keep performing the same alignment when it is commonly repeated.

User Interface
---
The user interface should be easy to see how words are aligned in a clear manner as well as efficient to correct.

Project has two primary goals
---
1. Statistically align words/phrases in Source/Target Language.
2. Allow Users to manually correct the alignment and override the statistical output.

Secondary goals include
---
1. Improve alignment accuracy by adding complexity of languages.
2. Improve performance by refactoring code.
3. Integrate existing alignment data from existing lexicons/dictionaries for increasing accuracy and/or testing output accuracy.

Implementation
---
The intended implementation is to be run as a module inside of tC (translationCore). That project is an electron/node.js/react/flux stack that allows modules to be built that run node.js code and react user interfaces.

 node.js based statistical aligner.
