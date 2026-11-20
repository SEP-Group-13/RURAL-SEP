import type { Participant } from '../../data/types/participant'
import type { ViewRow } from '../../data/types/rows'
import type { ViewQuery } from '../../data/types/view'
import { computeRow } from './computeRow'
import { matchesAllFilters } from './matching'
import { sortRows } from './sorting'

export function runPipeline(participants: Participant[], query: ViewQuery): ViewRow[] {
  const excludedIds = new Set(query.excludedIds)
  const includedParticipants = participants.filter((p) => !excludedIds.has(p.participantId))

  const rows = includedParticipants.map((participant) => computeRow(participant, query))

  const matchingRows = rows.filter((row) => matchesAllFilters(row, query.filters))

  return sortRows(matchingRows, query.sort)
}

