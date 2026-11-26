import type { CellValue, ChartCounts, Column, ViewRow } from '~/data'

export type ChartType = 'bar' | 'line' | 'pie'

export interface SeriesData {
  label: string
  data: (number | null)[]
}

export interface ChartData {
  labels: string[]
  datasets: SeriesData[]
}

export const CHART_COLORS: string[] = [
  'rgba(54, 162, 235, 0.6)',
  'rgba(255, 99, 132, 0.6)',
  'rgba(75, 192, 192, 0.6)',
  'rgba(255, 206, 86, 0.6)',
  'rgba(153, 102, 255, 0.6)',
  'rgba(255, 159, 64, 0.6)',
]

export const EMPTY_VALUE_LABEL = '—'

// Y "column" that means "count the rows" instead of averaging a number column.
export const COUNT_COLUMN_KEY = ''

// The x column of a chart: the configured one when it still exists in the view,
// otherwise the first category column, otherwise the first column at all.
export function resolveXColumn(columns: Column[], xColumnKey: string): Column | null {
  let first: Column | null = null
  let firstCategory: Column | null = null
  for (const column of columns) {
    if (column.key === xColumnKey) {
      return column
    }
    if (first === null) {
      first = column
    }
    if (firstCategory === null && column.dataType === 'category') {
      firstCategory = column
    }
  }
  if (firstCategory !== null) {
    return firstCategory
  }
  return first
}

// The x column a new chart starts with: study status if the view has it, else the
// resolveXColumn fallback (first category column, else first column).
export function defaultXColumnKey(columns: Column[]): string {
  const column = resolveXColumn(columns, 'studyStatus')
  if (column === null) {
    return ''
  }
  return column.key
}

// The y column of a chart when it is a number column of the view; null means "count rows".
export function resolveYColumn(columns: Column[], yColumnKey: string): Column | null {
  if (yColumnKey === COUNT_COLUMN_KEY) {
    return null
  }
  for (const column of columns) {
    if (column.key === yColumnKey && column.dataType === 'number') {
      return column
    }
  }
  return null
}

// Builds the chart data: the x labels are the distinct values of the x column, and the
// single series is the row count per x value (Y = count) or the average of the y column
// per x value (null when an x value has no numeric values).
export function buildChartData(
  rows: ViewRow[] | null,
  columns: Column[],
  xColumnKey: string,
  yColumnKey: string,
): ChartData {
  const xColumn = resolveXColumn(columns, xColumnKey)
  if (xColumn === null || rows === null) {
    return { labels: [], datasets: [] }
  }
  const yColumn = resolveYColumn(columns, yColumnKey)

  const groups = new Map<string, ViewRow[]>()
  for (const row of rows) {
    const label = cellLabel(row.cells[xColumn.key])
    const group = groups.get(label)
    if (group === undefined) {
      groups.set(label, [row])
    } else {
      group.push(row)
    }
  }

  const labels: string[] = []
  for (const label of groups.keys()) {
    labels.push(label)
  }
  labels.sort(byNumericLabel)
  const emptyIndex = labels.indexOf(EMPTY_VALUE_LABEL)
  if (emptyIndex !== -1) {
    labels.splice(emptyIndex, 1)
    labels.push(EMPTY_VALUE_LABEL)
  }

  let seriesLabel = 'Participants'
  let measure: (group: ViewRow[]) => number | null = countGroup
  if (yColumn !== null) {
    seriesLabel = `${yColumn.label} (avg)`
    measure = makeAverageMeasure(yColumn.key)
  }

  const data: (number | null)[] = []
  for (const label of labels) {
    data.push(measure(groups.get(label) ?? []))
  }

  return { labels, datasets: [{ label: seriesLabel, data }] }
}

// Builds the chart data from the server's counts: one dataset per series (a band column
// has one series per selected year), with the buckets in the order the server sends them.
export function countsToChartData(counts: ChartCounts | null): ChartData {
  if (counts === null || counts.series.length === 0) {
    return { labels: [], datasets: [] }
  }
  const labels: string[] = []
  for (const bucket of counts.series[0].buckets) {
    labels.push(bucket.label)
  }
  const datasets: SeriesData[] = []
  for (const series of counts.series) {
    let label = 'Participants'
    if (series.year !== null) {
      label = `Participants (${series.year})`
    }
    const data: (number | null)[] = []
    for (const bucket of series.buckets) {
      data.push(bucket.count)
    }
    datasets.push({ label, data })
  }
  return { labels, datasets }
}

function countGroup(group: ViewRow[]): number {
  return group.length
}

function makeAverageMeasure(columnKey: string): (group: ViewRow[]) => number | null {
  return function averageMeasure(group: ViewRow[]): number | null {
    return averageGroup(group, columnKey)
  }
}

function averageGroup(group: ViewRow[], columnKey: string): number | null {
  let sum = 0
  let n = 0
  for (const row of group) {
    const cell = row.cells[columnKey]
    if (typeof cell === 'number') {
      sum += cell
      n += 1
    }
  }
  if (n === 0) {
    return null
  }
  return sum / n
}

function cellLabel(value: CellValue): string {
  if (value === null) {
    return EMPTY_VALUE_LABEL
  }
  return String(value)
}

function byNumericLabel(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true })
}
