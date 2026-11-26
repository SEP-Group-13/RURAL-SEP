import type { Column, View } from '~/data'

export default function ColumnSortMenu({ view, column, onClose }: { view: View; column: Column; onClose: () => void }) {
  void view
  void onClose

  return (
    <div>
        <p className="text-sm opacity-70">Logic not implemented.</p>
        <p className="text-sm opacity-0">{column.label}</p>
    </div>
  )
}
