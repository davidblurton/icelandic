import _ from 'lodash'
import database from '../models/database'
import icenlp from '../models/icenlp'
import summary from './summary'
import {structure, wordFromPart, headwordFromPart} from '../grammar/parsed'
import getVerbFilters from '../filters/verbs'
import getPrepositionFilters from '../filters/prepositions'

function uniqueWords(words) {
  return _.uniq(words, w => w.binId)
}

// Find all words from the same headword.
async function related(word) {
  let words = await database.lookup(word)

  let ids = _.chain(words).pluck('binId').unique().value()
  let related = await* ids.map(database.lookup)

  return _.flatten(related)
}

async function verb(tokenized, parts) {
  let modifier = wordFromPart(parts.subject)
  let verb = wordFromPart(parts.verb)

  if(!parts.verb) {
    return
  }

  let results = await related(verb)

  let {grammarTag} = getVerbFilters(modifier)

  let corrected = _.mapValues(grammarTag, tag => results.filter(x => x.grammarTag === tag)[0])

  let replacements = Object.values(_.mapValues(corrected, x => x.wordForm))

  return {
    rule: 'verb should match subject',
    index: tokenized.indexOf(verb),
    replacements
  }
}

function getDirectedCase(results) {
  let caseTag = results.map(r => Object.keys(r))[0]

  let cases = {
    'NF': 'nominative',
    'ÞF': 'accusative',
    'ÞGF': 'dative',
    'EF': 'genitive',
  }

  return cases[caseTag]
}

async function preposition(tokenized, parts) {
  if (!parts.object) {
    return
  }

  let verb = wordFromPart(parts.verb)
  let object = wordFromPart(parts.object)

  let nouns = uniqueWords(await database.lookup(object))
  let results = await related(object)
  let filters = await getPrepositionFilters(verb, nouns)

  let res = filters.map(filter => {
    let {grammarTag} = filter
    return _.mapValues(grammarTag, tag => results.filter(x => x.binId === filter.binId && x.grammarTag === tag)[0])
  })

  let replacements = Object.values(res[0]).map(x => x.wordForm)

  return {
    rule: 'object should match verb',
    explanation: `${verb} directs the ${getDirectedCase(res)} case`,
    index: tokenized.indexOf(object),
    replacements
  }
}

async function getCorrections(query) {
  let parsedQuery = await icenlp(query)
  let {tokenized, parsed} = parsedQuery
  let parts = structure(parsed)

  let corrections = []

  if(parsed.includes('VPi')) {
    let verbReplacements = await verb(tokenized, parts)
    corrections.push(verbReplacements)
  }

  if (parts.object) {
    let prepositionReplacements = await preposition(tokenized, parts)
    corrections.push(prepositionReplacements)
  }



  corrections = corrections.filter(x => x)

  return {
    tokenized,
    // parsed,
    corrections,
  }
}

function applyCorrections({corrections, tokenized}) {
  let suggestions = [...tokenized]

  corrections.forEach(correction => {
    let replacement = correction.replacements[0]
    suggestions[correction.index] = replacement
  })

  return [suggestions.join(' ')]
}

async function sentence(query) {
  let corrections = await getCorrections(query)
  let suggestions = applyCorrections(corrections)

  return {
    ...corrections,
    suggestions
  }
}

export default {verb, sentence, preposition}
