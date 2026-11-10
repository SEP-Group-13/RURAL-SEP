import { dataHandler, getLatestData, useDatasetInfo, useViewSettings } from '~/data'
import type { Column, ColumnGroup, ContactField, View } from '~/data'

const GROUP_ORDER: ColumnGroup[] = [
  'Participant',
  'Burden',
  'Burden formulas',
  'Simulations',
  'Bands',
  'Activity counts',
  'Contact details',
]

const CONTACT_FIELDS: string[] = ['name', 'email', 'phone']

export default function ColumnPicker({ view }: { view: View }) {
  const settings = useViewSettings(view)
  const datasetInfo = getLatestData(useDatasetInfo(dataHandler).state)
  const availableContactFields: ContactField[] = datasetInfo?.contactFields ?? []

  const offered = settings.columns.filter(
    (column) => !CONTACT_FIELDS.includes(column.key) || availableContactFields.includes(column.key as ContactField),
  )

  return (
    <div className="grid gap-4 p-3 mb-3 rounded bg-sidebar-surface grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
      {GROUP_ORDER.map((group) => {
        const columns = offered.filter((column) => column.group === group).sort(byLabel)
        if (columns.length === 0) {
          return null
        }
        return (
          <fieldset key={group}>
            <legend className="font-semibold mb-1">{group}</legend>
            {columns.map((column) => (
              <label key={column.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={column.visible}
                  disabled={column.key === 'participantId'}
                  onChange={(event) =>
                    event.target.checked ? view.showColumn(column.key) : view.hideColumn(column.key)
                  }
                />
                {column.label}
              </label>
            ))}
          </fieldset>
        )
      })}
    </div>
  )
}

function byLabel(a: Column, b: Column): number {
  if (a.key === 'participantId') {
    return -1
  }
  if (b.key === 'participantId') {
    return 1
  }
  return a.label.localeCompare(b.label)
}
