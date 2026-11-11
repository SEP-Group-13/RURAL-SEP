import { useEffect, useRef } from 'react'
import type { ChartConfiguration, ChartData } from 'chart.js'
import { ArcElement, Chart, Legend, PieController, Title, Tooltip } from 'chart.js'
import type { SeriesData } from '~/components/charts/chartUtils'
import { CHART_COLORS } from '~/components/charts/chartUtils'

Chart.register(PieController, ArcElement, Tooltip, Legend, Title)

type PieChartProps = { labels: string[]; datasets: SeriesData[]; title: string }

export default function PieChart({ labels, datasets, title }: PieChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(effect, [labels, datasets, title])

  function effect(): (() => void) | undefined {
    const canvas = canvasRef.current
    if (canvas === null) {
      return undefined
    }
    const text = getComputedStyle(document.documentElement).getPropertyValue('--text-main').trim()

    // setup block, like the chart.js pie sample: one dataset, one color per slice
    // (Number(null) is 0, so empty X groups become zero slices)
    const series = datasets[0]
    const sliceColors: string[] = []
    const values: number[] = []
    for (let i = 0; i < labels.length; i += 1) {
      sliceColors.push(CHART_COLORS[i % CHART_COLORS.length])
      values.push(Number(series.data[i]))
    }
    const data: ChartData<'pie'> = {
      labels: labels,
      datasets: [{ label: series.label, data: values, backgroundColor: sliceColors }],
    }

    // config block, like the chart.js pie sample: a pie has no scales
    const config: ChartConfiguration<'pie'> = {
      type: 'pie',
      data: data,
      options: {
        responsive: true,
        color: text,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: title },
        },
      },
    }

    // render
    const chart = new Chart(canvas, config)
    return function cleanup() {
      chart.destroy()
    }
  }

  return (
    <div className="mx-auto w-full max-w-100">
      <canvas ref={canvasRef} aria-label={title} role="img" />
    </div>
  )
}
