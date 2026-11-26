import { createDefaultColumns } from '../../columns/defaultColumns'
import type { Column } from '../../types/column'
import type { DatasetInfo } from '../../types/dataset'
import type { ContactField } from '../../types/participant'
import type { ApiColumn, ApiMeta } from '../apiTypes'

const CONTACT_FIELDS: ContactField[] = ['name', 'email', 'phone']

/**
 * Combines GET /meta and GET /columns into the frontend's DatasetInfo.
 *
 * `categoryValues` is keyed by frontend column key. Server columns are matched to the frontend's
 * known columns by name; a categorical column the frontend does not know is keyed by its name.
 */
export function toDatasetInfo(meta: ApiMeta, columns: ApiColumn[], knownColumns: Column[] = createDefaultColumns()): DatasetInfo {
  const keysByName = new Map(knownColumns.map((column) => [column.label.trim(), column.key]))

  const categoryValues: Record<string, string[]> = {}
  for (const column of columns) {
    if (column.type === 'categorical') {
      categoryValues[keysByName.get(column.name) ?? column.name] = [...(column.values ?? [])]
    }
  }

  return {
    refreshedAt: meta.dataRefreshedAt,
    dataSourceMode: meta.dataSourceMode,
    years: [...meta.years],
    contactFields: CONTACT_FIELDS.filter((field) => meta.contactDetails[field]),
    categoryValues,
  }
}
