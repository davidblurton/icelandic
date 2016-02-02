import _ from 'lodash'
import {parse} from '../grammar/parser'
import lookup from '../translate/translate.json'

function sort(result) {
  return _.sortBy(result.forms, x => {
    let caseRank = {
      NF: 1,
      ÞF: 2,
      ÞGF: 3,
      EF: 4,
    }

    let personRank = {
      '1P-ET': 1,
      '2P-ET': 2,
      '3P-ET': 3,
      '1P-FT': 4,
      '2P-FT': 5,
      '3P-FT': 6,
    }

    let numberRank = {
      'ET': 1,
      'FT': 2,
    }

    return caseRank[x.tags && x.tags.grammarCase] ||
        personRank[Object.keys(personRank).filter(person => x.grammarTag.includes(person))[0]] ||
        numberRank[x.tags && x.tags.number]
  })
}

function translateTags(tags, language) {
  return _.mapValues(tags, tag => lookup[language].grammarTag[tag] || tag)
}

function translateWordClass(wordClass, language) {
  return lookup[language].wordClass[wordClass]
}

function translate(result, lang) {
  result.forms.forEach(form => {
    form.tags = lang ? translateTags(form.tags, lang) : form.tags
  })

  result.wordClass = lang ? translateWordClass(result.wordClass, lang) : result.wordClass
  return result
}

function tag(result) {
  result.forms.forEach(form => {
    try {
      form.tags = parse(result.wordClass, form.grammarTag)
    } catch (e) {
      console.log(e)
      form.tags = {}
    }
  })

  result.forms = sort(result)
  return result
}

function formatResults(forms) {
  let first = forms[0]

  let {headWord, binId, wordClass, section} = first

  return {
    headWord,
    binId,
    wordClass,
    section,
    forms: forms.map(({form, grammarTag}) => ({form, grammarTag})),
  }
}

export default function(results, lang) {
  let resultsById = _.groupBy(results, 'binId')
  let uniqueHeadWords = _.values(resultsById)
  let formattedResults = uniqueHeadWords.map(formatResults)
  return formattedResults
      .map(result => tag(result))
      .map(result => translate(result, lang))
}

