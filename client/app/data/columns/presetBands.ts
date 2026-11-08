import type { Band, PresetBandName } from '../types/band'

const PRESET_BANDS: Record<PresetBandName, Band[]> = {
  time: [
    { label: 'Low', below: 180 },
    { label: 'Medium', below: 360 },
    { label: 'High', below: null },
  ],

  radiation: [
    { label: 'Low', below: 3 },
    { label: 'Medium', below: 10 },
    { label: 'High', below: null },
  ],

  participation: [
    { label: 'Low', below: 2 },
    { label: 'Medium', below: 3 },
    { label: 'High', below: null },
  ],

  contactFrequency: [
    { label: 'Low', below: 5 },
    { label: 'Medium', below: 13 },
    { label: 'High', below: null },
  ],
}

export function getPresetBands(name: PresetBandName): Band[] {
  return PRESET_BANDS[name].map((band) => ({ ...band }))
}
