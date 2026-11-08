import type { Participant } from '../types/participant'
import type { RowPage, ViewRow } from '../types/rows'
import type { ViewQuery } from '../types/view'
import { computeRow } from './computeRow'
import { matchesAllFilters } from './filters'
import { sortRows } from './sorting'

export function runPipeline(participants: Participant[], query: ViewQuery): ViewRow[] {
  const excludedIds = new Set(query.excludedIds)
  const includedParticipants = participants.filter((p) => !excludedIds.has(p.participantId))

  const rows = includedParticipants.map((participant) => computeRow(participant, query))

  const matchingRows = rows.filter((row) => matchesAllFilters(row, query.filters))

  return sortRows(matchingRows, query.sort)
}

export function getPageOfRows(rows: ViewRow[], pageNumber: number, pageSize: number): RowPage {
  const totalRows = rows.length
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  const safePageNumber = Math.min(Math.max(1, Math.floor(pageNumber)), totalPages)
  const start = (safePageNumber - 1) * pageSize

  return {
    rows: rows.slice(start, start + pageSize),
    pageNumber: safePageNumber,
    pageSize,
    totalRows,
    totalPages,
  }
}
