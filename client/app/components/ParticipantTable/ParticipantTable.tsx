import { ArrowDown, ArrowUp } from 'lucide-react'
import { useState } from 'react'
import Button from '~/components/Button/Button'
import { getLatestData, useViewPage, useViewSettings } from '~/data'
import type { Column, SortRule, View, ViewRow } from '~/data'
import ColumnPicker from './ColumnPicker'
import { getColumnWidth } from './columnWidths'
import { formatCell } from './formatCell'
import { Link } from 'react-router'

export default function ParticipantTable({ view }: { view: View }) {
  const [pageNumber, setPageNumber] = useState(1)
  const [showColumnPicker, setShowColumnPicker] = useState(false)
  const settings = useViewSettings(view)
  const { state, retry } = useViewPage(view, pageNumber)

  const columns = settings.columns.filter((column) => column.visible)
  const gridTemplateColumns = columns.map(getColumnWidth).join(' ')
  const page = getLatestData(state)
  const loading = state.status === 'loading'

  if (state.status === 'error') {
    return (
      <div className="flex items-center gap-3">
        <p>Could not load participants: {state.error}</p>
        <Button onClick={retry}>Retry</Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Button onClick={() => setShowColumnPicker(!showColumnPicker)}>
          {showColumnPicker ? 'Hide columns' : 'Columns'}
        </Button>
      </div>
      {showColumnPicker && <ColumnPicker view={view} />}

      <div className={`overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
        <div className="min-w-fit">
          <div
            className="grid gap-2 px-3 py-2 font-semibold bg-sidebar-surface rounded-t"
            style={{ gridTemplateColumns }}
          >
            {columns.map((column) => (
              <HeaderCell key={column.key} view={view} column={column} sort={settings.sort} />
            ))}
          </div>
          {page === null && <p className="px-3 py-2">Loading…</p>}
          {page?.rows.length === 0 && <p className="px-3 py-2">No participants in this view.</p>}
          {page?.rows.map((row) => (
            <ParticipantRow
              key={row.participantId}
              row={row}
              columns={columns}
              gridTemplateColumns={gridTemplateColumns}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3">
        <Button disabled={!page || page.pageNumber <= 1} onClick={() => page && setPageNumber(page.pageNumber - 1)}>
          Previous
        </Button>
        <span>
          Page {page?.pageNumber ?? 1} of {page?.totalPages ?? 1} · {page?.totalRows ?? 0} participants
        </span>
        <Button
          disabled={!page || page.pageNumber >= page.totalPages}
          onClick={() => page && setPageNumber(page.pageNumber + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

function HeaderCell({ view, column, sort }: { view: View; column: Column; sort: SortRule | null }) {
  const direction = sort?.columnKey === column.key ? sort.direction : null

  const changeSort = () => {
    if (direction === null) {
      view.setSort(column.key, 'asc')
    } else if (direction === 'asc') {
      view.setSort(column.key, 'desc')
    } else {
      view.clearSort()
    }
  }

  return (
    <button
      type="button"
      onClick={changeSort}
      title={`Sort by ${column.label}`}
      className="flex items-center gap-1 min-w-0 text-left cursor-pointer"
    >
      <span className="truncate">{column.label}</span>
      {column.source.kind === 'formula' && <span className="italic font-normal">f</span>}
      {column.source.kind === 'simulation' && <span className="text-xs px-1 rounded bg-dashboard-surface">S</span>}
      {direction === 'asc' && <ArrowUp className="size-[1em] shrink-0" />}
      {direction === 'desc' && <ArrowDown className="size-[1em] shrink-0" />}
    </button>
  )
}

function ParticipantRow({
  row,
  columns,
  gridTemplateColumns,
}: {
  row: ViewRow
  columns: Column[]
  gridTemplateColumns: string
}) {
  return (
    <div className="grid gap-2 px-3 py-2 border-b border-sidebar-surface" style={{ gridTemplateColumns }}>
      {columns.map((column) => (
        <span key={column.key} className="truncate">
          {formatCell(row.cells[column.key])}
        </span>
      ))}
    </div>
  )
}
