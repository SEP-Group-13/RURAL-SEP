import type { Band } from './band'

/** A burden preset from RURAL (GET /burden-presets): the same for every user, never changes. */
export interface BurdenPreset {
  /** Column name in the API, e.g. "Time burden (min)". */
  name: string
  /**
   * The formula, with column references by API name (e.g. `[Emails sent] + [SMS sent]`), or null
   * when the burden is a column of the table.
   */
  formula: string | null
  bands: Band[]
  /** Default burdens are part of every view; the others are added by the user. */
  isDefault: boolean
}
