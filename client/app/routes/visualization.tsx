import { useMemo } from 'react'
import Button from '~/components/Button/Button'
import BarChart from '~/components/charts/BarChart'
import { chartHandler, getLatestData, useChartCounts, useViewHandlerState, viewHandler } from '~/data'

export default function VisualizationRoute() {
  useViewHandlerState(viewHandler)
  const view = viewHandler.getActiveView()
  const { state, retry } = useChartCounts(chartHandler, [view], 'studyStatus')
  const counts = getLatestData(state)

  // The server lists every status, also those with a count of 0.
  const buckets = counts?.series[0]?.buckets
  const labels = useMemo(() => buckets?.map((bucket) => bucket.label) ?? [], [buckets])
  const data = useMemo(() => buckets?.map((bucket) => bucket.count) ?? [], [buckets])

  if (state.status === 'error') {
    return (
      <div className="p-4 flex items-center gap-3">
        <p>Could not load the chart: {state.error}</p>
        <Button onClick={retry}>Retry</Button>
      </div>
    )
  }
  if (counts === null) return <p className="p-4">Loading…</p>

  return (
    <div className="p-4 max-w-3xl">
      <BarChart labels={labels} data={data} label={`Participants by status (${view.getName()})`} />
    </div>
  )
}
