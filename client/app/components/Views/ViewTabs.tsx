import { Copy, Pencil, Plus, Trash, X, type LucideIcon } from "lucide-react"
import { useState } from "react"
import { MAX_OPEN_VIEWS, viewHandler, useViewHandlerState } from "~/data"


export default function ViewTabs() {
    const { views, activeViewId } = useViewHandlerState(viewHandler)

    const [contextMenu, setContextMenu] = useState<{
        x: number
        y: number
        viewId: string
    } | null>(null)
    
    return (
        <div className="flex w-full flex-nowrap items-center rounded">
            {views.map((view, idx) => (
            <button
                key={view.getId()}
                className={`flex min-w-0 max-w-40 flex-1 py-1 px-2 text-left cursor-pointer items-center gap-2
                
                ${view.getId() === activeViewId
                    ? 'bg-sidebar-surface text-text-main z-50'
                    : 'bg-transparent text-text-main hover:bg-sidebar-surface'
                }
                
                ${idx === 0? `rounded-tl`: ``}
                ${idx === views.length - 1 ? `rounded-tr` : ``}
                `}
                onClick={() => viewHandler.setActiveView(view.getId())}
                onContextMenu={(event) => {
                    event.preventDefault()
                    setContextMenu({
                        x: event.clientX,
                        y: event.clientY,
                        viewId: view.getId(),
                    })
                    viewHandler.setActiveView(view.getId())
                }}
            >
                <span className="min-w-0 flex-1 truncate">{view.getName()}</span>
                <X type="button" className="size-[1em] text-stone-400  hover:text-text-main shrink-0" onClick={() => viewHandler.deleteView(view.getId())}/>
            </button>
            ))}

            {contextMenu && (
                <div role="menu" className="flex flex-col items-start justify-center fixed z-50 rounded bg-sidebar-surface shadow-lg"
                    style={{ left: contextMenu.x, top: contextMenu.y }}>
                    <ViewMenuButton label="Rename" icon={Pencil} onClick={() => {
                            const newName = window.prompt("Enter new name", viewHandler.getView(contextMenu.viewId)?.getName())
                            if (newName !== null) {
                                viewHandler.renameView(contextMenu.viewId, newName)
                            }
                            setContextMenu(null)
                        }} />

                    <ViewMenuButton
                        label="Duplicate"
                        icon={Copy}
                        disabled={views.length >= MAX_OPEN_VIEWS}
                        onClick={() => {
                            viewHandler.duplicateView(contextMenu.viewId)
                            setContextMenu(null)
                        }}
                    />

                    <ViewMenuButton label="Delete" icon={Trash} onClick={() => {
                            viewHandler.deleteView(contextMenu.viewId)
                            setContextMenu(null)
                        }} />
                </div>
            )}

            <button className="shrink-0 ml-2 rounded-t whitespace-nowrap bg-transparent cursor-pointer text-text-main flex justify-center items-center py-1 px-2 gap-1
                            hover:bg-sidebar-surface disabled:opacity-50 disabled:cursor-default disabled:hover:bg-transparent "
                onClick={() => (viewHandler.createView())} disabled={views.length >= MAX_OPEN_VIEWS}>
                    <Plus className="size-[1em]"/>
                    <span>New view</span>
            </button>
        </div>
    )
}

function ViewMenuButton({label, icon: Icon, onClick, disabled = false}: {
    label: string
    icon: LucideIcon
    onClick: () => void
    disabled?: boolean
}) {
    return (
        <button
            type="button"
            role="menuitem"
            disabled={disabled}
            className="flex w-full items-center justify-start gap-2 pl-2 pr-5 py-1 text-left hover:bg-route-button-hover-bg text-route-button-hover-text disabled:opacity-50 disabled:hover:bg-transparent"
            onClick={onClick}
        >
            <Icon className="size-[1em]" />
            {label}
        </button>
    )
}