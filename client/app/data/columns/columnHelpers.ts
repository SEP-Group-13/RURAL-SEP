import { bandsAreEqual } from '../pipeline/bands'
import type { Column } from '../types/column'
import type { DatasetInfo } from '../types/dataset'
import { getPresetBands } from './presetBands'

export function createUniqueKey(base: string, columns: Column[]): string {
  let number = 1
  while (columns.some((column) => column.key === `${base}${number}`)) {
    number += 1
  }
  return `${base}${number}`
}

export function isLabelInUse(label: string, columns: Column[], exceptKey: string | null): boolean {
  const wanted = label.trim().toLowerCase()
  return columns.some((column) => column.key !== exceptKey && column.label.trim().toLowerCase() === wanted)
}

export function getCategoryOptions(column: Column, datasetInfo: DatasetInfo): string[] {
  if (column.source.kind === 'band') {
    return column.source.bands.map((band) => band.label)
  }
  if (column.source.kind === 'field') {
    return datasetInfo.categoryValues[column.source.field] ?? []
  }
  return []
}

export function isBandColumnEdited(column: Column): boolean {
  if (column.source.kind !== 'band' || column.source.presetName === null) {
    return false
  }
  return !bandsAreEqual(column.source.bands, getPresetBands(column.source.presetName))
}
