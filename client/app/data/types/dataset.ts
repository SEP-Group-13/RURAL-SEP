import type { ContactField } from './participant'

export type DataSourceMode = 'internal' | 'external'

export interface DatasetInfo {
  refreshedAt: string
  dataSourceMode: DataSourceMode

  years: number[]

  contactFields: ContactField[]

  categoryValues: Record<string, string[]>
}
