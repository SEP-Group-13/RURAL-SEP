import type { CellValue } from '~/data'

const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })

export function formatCell(value: CellValue | undefined): string {
  if (value === null || value === undefined) {
    return '—'
  }
  if (typeof value === 'number') {
    return numberFormat.format(value)
  }
  return value
}
