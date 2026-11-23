import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

// the burger menu will open where the mouse is
export interface MenuPosition {
  x: number
  y: number
}

// minimum distance between the menu and the edge of the screen
const SCREEN_MARGIN = 8

export interface BurgerMenuTab {
  label: string
  content: (close: () => void) => ReactNode
}

export default function BurgerMenu({
  position,
  tabs,
  onClose,
}: {
  position: MenuPosition
  tabs: BurgerMenuTab[]
  onClose: () => void
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeTab = tabs[activeIndex] ?? tabs[0]
  const panelRef = useRef<HTMLDivElement>(null)
  const [placed, setPlaced] = useState<MenuPosition>(position)

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (panel === null) {
      return
    }
    const place = () => {
      const { width, height } = panel.getBoundingClientRect()
      const maxX = document.documentElement.clientWidth - width - SCREEN_MARGIN
      const maxY = document.documentElement.clientHeight - height - SCREEN_MARGIN
      const x = Math.max(SCREEN_MARGIN, Math.min(position.x, maxX))
      const y = Math.max(SCREEN_MARGIN, Math.min(position.y, maxY))
      setPlaced((previous) => (previous.x === x && previous.y === y ? previous : { x, y }))
    }
    place()
  }, [position.x, position.y])

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
        ref={panelRef}
        className="fixed z-50 w-64 bg-sidebar-surface"
        style={{ left: placed.x, top: placed.y }}
        onClick={(event) => event.stopPropagation()}
        onContextMenu={(event) => event.stopPropagation()}
      >
        <div role="tablist" className="flex flex-wrap gap-1 p-1 border-b border-dashboard-surface">
          {tabs.map((tab, index) => (
            <button
              key={tab.label}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              className={`px-2 py-1 rounded cursor-pointer ${
                index === activeIndex ? 'bg-dashboard-surface font-semibold' : 'hover:bg-dashboard-surface'
              }`}
              onClick={() => setActiveIndex(index)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div role="tabpanel" className="p-3">
          {activeTab?.content(onClose)}
        </div>
      </div>
    </>
  )
}
