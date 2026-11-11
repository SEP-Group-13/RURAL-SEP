import type { Column } from '../../data/types/column'
import type { Participant, YearlyMetric, YearlyTotals } from '../../data/types/participant'
import type { CellValue, ViewRow } from '../../data/types/rows'
import type { ViewQuery, YearSelection } from '../../data/types/view'
import { findBandLabel } from './matching'
import { evaluateFormula, parseFormula } from '../../data/pipeline/formula'
import type { FormulaNode } from '../../data/pipeline/formula'

export function computeRow(participant: Participant, query: ViewQuery): ViewRow {
  const cells: Record<string, CellValue> = {}
  const beingCalculated = new Set<string>()

  function getCell(columnKey: string): CellValue {
    const known = cells[columnKey]
    if (known !== undefined) {
      return known
    }
    const column = query.columns.find((c) => c.key === columnKey)
    if (column === undefined || beingCalculated.has(columnKey)) {
      return null
    }
    beingCalculated.add(columnKey)
    const value = computeCell(column, participant, query.selectedYears, getCell)
    beingCalculated.delete(columnKey)
    cells[columnKey] = value
    return value
  }

  for (const column of query.columns) {
    getCell(column.key)
  }
  return { participantId: participant.participantId, cells }
}

function computeCell(
  column: Column,
  participant: Participant,
  selectedYears: YearSelection,
  getCell: (columnKey: string) => CellValue,
): CellValue {
  const source = column.source

  switch (source.kind) {
    case 'field':
      return participant[source.field]

    case 'yearly':
      return sumOverYears(participant.yearlyTotals, source.metric, selectedYears)

    case 'simulation':
      return source.value

    case 'formula': {
      const formula = getParsedFormula(source.expression)
      return formula === null ? null : evaluateFormula(formula, getCell)
    }

    case 'band':
      return findBandLabel(getCell(source.sourceColumnKey), source.bands)
  }
}

export function sumOverYears(yearlyTotals: YearlyTotals[], metric: YearlyMetric, selectedYears: YearSelection): number {
  let total = 0
  for (const totals of yearlyTotals) {
    if (selectedYears === 'all' || selectedYears.includes(totals.year)) {
      total += totals[metric]
    }
  }
  return total
}

const parsedFormulas = new Map<string, FormulaNode | null>()

function getParsedFormula(expression: string): FormulaNode | null {
  const known = parsedFormulas.get(expression)
  if (known !== undefined) {
    return known
  }
  const parsed = parseFormula(expression)
  const formula = parsed.ok ? parsed.formula : null
  parsedFormulas.set(expression, formula)
  return formula
}
