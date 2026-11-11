import type { ChangeEvent, ReactElement } from 'react'
import { X } from 'lucide-react'
import BarChart from '~/components/charts/BarChart'
import type { ChartType } from '~/components/charts/chartUtils'
import { COUNT_COLUMN_KEY, buildChartData, resolveXColumn, resolveYColumn } from '~/components/charts/chartUtils'
import LineChart from '~/components/charts/LineChart'
import PieChart from '~/components/charts/PieChart'
import { getLatestData, useViewHandlerState, useViewRows, useViewSettings, viewHandler } from '~/data'
import type { View } from '~/data'

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

const CHART_COMPONENTS = { bar: BarChart, line: LineChart, pie: PieChart }

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
  const { state } = useViewRows(view)
  const rows = getLatestData(state)
  const chartData = buildChartData(rows, columns, chart.xValue, chart.yValue)

  const xValue = resolveXColumn(columns, chart.xValue)
  let xSelectValue = chart.xValue
  if (xValue !== null) {
    xSelectValue = xValue.key
  }
  const yValue = resolveYColumn(columns, chart.yValue)
  let ySelectValue = COUNT_COLUMN_KEY
  if (yValue !== null) {
    ySelectValue = yValue.key
  }

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
  for (const column of columns) {
    xItems.push({ value: column.key, label: column.label })
  }
  // same as xItems, but only accepts columns with numbers and changes... well.. the y value of the chart
  const yItems: { value: string; label: string }[] = [{ value: COUNT_COLUMN_KEY, label: 'Count of rows' }]
  for (const column of columns) {
    if (column.dataType === 'number') {
      yItems.push({ value: column.key, label: column.label })
    }
  }

  let title = 'Chart'
  if (xValue !== null && chartData.datasets.length > 0) {
    title = `${chartData.datasets[0].label} by ${xValue.label} — ${view.getName()}`
  }

  function renderChart(): ReactElement {
    const ChartComponent = CHART_COMPONENTS[chart.type]
    return <ChartComponent labels={chartData.labels} datasets={chartData.datasets} title={title} />
  }
  
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
      {state.status === 'error' && <p className="text-sm text-red-500">Could not load participants: {state.error}</p>}
      {rows !== null && chartData.labels.length > 0 && renderChart()}
    </section>
  )
}
