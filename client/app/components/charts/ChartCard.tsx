import type { ChangeEvent, ReactElement } from 'react'
import { X } from 'lucide-react'
import BarLineChart from '~/components/charts/BarLineChart'
import type { ChartData, ChartType } from '~/components/charts/chartUtils'
import { COUNT_COLUMN_KEY, countsToChartData, resolveXColumn } from '~/components/charts/chartUtils'
import PieChart from '~/components/charts/PieChart'
import { chartHandler, getLatestData, useChartCounts, useViewHandlerState, useViewSettings, viewHandler } from '~/data'
import type { Column, View } from '~/data'

// i think this would be the proper interface for a 2D plane chart, different one might need to be used later on
export interface ChartConfig {
  id: string
  viewId: string
  type: ChartType
  xValue: string
  yValue: string
}

const CHART_TYPES: { value: string; label: string }[] = [
  { value: 'bar', label: 'Bar' },
  { value: 'line', label: 'Line' },
  { value: 'pie', label: 'Pie' },
]

// a dropdown of items, you select a value, the dropdown has a label and a name (look downwards when using)
function Select({ name, label, value, items, onChange }: {
  name: string
  label: string
  value: string
  items: { value: string; label: string }[]
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void
}) {
  const options: ReactElement[] = []
  for (const item of items) {
    // building the array
    options.push(<option key={item.value} value={item.value}>{item.label}</option>)
  }

  // this all ends with rendering the dropdown list
  return (
    <label className="flex items-center gap-2">
      {label}
      <select name={name} value={value} onChange={onChange} className="bg-sidebar-surface px-2 py-1" aria-label={label}>
        {options}
      </select>
    </label>
  )
}

// renders one chart card, uses chart.id for its parrent to know which chart in the array was changed or removed
export default function ChartCard({ chart, onChange, onRemove }: {
  chart: ChartConfig
  onChange: (id: string, next: ChartConfig) => void
  onRemove: (id: string) => void
}) {
  const { views, activeViewId } = useViewHandlerState(viewHandler)

  let view: View = viewHandler.getActiveView()
  let viewId = activeViewId
  for (const v of views) {
    if (v.getId() === chart.viewId) {
      view = v
      viewId = v.getId()
      break
    }
  }

  const columns = useViewSettings(view).columns
  // The server counts participants per value, which only works for category (and band) columns.
  const categoryColumns: typeof columns = []
  for (const column of columns) {
    if (column.dataType === 'category') {
      categoryColumns.push(column)
    }
  }

  const xValue = resolveXColumn(categoryColumns, chart.xValue)
  let xSelectValue = chart.xValue
  if (xValue !== null) {
    xSelectValue = xValue.key
  }
  // The API only returns counts for now, so Y is always "Count of rows".
  const ySelectValue = COUNT_COLUMN_KEY

  const { state } = useChartCounts(chartHandler, [view], xValue?.key ?? '')
  const counts = getLatestData(state)
  const chartData = countsToChartData(counts)

  // the onChange handler for select
  function handleSelect(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value
    if (event.target.name === 'type') {
      let type: ChartType = 'bar'
      if (value === 'line') {
        type = 'line'
      }
      if (value === 'pie') {
        type = 'pie'
      }
      onChange(chart.id, { ...chart, type })
      return
    }
    onChange(chart.id, { ...chart, [event.target.name]: value })
  }

  // the onRemove handler for... well... removing the chart.
  function handleRemove() {
    onRemove(chart.id)
  }

  // an entry per views
  const viewItems: { value: string; label: string }[] = []
  for (const v of views) {
    viewItems.push({ value: v.getId(), label: v.getName() })
  }
  // an entry per column
  const xItems: { value: string; label: string }[] = []
  for (const column of categoryColumns) {
    xItems.push({ value: column.key, label: column.label })
  }
  // TODO(spec): averages of a number column per X value need an API endpoint; until then only counts.
  const yItems: { value: string; label: string }[] = [{ value: COUNT_COLUMN_KEY, label: 'Count of rows' }]

  // actual rendering of the chart card (section, dropdowns, status messages, chart)
  return (
    <section className="grid content-start gap-2 bg-dashboard-surface p-3">
      <div className="flex items-center gap-2">
        <Select name="viewId" label="View" value={viewId} items={viewItems} onChange={handleSelect} />
        <Select name="type" label="Chart type" value={chart.type} items={CHART_TYPES} onChange={handleSelect} />
        <button type="button" onClick={handleRemove} title="Remove chart" className="ml-auto cursor-pointer">
          <X className="size-[1em]" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <Select name="xValue" label="X value" value={xSelectValue} items={xItems} onChange={handleSelect} />
        <Select name="yValue" label="Y value" value={ySelectValue} items={yItems} onChange={handleSelect} />
      </div>
      {xValue === null && <p className="text-sm opacity-70">This view has no category column to chart.</p>}
      {xValue !== null && state.status === 'error' && <p className="text-sm text-red-500">Could not load the chart: {state.error}</p>}
      {counts !== null && chartData.labels.length > 0 && (
        <ChartView type={chart.type} data={chartData} title={chartTitle(chartData, xValue, view)} />
      )}
    </section>
  )
}

// the selected chart type, drawn with the card's data
function ChartView({ type, data, title }: { type: ChartType; data: ChartData; title: string }) {
  if (type === 'pie') {
    return <PieChart labels={data.labels} datasets={data.datasets} title={title} />
  }
  return <BarLineChart type={type} labels={data.labels} datasets={data.datasets} title={title} />
}

function chartTitle(data: ChartData, xValue: Column | null, view: View): string {
  if (xValue === null || data.datasets.length === 0) {
    return 'Chart'
  }
  return `${data.datasets[0].label} by ${xValue.label} — ${view.getName()}`
}
