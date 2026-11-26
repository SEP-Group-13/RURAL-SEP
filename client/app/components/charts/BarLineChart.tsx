import type { ChartConfiguration, ChartDataset } from 'chart.js'
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import type { SeriesData } from '~/components/charts/chartUtils'
import { CHART_COLORS } from '~/components/charts/chartUtils'
import type { ChartProps, ConfigBuilder } from '~/components/charts/useChart'
import { baseOptions, useChart } from '~/components/charts/useChart'

Chart.register(BarController, BarElement, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Title)

/** The chart types drawn on an x/y plane: they share data, scales and options, only the marks differ. */
export type BarLineType = 'bar' | 'line'

// one stable builder per type, so useChart only redraws when the data changes
const BUILDERS: Record<BarLineType, ConfigBuilder<BarLineType>> = {
  bar: (chart, text) => buildConfig('bar', chart, text),
  line: (chart, text) => buildConfig('line', chart, text),
}

export default function BarLineChart({ type, ...chart }: ChartProps & { type: BarLineType }) {
  const canvasRef = useChart(BUILDERS[type], chart)
  return <canvas ref={canvasRef} aria-label={chart.title} role="img" />
}

function buildConfig(type: BarLineType, { labels, datasets, title }: ChartProps, text: string): ChartConfiguration<BarLineType> {
  return {
    type,
    data: { labels, datasets: buildDatasets(datasets) },
    options: {
      ...baseOptions(text, title),
      scales: {
        x: { ticks: { color: text } },
        y: { beginAtZero: true, ticks: { color: text } },
      },
    },
  }
}

function buildDatasets(series: SeriesData[]): ChartDataset<BarLineType>[] {
  return series.map((entry, i) => {
    const color = CHART_COLORS[i % CHART_COLORS.length]
    return { label: entry.label, data: entry.data, borderColor: color, backgroundColor: color, borderWidth: 1 }
  })
}
