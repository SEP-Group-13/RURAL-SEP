import { describe, expect, it, vi } from 'vitest'
import type { ApiConsumer } from '../api/ApiConsumer'
import { MappingError } from '../api/mappers/MappingError'
import { createDefaultViewSettings } from '../views/viewSettings'
import { ChartHandler } from './ChartHandler'

function fakeApi() {
  const queryChartCounts = vi.fn(async (..._args: Parameters<ApiConsumer['queryChartCounts']>) => ({
    series: [{ view: 1, year: null, buckets: [{ label: 'Active', count: 4 }] }],
  }))
  const queryChartHistogram = vi.fn(async (..._args: Parameters<ApiConsumer['queryChartHistogram']>) => ({
    series: [{ view: 0, bins: [{ lowerBound: 40, count: 2 }] }],
  }))
  const api = { queryChartCounts, queryChartHistogram } as unknown as ApiConsumer
  return { api, queryChartCounts, queryChartHistogram }
}

const viewA = createDefaultViewSettings('A')
const viewB = createDefaultViewSettings('B')

describe('ChartHandler', () => {
  it('sends counts for the views with the signal and maps series to view ids', async () => {
    const { api, queryChartCounts } = fakeApi()
    const signal = new AbortController().signal

    const result = await new ChartHandler(api).getCounts([viewA, viewB], 'studyStatus', { signal })

    const [body, options] = queryChartCounts.mock.calls[0]!
    expect(body.column).toBe('Study status')
    expect(body.views).toHaveLength(2)
    expect(options?.signal).toBe(signal)
    expect(result).toEqual({
      columnKey: 'studyStatus',
      series: [{ viewId: viewB.id, year: null, buckets: [{ label: 'Active', count: 4 }] }],
    })
  })

  it('sends a histogram request and maps it', async () => {
    const { api, queryChartHistogram } = fakeApi()

    const result = await new ChartHandler(api).getHistogram([viewA], 'age', 10)

    expect(queryChartHistogram.mock.calls[0]![0]).toMatchObject({ column: 'Age', binWidth: 10 })
    expect(result.series).toEqual([{ viewId: viewA.id, bins: [{ lowerBound: 40, count: 2 }] }])
  })

  it('sends nothing when the request cannot be built', async () => {
    const { api, queryChartCounts } = fakeApi()

    await expect(new ChartHandler(api).getCounts([viewA], 'age')).rejects.toBeInstanceOf(MappingError)
    expect(queryChartCounts).not.toHaveBeenCalled()
  })
})
