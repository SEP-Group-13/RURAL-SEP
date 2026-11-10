import { useMemo } from 'react'
import BarChart from '~/components/charts/BarChart'
import { useViewHandlerState, useViewRows, viewHandler } from '~/data'

const statuses = ['Active', 'Completed', 'Dropped Out']

export default function VisualizationRoute() {
  useViewHandlerState(viewHandler)
  const view = viewHandler.getActiveView()
  const { state } = useViewRows(view)
  const rows = state.status === 'ready' ? state.data : null

  const counts = useMemo(
    () => statuses.map((status) => (rows ?? []).filter((row) => row.cells.studyStatus === status).length),
    [rows],
  )

  if (state.status === 'error') return <p className="p-4">Could not load participants: {state.error}</p>
  if (rows === null) return <p className="p-4">Loading…</p>

  return (
    <div className="p-4 max-w-3xl">
      <BarChart labels={statuses} data={counts} label={`Participants by status (${view.getName()})`} />
    </div>
  )
}
