import type { PresetBandName } from '../types/band'

export type PredefinedFormulaName = 'participationBurden' | 'contactFrequencyBurden'

export interface PredefinedFormula {
  key: string
  label: string
  expression: string
  presetBands: PresetBandName
}

export const PREDEFINED_FORMULAS: Record<PredefinedFormulaName, PredefinedFormula> = {
  participationBurden: {
    key: 'participationBurden',
    label: 'Participation burden',
    expression: '[coreExamCompleted] + [additionalStudies]',
    presetBands: 'participation',
  },

  contactFrequencyBurden: {
    key: 'contactFrequencyBurden',
    label: 'Contact frequency burden',
    expression: '[emailsSent] + [smsSent]',
    presetBands: 'contactFrequency',
  },
}
