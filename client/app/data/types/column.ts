import type { Band, PresetBandName } from './band'
import type { ParticipantField, YearlyMetric } from './participant'

export type ColumnDataType = 'number' | 'category' | 'text'

export type ColumnGroup =
  'Participant' | 'Contact details' | 'Burden' | 'Activity counts' | 'Burden formulas' | 'Simulations' | 'Bands'

export interface FieldSource {
  kind: 'field'
  field: ParticipantField
}

export interface YearlySource {
  kind: 'yearly'
  metric: YearlyMetric
}

export interface SimulationSource {
  kind: 'simulation'
  value: number
}

export interface FormulaSource {
  kind: 'formula'
  expression: string
}

export interface BandSource {
  kind: 'band'
  sourceColumnKey: string
  bands: Band[]

  presetName: PresetBandName | null
}

export type ColumnSource = FieldSource | YearlySource | SimulationSource | FormulaSource | BandSource

export interface Column {
  key: string

  label: string
  dataType: ColumnDataType
  group: ColumnGroup
  visible: boolean

  removable: boolean
  source: ColumnSource
}
