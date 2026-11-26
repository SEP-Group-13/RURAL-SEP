import type { ChartConfiguration } from 'chart.js'
import { ArcElement, Chart, Legend, PieController, Title, Tooltip } from 'chart.js'
import { CHART_COLORS } from '~/components/charts/chartUtils'
import type { ChartProps } from '~/components/charts/useChart'
import { baseOptions, useChart } from '~/components/charts/useChart'

Chart.register(PieController, ArcElement, Tooltip, Legend, Title)

export default function PieChart(props: ChartProps) {
  const canvasRef = useChart(buildConfig, props)
  return (
    <div className="mx-auto w-full max-w-100">
      <canvas ref={canvasRef} aria-label={props.title} role="img" />
    </div>
  )
}

// like the chart.js pie sample: one dataset, one color per slice, and no scales
// (Number(null) is 0, so empty X groups become zero slices)
function buildConfig({ labels, datasets, title }: ChartProps, text: string): ChartConfiguration<'pie'> {
  const series = datasets[0]
  const sliceColors: string[] = []
  const values: number[] = []
  for (let i = 0; i < labels.length; i += 1) {
    sliceColors.push(CHART_COLORS[i % CHART_COLORS.length])
    values.push(Number(series.data[i]))
  }
  return {
    type: 'pie',
    data: { labels, datasets: [{ label: series.label, data: values, backgroundColor: sliceColors }] },
    options: baseOptions(text, title),
  }
}
