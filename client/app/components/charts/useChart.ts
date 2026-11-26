import { useEffect, useRef } from 'react'
import type { ChartConfiguration, ChartTypeRegistry } from 'chart.js'
import { Chart } from 'chart.js'
import type { SeriesData } from '~/components/charts/chartUtils'

export interface ChartProps {
  labels: string[]
  datasets: SeriesData[]
  title: string
}

/** Builds a chart.js config from the chart's props and the theme's text color. */
export type ConfigBuilder<T extends keyof ChartTypeRegistry> = (chart: ChartProps, text: string) => ChartConfiguration<T>

/**
 * Draws a chart.js chart on the returned canvas ref, and redraws it when the props change.
 * `build` should be a stable (module-level) function, or the chart is redrawn on every render.
 */
export function useChart<T extends keyof ChartTypeRegistry>(build: ConfigBuilder<T>, { labels, datasets, title }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) {
      return undefined
    }
    const text = getComputedStyle(document.documentElement).getPropertyValue('--text-main').trim()
    const chart = new Chart(canvas, build({ labels, datasets, title }, text))
    return function cleanup() {
      chart.destroy()
    }
  }, [build, labels, datasets, title])

  return canvasRef
}

/** The options every chart shares: theme text color, legend on top and the title. */
export function baseOptions(text: string, title: string) {
  return {
    responsive: true,
    color: text,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: title },
    },
  }
}
