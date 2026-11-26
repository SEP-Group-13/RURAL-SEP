import { describe, expect, it } from 'vitest'
import { createDefaultColumns } from '../../columns/defaultColumns'
import type { Column } from '../../types/column'
import type { ViewQuery } from '../../types/view'
import {
  fromCountChartResponse,
  fromHistogramResponse,
  MAX_CHART_VIEWS,
  toCountChartRequest,
  toHistogramRequest,
} from './charts'
import { MappingError } from './MappingError'

function query(changes: Partial<ViewQuery> = {}): ViewQuery {
  return { columns: createDefaultColumns(), filters: [], sort: null, selectedYears: 'all', excludedIds: [], ...changes }
}

function formula(key: string, label: string, expression: string): Column {
  return {
    key,
    label,
    dataType: 'number',
    group: 'Burden formulas',
    visible: true,
    removable: true,
    source: { kind: 'formula', expression },
  }
}

describe('toCountChartRequest', () => {
  it('sends each view and the column name', () => {
    const women = query({ filters: [{ columnKey: 'sex', operator: 'in', value: ['Female'] }], selectedYears: [2025] })

    expect(toCountChartRequest([query(), women], 'studyStatus')).toEqual({
      column: 'Study status',
      views: [
        expect.objectContaining({ bands: expect.any(Array) }),
        expect.objectContaining({ years: [2025], filters: [{ column: 'Sex', values: ['Female'] }] }),
      ],
    })
  })

  it('names a band column after its source column', () => {
    expect(toCountChartRequest([query()], 'timeBand').column).toBe('Time burden (min) band')
  })

  it('rejects a column without a fixed set of values (URF 10.2)', () => {
    expect(() => toCountChartRequest([query()], 'age')).toThrow(MappingError)
    expect(() => toCountChartRequest([query()], 'age')).toThrow('"Age" has no fixed set of values')
    expect(() => toCountChartRequest([query()], 'participantId')).toThrow(MappingError)
  })

  it('matches views by column name, not by key', () => {
    const a = query({ columns: [...createDefaultColumns(), formula('formula1', 'Score', '[age] * 2')] })
    const sameName = query({ columns: [...createDefaultColumns(), formula('formula7', 'Score', '[age] * 3')] })
    const otherName = query({ columns: [...createDefaultColumns(), formula('formula1', 'Other', '[age]')] })

    expect(() => toHistogramRequest([a, sameName], 'formula1', 10)).not.toThrow()
    expect(() => toHistogramRequest([a, otherName], 'formula1', 10)).toThrow('"Score" is not a column in every selected view.')
  })

  it('checks the number of views', () => {
    expect(() => toCountChartRequest([], 'sex')).toThrow('Select at least one view.')
    const tooMany = Array.from({ length: MAX_CHART_VIEWS + 1 }, () => query())
    expect(() => toCountChartRequest(tooMany, 'sex')).toThrow(`At most ${MAX_CHART_VIEWS} views`)
  })

  it('passes on view mapping errors', () => {
    expect(() => toCountChartRequest([query({ selectedYears: [] })], 'sex')).toThrow('Select at least one year.')
  })
})

describe('toHistogramRequest', () => {
  it('sends the column name and bin width', () => {
    expect(toHistogramRequest([query()], 'age', 5)).toMatchObject({ column: 'Age', binWidth: 5 })
  })

  it('rejects a non-numeric column and an invalid bin width', () => {
    expect(() => toHistogramRequest([query()], 'sex', 5)).toThrow('"Sex" is not numeric')
    expect(() => toHistogramRequest([query()], 'age', 0)).toThrow('Enter a bin width larger than 0.')
    expect(() => toHistogramRequest([query()], 'age', Number.NaN)).toThrow(MappingError)
  })
})

describe('fromCountChartResponse', () => {
  it('maps view indexes to view ids and keeps the years', () => {
    const result = fromCountChartResponse(
      {
        series: [
          { view: 0, year: 2024, buckets: [{ label: 'Low', count: 3 }, { label: 'High', count: 0 }] },
          { view: 1, year: 2024, buckets: [{ label: 'Low', count: 1 }, { label: 'High', count: 2 }] },
        ],
      },
      ['view-a', 'view-b'],
      'timeBand',
    )

    expect(result).toEqual({
      columnKey: 'timeBand',
      series: [
        { viewId: 'view-a', year: 2024, buckets: [{ label: 'Low', count: 3 }, { label: 'High', count: 0 }] },
        { viewId: 'view-b', year: 2024, buckets: [{ label: 'Low', count: 1 }, { label: 'High', count: 2 }] },
      ],
    })
  })

  it('rejects a series for a view that was not requested', () => {
    expect(() => fromCountChartResponse({ series: [{ view: 2, year: null, buckets: [] }] }, ['a'], 'sex')).toThrow(
      MappingError,
    )
  })
})

describe('fromHistogramResponse', () => {
  it('maps view indexes to view ids', () => {
    const result = fromHistogramResponse(
      { series: [{ view: 0, bins: [{ lowerBound: 40, count: 2 }, { lowerBound: 50, count: 0 }] }] },
      ['view-a'],
      'age',
      10,
    )

    expect(result).toEqual({
      columnKey: 'age',
      binWidth: 10,
      series: [{ viewId: 'view-a', bins: [{ lowerBound: 40, count: 2 }, { lowerBound: 50, count: 0 }] }],
    })
  })
})
