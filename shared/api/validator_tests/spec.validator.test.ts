/* 
*   Tests for the spec validator, checks whether generated validators work as expected at runtime.
*/
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { schemas } from '@shared/api/spec.validator.js'
import spec from '@shared/api/generated/openapi.json' with { type: 'json' }

// Every schema in the spec gets a validator
test('builds a validator for every schema in the spec', () => {
  assert.deepEqual(Object.keys(schemas).sort(), Object.keys(spec.components.schemas).sort())
})

// A request that uses every part of a view, valid according to the spec
const fullRequest = {
  view: {
    years: [2022, 2023],
    filters: [
      { column: 'Sex', values: ['Female'] },
      { column: 'Age', min: 18, max: 65 },
    ],
    formulas: [{ name: 'Total burden', expression: '[Time burden (min)] / 360 + [Radiation burden (mSv)] / 10' }],
    simulations: [{ name: 'Travel time', value: 30 }],
    bands: [{ column: 'Radiation burden (mSv)', bands: [{ label: 'Low', upperBound: 3 }, { label: 'High' }] }],
    excludedParticipantIds: ['P0001'],
  },
  columns: ['Age', 'Total burden'],
  sort: { column: 'Age', direction: 'desc' },
  page: { page: 2, pageSize: 50 },
}
const minimalRequest = { view: {}, columns: ['Age'] }

// test cases: [description, schema name, input data, should it pass?]
const cases: [string, keyof typeof schemas, unknown, boolean][] = [
  // Sort
  ['valid sort', 'Sort', { column: 'Age', direction: 'asc' }, true],
  ['direction must be asc or desc', 'Sort', { column: 'Age', direction: 'up' }, false],
  ['direction is required', 'Sort', { column: 'Age' }, false],
  ['no unknown keys', 'Sort', { column: 'Age', direction: 'asc', nulls: 'first' }, false],

  // PageRequest
  ['empty page uses defaults', 'PageRequest', {}, true],
  ['page starts at 1', 'PageRequest', { page: 0 }, false],
  ['page must be an integer', 'PageRequest', { page: 1.5 }, false],
  ['pageSize 100 is the maximum', 'PageRequest', { pageSize: 100 }, true],
  ['pageSize above 100', 'PageRequest', { pageSize: 101 }, false],

  // RangeFilter: needs at least one of min/max (our patch in spec.validator.ts)
  ['needs min or max', 'RangeFilter', { column: 'Age' }, false],
  ['min alone is enough', 'RangeFilter', { column: 'Age', min: 18 }, true],
  ['max alone is enough', 'RangeFilter', { column: 'Age', max: 65 }, true],
  ['min and max together', 'RangeFilter', { column: 'Age', min: 18, max: 65 }, true],
  ['min must be a number', 'RangeFilter', { column: 'Age', min: '18' }, false],
  ['no unknown keys', 'RangeFilter', { column: 'Age', min: 18, values: ['Female'] }, false],

  // CategoricalFilter
  ['valid categorical filter', 'CategoricalFilter', { column: 'Sex', values: ['Female', 'Male'] }, true],
  ['values cannot be empty', 'CategoricalFilter', { column: 'Sex', values: [] }, false],
  ['values must be strings', 'CategoricalFilter', { column: 'Sex', values: [1] }, false],

  // Filter: exactly one of categorical or range
  ['categorical filter', 'Filter', { column: 'Sex', values: ['Female'] }, true],
  ['range filter', 'Filter', { column: 'Age', max: 65 }, true],
  ['not both at once', 'Filter', { column: 'Age', max: 65, values: ['Female'] }, false],
  ['empty filter', 'Filter', {}, false],

  // Formula and Simulation
  ['valid formula', 'Formula', { name: 'Double age', expression: '[Age] * 2' }, true],
  ['formula needs an expression', 'Formula', { name: 'Double age' }, false],
  ['simulation value must be a number', 'Simulation', { name: 'Travel time', value: '30' }, false],

  // BandSet
  ['example from the spec', 'BandSet', { column: 'Radiation burden (mSv)', bands: [{ label: 'Low', upperBound: 3 }, { label: 'Medium', upperBound: 10 }, { label: 'High' }] }, true],
  ['bands cannot be empty', 'BandSet', { column: 'Radiation burden (mSv)', bands: [] }, false],
  ['band label cannot be empty', 'BandSet', { column: 'Radiation burden (mSv)', bands: [{ label: '' }] }, false],

  // View
  ['empty view covers everything', 'View', {}, true],
  ['years cannot be empty', 'View', { years: [] }, false],
  ['years must be unique', 'View', { years: [2023, 2023] }, false],
  ['excluded ids must be unique', 'View', { excludedParticipantIds: ['P0001', 'P0001'] }, false],
  ['invalid filter inside a view', 'View', { filters: [{ column: 'Age' }] }, false],
  ['no unknown keys', 'View', { sort: 'Age' }, false],

  // QueryParticipantsRequest
  ['full request', 'QueryParticipantsRequest', fullRequest, true],
  ['minimal request', 'QueryParticipantsRequest', minimalRequest, true],
  ['columns cannot be empty', 'QueryParticipantsRequest', { ...minimalRequest, columns: [] }, false],
  ['view is required', 'QueryParticipantsRequest', { columns: ['Age'] }, false],
  ['invalid filter deep inside', 'QueryParticipantsRequest', { ...minimalRequest, view: { filters: [{ column: 'Age', min: 1, values: ['x'] }] } }, false],
  ['invalid pageSize deep inside', 'QueryParticipantsRequest', { ...minimalRequest, page: { pageSize: 500 } }, false],

  // CountChartRequest
  ['needs at least one view', 'CountChartRequest', { views: [], column: 'Sex' }, false],
  ['10 views is the maximum', 'CountChartRequest', { views: Array(10).fill({}), column: 'Sex' }, true],
  ['more than 10 views', 'CountChartRequest', { views: Array(11).fill({}), column: 'Sex' }, false],

  // HistogramRequest
  ['valid histogram', 'HistogramRequest', { views: [{}], column: 'Age', binWidth: 0.5 }, true],
  ['binWidth must be above 0', 'HistogramRequest', { views: [{}], column: 'Age', binWidth: 0 }, false],
  ['binWidth is required', 'HistogramRequest', { views: [{}], column: 'Age' }, false],
]

for (const [rule, name, input, accepted] of cases) {
  test(`${name}: ${rule}`, () => {
    assert.equal(schemas[name].safeParse(input).success, accepted)
  })
}