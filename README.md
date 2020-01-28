# Appellatwix - A Name Generator

A little web app that uses a combination of Merriam-Webster thesaurus API and Datamuse to generate a list of synonyms for 2-3 words, and then does some magic to make combinations of those words.

In script.js under settings.server_side_blending will change where the permutations are run. True runs them on the server, false runs them in the browser. Both options have their ups/downs.

TODO:
- Some issues with doing more than a certain number of permutations. Doing >~ 1,000,000 freezes up. Need to break this up into chunks instead.
- Prolly add some resizing to the boxes at some point.