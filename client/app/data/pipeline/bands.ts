import type { Band } from '../types/band'
import type { CellValue } from '../types/rows'

export function findBandLabel(value: CellValue, bands: Band[]): string | null {
  if (typeof value !== 'number') {
    return null
  }
  for (const band of bands) {
    if (band.below === null || value < band.below) {
      return band.label
    }
  }
  return null
}

export function validateBands(bands: Band[]): string | null {
  if (bands.length === 0) {
    return 'Add at least one band.'
  }

  const seenLabels = new Set<string>()
  for (const band of bands) {
    const label = band.label.trim()
    if (label === '') {
      return 'Every band needs a label.'
    }
    if (seenLabels.has(label.toLowerCase())) {
      return `Two bands use the label "${label}". Every band needs its own label.`
    }
    seenLabels.add(label.toLowerCase())
  }

  let previousBound: number | null = null
  for (let i = 0; i < bands.length; i += 1) {
    const band = bands[i] as Band
    const isLast = i === bands.length - 1

    if (isLast) {
      if (band.below !== null) {
        return 'The last band must cover everything that is left, so it has no upper bound.'
      }
      continue
    }
    if (band.below === null || !Number.isFinite(band.below)) {
      return `Band "${band.label}" needs an upper bound. Only the last band has none.`
    }
    if (previousBound !== null && band.below === previousBound) {
      return `Two bands use the bound ${band.below}. Every band needs its own bound.`
    }
    if (previousBound !== null && band.below < previousBound) {
      return `The bounds must go up from band to band, but ${previousBound} is followed by ${band.below}.`
    }
    previousBound = band.below
  }

  return null
}

export function bandsAreEqual(first: Band[], second: Band[]): boolean {
  if (first.length !== second.length) {
    return false
  }
  return first.every((band, i) => {
    const other = second[i]
    return other !== undefined && band.label === other.label && band.below === other.below
  })
}
