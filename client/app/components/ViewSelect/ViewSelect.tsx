import { useState } from 'react'
import Button from '~/components/Button/Button'
import { MAX_OPEN_VIEWS, useViewHandlerState, viewHandler } from '~/data'
import type { ActionResult } from '~/data'

export default function ViewSelect() {
  const { views, activeViewId, storageError } = useViewHandlerState(viewHandler)
  const [message, setMessage] = useState<string | null>(null)

  const show = (result: ActionResult) => setMessage(result.ok ? (result.message ?? null) : result.error)

  const switchView = (viewId: string) => {
    setMessage(null)
    viewHandler.setActiveView(viewId)
  }

  const closeView = () => {
    setMessage(null)
    viewHandler.deleteView(activeViewId)
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      <select
        value={activeViewId}
        onChange={(event) => switchView(event.target.value)}
        className="bg-sidebar-surface rounded px-2 py-1"
        aria-label="View"
      >
        {views.map((view) => (
          <option key={view.getId()} value={view.getId()}>
            {view.getName()}
          </option>
        ))}
      </select>
      <Button onClick={() => show(viewHandler.createView())} disabled={views.length >= MAX_OPEN_VIEWS}>
        New view
      </Button>
      <Button onClick={() => show(viewHandler.duplicateView(activeViewId))} disabled={views.length >= MAX_OPEN_VIEWS}>
        Duplicate
      </Button>
      <Button onClick={closeView}>Close view</Button>
      {(message ?? storageError) && <span>{message ?? storageError}</span>}
    </div>
  )
}
