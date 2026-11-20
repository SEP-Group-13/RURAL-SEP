import type { BurdenPreset } from '../../types/burden'
import type { BurdenPreset as ApiBurdenPreset } from '../apiTypes'

/**
 * GET /burden-presets into the frontend's BurdenPreset. Bands get the frontend's shape (`below`,
 * null on the last band). Formulas keep their API column names; translating them to column keys
 * is left to the code that adds a preset to a view.
 */
export function toBurdenPresets(presets: ApiBurdenPreset[]): BurdenPreset[] {
  return presets.map((preset) => ({
    name: preset.name,
    formula: preset.formula,
    bands: preset.bands.map((band) => ({ label: band.label, below: band.upperBound ?? null })),
    isDefault: preset.isDefault,
  }))
}
