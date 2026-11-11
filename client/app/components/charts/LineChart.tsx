import { useEffect, useRef } from 'react'
import type { ChartConfiguration, ChartData, ChartDataset } from 'chart.js'
import { CategoryScale, Chart, Legend, LineController, LineElement, LinearScale, PointElement, Title, Tooltip} from 'chart.js'
import type { SeriesData } from '~/components/charts/chartUtils'
import { CHART_COLORS } from '~/components/charts/chartUtils'

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Title)

type LineChartProps = { labels: string[]; datasets: SeriesData[]; title: string }

export default function LineChart({ labels, datasets, title }: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(effect, [labels, datasets, title])

  function effect(): (() => void) | undefined {
    const canvas = canvasRef.current
    if (canvas === null) {
      return undefined
    }
    const text = getComputedStyle(document.documentElement).getPropertyValue('--text-main').trim()

    // setup block, like the chart.js samples
    const data: ChartData<'line'> = { labels: labels, datasets: buildDatasets(datasets) }

    // config block
    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        color: text,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: title },
        },
        scales: {
          x: { ticks: { color: text } },
          y: { beginAtZero: true, ticks: { color: text } },
        },
      },
    }

    // render
    const chart = new Chart(canvas, config)
    return function cleanup() {
      chart.destroy()
    }
  }

  function buildDatasets(series: SeriesData[]): ChartDataset<'line'>[] {
    const result: ChartDataset<'line'>[] = []
    for (let i = 0; i < series.length; i += 1) {
      const color = CHART_COLORS[i % CHART_COLORS.length]
      result.push({
        label: series[i].label,
        data: series[i].data,
        borderColor: color,
        backgroundColor: color,
        borderWidth: 1,
      })
    }
    return result
  }

  return <canvas ref={canvasRef} aria-label={title} role="img" />
}
