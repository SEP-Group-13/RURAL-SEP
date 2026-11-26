import { useLayoutEffect, useRef, useState } from 'react'
import Button from '~/components/Button/Button'
import { PREDEFINED_FORMULAS, useViewSettings } from '~/data'
import type { Column, PredefinedFormulaName, View } from '~/data'

const PREDEFINED_NAMES = Object.keys(PREDEFINED_FORMULAS) as PredefinedFormulaName[]

function checkColumnReferences(expression: string, columns: Column[]): string | null {
  const names: string[] = []
  let openAt: number | null = null

  for (let i = 0; i < expression.length; i++) {
    const char = expression[i]
    if (char === '[') {
      if (openAt !== null) {
        return `The [ at position ${openAt + 1} is not closed before the next [. Nested colum names are not supported.`
      }
      openAt = i
    } else if (char === ']') {
      if (openAt === null) {
        return `The ] at position ${i + 1} has no matching [.`
      }
      names.push(expression.slice(openAt + 1, i).trim())
      openAt = null
    }
  }
  if (openAt !== null) {
    return `The [ at position ${openAt + 1} is never closed.`
  }

  for (const name of names) {
    if (name === '') {
      return 'There is an empty [] in the formula.'
    }
    if (!columns.some((column) => column.key === name)) {
      return `Column [${name}] does not exist in this view.`
    }
  }
  return null
}

function useCursorInsertion(expression: string, setExpression: (value: string) => void) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const hasCursor = useRef(false)
  const nextCursor = useRef<number | null>(null)

  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (textarea !== null && nextCursor.current !== null) {
      textarea.focus()
      textarea.setSelectionRange(nextCursor.current, nextCursor.current)
      nextCursor.current = null
    }
  }, [expression])

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current
    const start = hasCursor.current && textarea !== null ? textarea.selectionStart : expression.length
    const end = hasCursor.current && textarea !== null ? textarea.selectionEnd : expression.length
    nextCursor.current = start + text.length
    setExpression(expression.slice(0, start) + text + expression.slice(end))
  }

  const trackCursor = () => {
    hasCursor.current = true
  }
  const resetCursor = () => {
    hasCursor.current = false
  }

  return { textareaRef, insertAtCursor, trackCursor, resetCursor }
}

export default function AddBurdenFormulaMenu({ view, onClose }: { view: View; onClose: () => void }) {
  const settings = useViewSettings(view)
  const [name, setName] = useState('')
  const [expression, setExpression] = useState('')
  const [predefined, setPredefined] = useState<PredefinedFormulaName | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { textareaRef, insertAtCursor, trackCursor, resetCursor } = useCursorInsertion(expression, setExpression)

  const numberColumns = settings.columns.filter((column) => column.dataType === 'number')

  const insertColumn = (columnKey: string) => {
    insertAtCursor(`[${columnKey}]`)
    setError(null)
  }

  const choosePredefined = (formulaName: PredefinedFormulaName | null) => {
    setPredefined(formulaName)
    if (formulaName === null) {
      return
    }
    setName(PREDEFINED_FORMULAS[formulaName].label)
    setExpression(PREDEFINED_FORMULAS[formulaName].expression)
    resetCursor()
    setError(null)
  }

  const add = () => {
    // inserting predefined preset bands if not modified
    const untouched =
      predefined !== null &&
      name.trim() === PREDEFINED_FORMULAS[predefined].label &&
      expression === PREDEFINED_FORMULAS[predefined].expression
    const result = untouched ? view.addPredefinedFormula(predefined) : view.addFormulaColumn(name, expression)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onClose()
  }

  return (
    <div>
      <PredefinedFormulaSelect value={predefined} onChange={choosePredefined} />

      <label className="block mb-2 text-sm">
        Name
        <input
          type="text"
          className="block w-full px-2 py-1 mt-1 rounded bg-dashboard-surface"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setError(null)
          }}
        />
      </label>

      <label className="block mb-2 text-sm">
        Formula
        <textarea
          ref={textareaRef}
          rows={3}
          className="block w-full px-2 py-1 mt-1 font-mono rounded resize-y bg-dashboard-surface"
          placeholder="[timeBurden] * 2 + [emailsSent]"
          value={expression}
          onFocus={trackCursor}
          onBlur={() => setError(checkColumnReferences(expression, settings.columns))}
          onChange={(event) => {
            setExpression(event.target.value)
            setError(null)
          }}
        />
      </label>

      <ColumnPicker columns={numberColumns} onPick={insertColumn} />

      {error !== null && <p className="text-sm text-red-400 mt-1">{error}</p>}
      <Button className="w-full mt-2" onClick={add}>
        Add formula
      </Button>
    </div>
  )
}

function PredefinedFormulaSelect({
  value,
  onChange,
}: {
  value: PredefinedFormulaName | null
  onChange: (formulaName: PredefinedFormulaName | null) => void
}) {
  return (
    <label className="block mb-2 text-sm">
      Predefined formula
      <select
        className="block w-full px-2 py-1 mt-1 rounded bg-dashboard-surface"
        value={value ?? ''}
        onChange={(event) =>
          onChange(event.target.value === '' ? null : (event.target.value as PredefinedFormulaName))
        }
      >
        <option value="">Custom formula</option>
        {PREDEFINED_NAMES.map((formulaName) => (
          <option key={formulaName} value={formulaName}>
            {PREDEFINED_FORMULAS[formulaName].label}
          </option>
        ))}
      </select>
    </label>
  )
}

function ColumnPicker({ columns, onPick }: { columns: Column[]; onPick: (columnKey: string) => void }) {
  return (
    <>
      <p className="text-sm">Columns</p>
      <div className="max-h-40 overflow-y-auto mb-1">
        {columns.map((column) => (
          <button
            key={column.key}
            type="button"
            title={`Insert [${column.key}]`}
            className="block w-full px-2 py-0.5 text-sm text-left truncate rounded cursor-pointer hover:bg-dashboard-surface"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onPick(column.key)}
          >
            {column.label}
          </button>
        ))}
      </div>
    </>
  )
}
