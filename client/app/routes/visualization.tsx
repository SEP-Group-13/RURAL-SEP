import { useRef, useState } from 'react'
import type { ReactElement } from 'react'
import Button from '~/components/Button/Button'
import ChartCard from '~/components/charts/ChartCard'
import type { ChartConfig } from '~/components/charts/ChartCard'
import { COUNT_COLUMN_KEY, defaultXColumnKey } from '~/components/charts/chartUtils'
import { useViewHandlerState, viewHandler } from '~/data'

// The visualization dashboard: a grid of charts, two per row. "Add chart" appends one
// on the active view; each chart card picks its view, its type (bar or line) and the
// columns of that view used for the X and Y values.
export default function VisualizationRoute() {
  useViewHandlerState(viewHandler)
  const [charts, setCharts] = useState<ChartConfig[]>([])
  const nextId = useRef(1)

  function addChart() {
    const view = viewHandler.getActiveView()
    const next: ChartConfig[] = []
    for (const chart of charts) {
      next.push(chart)
    }
    next.push({
      id: `chart-${nextId.current}`,
      viewId: view.getId(),
      type: 'bar',
      xValue: defaultXColumnKey(view.getColumns()),
      yValue: COUNT_COLUMN_KEY,
    })
    nextId.current += 1
    setCharts(next)
  }

  function updateChart(id: string, next: ChartConfig) {
    const updated: ChartConfig[] = []
    for (const chart of charts) {
      if (chart.id === id) {
        updated.push(next)
      } else {
        updated.push(chart)
      }
    }
    setCharts(updated)
  }

  function removeChart(id: string) {
    const remaining: ChartConfig[] = []
    for (const chart of charts) {
      if (chart.id !== id) {
        remaining.push(chart)
      }
    }
    setCharts(remaining)
  }

  const cards: ReactElement[] = []
  for (const chart of charts) {
    cards.push(<ChartCard key={chart.id} chart={chart} onChange={updateChart} onRemove={removeChart} />)
  }

  return (
    <div className="p-4 grid content-start gap-4">
      <div className="flex items-center gap-2">
        <Button onClick={addChart}>Add chart</Button>
        {charts.length === 0 && <p className="text-sm opacity-70">No charts yet — add one to get started.</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">{cards}</div>
    </div>
  )
}
