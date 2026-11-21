import { useEffect } from 'react'

// the burger menu will open where the mouse is
export interface MenuPosition {
  x: number
  y: number
}

export interface BurgerMenuItem {
  label: string
  onClick: () => void
}

// Generic burger menu. Currently the only option is filtering (see ColumnFilterMenu); more options get added as items.
export default function BurgerMenu({
  position,
  items,
  onClose,
}: {
  position: MenuPosition
  items: BurgerMenuItem[]
  onClose: () => void
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        onContextMenu={(event) => {
          event.preventDefault()
          onClose()
        }}
      />
      <div
        className="fixed z-50 w-48 p-1 bg-sidebar-surface"
        style={{ left: position.x, top: position.y }}
        onClick={(event) => event.stopPropagation()}
        onContextMenu={(event) => event.stopPropagation()}
      >
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            className="block w-full px-2 py-1 text-left rounded cursor-pointer hover:bg-dashboard-surface"
            onClick={() => {
              item.onClick()
              onClose()
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  )
}
