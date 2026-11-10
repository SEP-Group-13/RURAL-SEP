import type { CellValue, RowPage } from '../../types/rows'
import type { ParticipantPage } from '../apiTypes'
import type { ColumnNames } from './view'

/**
 * Cell key for one year of a band column. The spec assigns bands per calendar year, so a band
 * column comes back as one value per selected year rather than a single value.
 */
export function bandCellKey(bandColumnKey: string, year: number): string {
  return `${bandColumnKey}:${year}`
}

export interface ParticipantRowPage extends RowPage {
  /** For each band column key, the years the server returned, in column order. */
  bandYears: Record<string, number[]>
}

/**
 * Turns a page from POST /participants/query into the table's RowPage, with cells keyed by
 * frontend column key (per-year band values under `bandCellKey`). Columns the view does not know
 * are dropped.
 */
export function fromParticipantPage(page: ParticipantPage, names: ColumnNames): ParticipantRowPage {
  const cellKeys = new Map<string, string>()
  const bandYears: Record<string, number[]> = {}

  for (const name of page.columns) {
    const resolved = names.resolve(name)
    if (resolved === null) {
      continue
    }
    if (resolved.year === null) {
      cellKeys.set(name, resolved.key)
    } else {
      cellKeys.set(name, bandCellKey(resolved.key, resolved.year))
      ;(bandYears[resolved.key] ??= []).push(resolved.year)
    }
  }

  const rows = page.rows.map((row) => {
    const cells: Record<string, CellValue> = {}
    for (const [name, key] of cellKeys) {
      cells[key] = row.values[name] ?? null
    }
    return { participantId: row.participantId, cells }
  })

  return {
    rows,
    pageNumber: page.page,
    pageSize: page.pageSize,
    totalRows: page.total,
    totalPages: Math.max(1, Math.ceil(page.total / page.pageSize)),
    bandYears,
  }
}
