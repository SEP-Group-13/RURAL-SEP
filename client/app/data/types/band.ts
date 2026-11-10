export interface Band {
  label: string

  below: number | null
}

export type PresetBandName = 'time' | 'radiation' | 'participation' | 'contactFrequency'
