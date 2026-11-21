import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import Button from '~/components/Button/Button'
import {
  dataHandler,
  getCategoryOptions,
  getFilterOperatorFor,
  getLatestData,
  useDatasetInfo,
  useViewSettings,
} from '~/data'
import type { Column, DatasetInfo, Filter, View } from '~/data'

// Position where the menu opens, in viewport coordinates (where the burger menu's "Filter…" was clicked).
export interface FilterMenuPosition {
  x: number
  y: number
}

// Opened from the burger menu (BurgerMenu.tsx) on a column label. The editor shown is decided by getFilterOperatorFor(column.dataType) from data/pipeline/filters.ts:
// for number it chooses in 'between'    (min / max inputs)
// for text it chooss whatever contains said text
// for category its obvious
// apply calls view.setFilter(...), which runs validateFilter and returns { ok: false, error } on failure. 
// The stored filter goes through view.toQuery().filters in RowSource


export default function ColumnFilterMenu({view, column, position, onClose}
  : {view: View; column: Column; position: FilterMenuPosition; onClose: () => void}) 
  {
  const settings = useViewSettings(view)
  const datasetInfo = getLatestData(useDatasetInfo(dataHandler).state)
  const current = settings.filters.find((filter) => filter.columnKey === column.key)
  const operator = getFilterOperatorFor(column.dataType)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const apply = (filter: Filter): string | null => {
    const result = view.setFilter(filter)
    if (!result.ok) {
      return result.error
    }
    onClose()
    return null
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        onContextMenu={(event) => {
          event.preventDefault()
          onClose()
        }}
      />
      <div
        className="fixed z-50 w-64 p-3 bg-sidebar-surface"
        style={{ left: position.x, top: position.y }}
        onClick={(event) => event.stopPropagation()}
        onContextMenu={(event) => event.stopPropagation()}
      >
        <p className="font-semibold mb-2 truncate">{column.label}</p>
        {operator === 'between' && <RangeEditor column={column} current={current} apply={apply} />}
        {operator === 'in' && (
          <CategoryEditor column={column} datasetInfo={datasetInfo} current={current} apply={apply} />
        )}
        {operator === 'startsWith' && <TextEditor column={column} current={current} apply={apply} />}
        {current !== undefined && (
          <Button
            className="w-full mt-2"
            onClick={() => {
              view.removeFilter(column.key)
              onClose()
            }}
          >
            Clear filter
          </Button>
        )}
      </div>
    </>
  )
}

type Apply = (filter: Filter) => string | null

function EditorShell({ error, onApply, children }: { error: string | null; onApply: () => void; children: ReactNode }) {
  return (
    <div>
      {children}
      {error !== null && <p className="text-sm text-red-400 mt-1">{error}</p>}
      <Button className="w-full mt-2" onClick={onApply}>
        Apply filter
      </Button>
    </div>
  )
}

function RangeEditor({ column, current, apply }: { column: Column; current: Filter | undefined; apply: Apply }) {
  const range = current?.operator === 'between' ? current.value : { min: null, max: null }
  const [minText, setMinText] = useState(range.min === null ? '' : String(range.min))
  const [maxText, setMaxText] = useState(range.max === null ? '' : String(range.max))
  const [error, setError] = useState<string | null>(null)

  const onApply = () => {
    const min = parseOptionalNumber(minText)
    const max = parseOptionalNumber(maxText)
    if (min === undefined || max === undefined) {
      setError('The minimum and maximum must be numbers.')
      return
    }
    setError(apply({ columnKey: column.key, operator: 'between', value: { min, max } }))
  }

  return (
    <EditorShell error={error} onApply={onApply}>
      <NumberField label="Minimum" value={minText} onChange={setMinText} />
      <NumberField label="Maximum" value={maxText} onChange={setMaxText} />
    </EditorShell>
  )
}

function CategoryEditor({
  column,
  datasetInfo,
  current,
  apply,
}: {
  column: Column
  datasetInfo: DatasetInfo | null
  current: Filter | undefined
  apply: Apply
}) {
  const options = datasetInfo === null ? [] : getCategoryOptions(column, datasetInfo)
  // null means "all options selected", the default when no filter exists yet
  const [selected, setSelected] = useState<string[] | null>(current?.operator === 'in' ? [...current.value] : null)
  const [error, setError] = useState<string | null>(null)

  const onApply = () => {
    const value = [...(selected ?? options)].sort()
    if (value.length === 0) {
      setError('Select at least a value')
      return
    }
    setError(apply({ columnKey: column.key, operator: 'in', value }))
  }

  return (
    <EditorShell error={error} onApply={onApply}>
      {datasetInfo === null && <p className="text-sm opacity-70">Loading values…</p>}
      <div className="max-h-48 overflow-y-auto mb-1">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected === null || selected.includes(option)}
              onChange={() => {
                const base = selected ?? options
                setSelected(base.includes(option) ? base.filter((v) => v !== option) : [...base, option])
              }}
            />
            {option}
          </label>
        ))}
      </div>
    </EditorShell>
  )
}

function TextEditor({ column, current, apply }: { column: Column; current: Filter | undefined; apply: Apply }) {
  const [text, setText] = useState(current?.operator === 'startsWith' ? current.value : '')
  const [error, setError] = useState<string | null>(null)

  const onApply = () => setError(apply({ columnKey: column.key, operator: 'startsWith', value: text }))

  return (
    <EditorShell error={error} onApply={onApply}>
      <label className="block mb-1 text-sm">
        Starts with
        <input
          type="text"
          className="block w-full px-2 py-1 mt-1"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onApply()
            }
          }}
        />
      </label>
    </EditorShell>
  )
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block mb-1 text-sm">
      {label}
      <input
        type="number"
        className="block w-full px-2 py-1 mt-1 rounded bg-dashboard-surface"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function parseOptionalNumber(text: string): number | null | undefined {
  if (text.trim() === '') {
    return null
  }
  const value = Number(text)
  return Number.isFinite(value) ? value : undefined
}
