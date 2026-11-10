import { useEffect, useRef } from 'react'
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

type BarChartProps = { labels: string[]; data: number[]; label: string }

export default function BarChart({ labels, data, label }: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const text = getComputedStyle(document.documentElement).getPropertyValue('--text-main').trim()
    const chart = new Chart(canvasRef.current, {
      type: 'bar',
      data: { labels, datasets: [{ label, data, backgroundColor: 'rgba(54, 162, 235, 0.6)' }] },
      options: {
        responsive: true,
        color: text,
        scales: { x: { ticks: { color: text } }, y: { beginAtZero: true, ticks: { color: text, precision: 0 } } },
      },
    })
    return () => chart.destroy()
  }, [labels, data, label])

  return <canvas ref={canvasRef} aria-label={label} role="img" />
}
