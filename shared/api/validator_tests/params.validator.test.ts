import { test } from 'node:test'
import assert from 'node:assert/strict'
import { params } from '@shared/api/params.validator.js'
import spec from '@shared/api/generated/openapi.json' with { type: 'json' }

// Every endpoint in the spec gets validators
test('builds validators for every endpoint in the spec', () => {
  const operationIds = Object.values(spec.paths).flatMap(item =>
    Object.entries(item).filter(([method]) => method !== 'parameters').map(([, op]) => op.operationId),
  )
  assert.deepEqual(Object.keys(params).sort(), operationIds.sort())
})

// URL values arrive as text, the validator turns them into numbers and fills in defaults
test('searchParticipants: limit "50" becomes the number 50', () => {
  assert.deepEqual(params.searchParticipants.query.parse({ query: 'P00', limit: '50' }), { query: 'P00', limit: 50 })
})
test('searchParticipants: limit defaults to 25', () => {
  assert.deepEqual(params.searchParticipants.query.parse({ query: 'P00' }), { query: 'P00', limit: 25 })
})

// [what is checked, endpoint, path or query, input, should it be accepted]
const cases: [string, keyof typeof params, 'path' | 'query', unknown, boolean][] = [
  // searchParticipants: ?query=...&limit=...
  ['query alone', 'searchParticipants', 'query', { query: 'P00' }, true],
  ['query and limit', 'searchParticipants', 'query', { query: 'P00', limit: '50' }, true],
  ['query is required', 'searchParticipants', 'query', {}, false],
  ['query cannot be empty', 'searchParticipants', 'query', { query: '' }, false],
  ['limit 250 is the maximum', 'searchParticipants', 'query', { query: 'P00', limit: '250' }, true],
  ['limit above 250', 'searchParticipants', 'query', { query: 'P00', limit: '251' }, false],
  ['limit starts at 1', 'searchParticipants', 'query', { query: 'P00', limit: '0' }, false],
  ['limit must be a number', 'searchParticipants', 'query', { query: 'P00', limit: 'abc' }, false],
  ['limit must be an integer', 'searchParticipants', 'query', { query: 'P00', limit: '2.5' }, false],
  ['limit sent twice', 'searchParticipants', 'query', { query: 'P00', limit: ['1', '2'] }, false],
  ['no unknown parameters', 'searchParticipants', 'query', { query: 'P00', x: '1' }, false],
  ['no path parameters', 'searchParticipants', 'path', { participantId: 'P0001' }, false],

  // getParticipant (and /burden, /activities): /participants/{participantId}
  ['participantId in the path', 'getParticipant', 'path', { participantId: 'P0001' }, true],
  ['participantId is required', 'getParticipant', 'path', {}, false],
  ['no query parameters', 'getParticipant', 'query', { x: '1' }, false],
  ['participantId in the path', 'getParticipantBurden', 'path', { participantId: 'P0001' }, true],
  ['participantId in the path', 'listParticipantActivities', 'path', { participantId: 'P0001' }, true],

  // Endpoints without URL parameters
  ['nothing in the URL', 'getMeta', 'query', {}, true],
  ['no query parameters', 'getMeta', 'query', { x: '1' }, false],
  ['no query parameters', 'queryParticipants', 'query', { page: '2' }, false],
]

for (const [rule, endpoint, location, input, accepted] of cases) {
  test(`${endpoint} ${location}: ${rule}`, () => {
    assert.equal(params[endpoint][location].safeParse(input).success, accepted)
  })
}
