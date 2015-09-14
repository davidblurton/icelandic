import assert from 'assert'
import corrections from '../../controllers/corrections';
import {structure} from '../../grammar/parsed'

describe('Corrects subject verb agreement', async function() {
  it('should find the correct verb for a pronoun subject', async function() {
    let tokenized = ['hann', 'tala', 'íslensku']
    let parsedQuery = '{"Parsed Text":{"Sentence":{"{*SUBJ":{"[NP":{"WORDS":[{"hann":"fpken"}]}},"[VPi":{"WORDS":[{"tala":"sng"}]},"{*OBJ<":{"[NP":{"WORDS":[{"íslensku":"nveo"}]}}}}}'

    let expected = {
      rule: 'verb should match subject',
      index: 1,
      replacements: ['talar', 'talaði']
    }

    let parts = structure(parsedQuery)
    let result = await corrections.verb(tokenized, parts)

    assert.deepEqual(result, expected)
  })

  it('should find the correct verb when the verb comes first')
  it('should find the correct verb for a noun subject')
})
