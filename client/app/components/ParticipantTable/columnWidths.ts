import type { Column } from '~/data'

const COLUMN_WIDTHS: Record<string, string> = {
  participantId: '110px',
  age: '60px',
  sex: '110px',
  race: '80px',
  county: '90px',
  state: '70px',
  studyStatus: '120px',
  timeBurden: '150px',
  timeBand: '100px',
  radiationBurden: '190px',
  radiationBand: '130px',
  name: 'minmax(140px, 1fr)',
  email: 'minmax(180px, 1fr)',
  phone: '130px',
  coreExamCompleted: '170px',
  additionalStudies: '150px',
  emailsSent: '110px',
  smsSent: '90px',
}

export function getColumnWidth(column: Column): string {
  const knownWidth = COLUMN_WIDTHS[column.key]
  if (knownWidth !== undefined) {
    return knownWidth
  }
  const widthForLabel = Math.min(320, Math.max(110, column.label.length * 9 + 50))
  return `${widthForLabel}px`
}
