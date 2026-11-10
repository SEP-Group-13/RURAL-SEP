import { MAX_OPEN_VIEWS } from '../config'
import type { RowSource } from '../rowSources/RowSource'
import { failure, success } from '../types/result'
import type { ActionResult } from '../types/result'
import type { ViewSettings } from '../types/view'
import { View } from './View'
import { copyViewSettings, createDefaultViewSettings, makeUniqueName } from './viewSettings'
import type { ViewStorage } from './viewStorage'

const DEFAULT_VIEW_NAME = 'Default view'

export interface ViewHandlerState {
  views: View[]
  activeViewId: string
  savedViewNames: string[]

  storageError: string | null
}

export class ViewHandler {
  private rowSource: RowSource
  private storage: ViewStorage
  private views: View[] = []
  private activeViewId = ''
  private savedViews: ViewSettings[]
  private storageError: string | null = null
  private state: ViewHandlerState
  private listeners = new Set<() => void>()
  private stopListeningToView = new Map<string, () => void>()

  constructor(rowSource: RowSource, storage: ViewStorage) {
    this.rowSource = rowSource
    this.storage = storage
    this.savedViews = storage.loadSavedViews()

    const stored = storage.loadOpenViews()
    const storedViews = stored === null ? [] : stored.views.slice(0, MAX_OPEN_VIEWS)
    for (const settings of storedViews) {
      this.views.push(this.makeView(settings))
    }
    if (this.views.length === 0) {
      this.views.push(this.makeView(createDefaultViewSettings(DEFAULT_VIEW_NAME)))
    }

    const firstView = this.views[0] as View
    const storedActiveExists = stored !== null && this.getView(stored.activeViewId) !== undefined
    this.activeViewId = storedActiveExists ? stored.activeViewId : firstView.getId()

    this.state = this.buildState()
  }

  getState(): ViewHandlerState {
    return this.state
  }

  getViews(): View[] {
    return this.views
  }

  getView(viewId: string): View | undefined {
    return this.views.find((view) => view.getId() === viewId)
  }

  getActiveView(): View {
    return this.getView(this.activeViewId) ?? (this.views[0] as View)
  }

  setActiveView(viewId: string): void {
    if (this.getView(viewId) === undefined || viewId === this.activeViewId) {
      return
    }
    this.activeViewId = viewId
    this.changed()
  }

  createView(): ActionResult {
    if (this.views.length >= MAX_OPEN_VIEWS) {
      return failure(tooManyViewsMessage())
    }
    const name = makeUniqueName(`View ${this.views.length + 1}`, this.getOpenViewNames())
    const view = this.makeView(createDefaultViewSettings(name))
    this.views.push(view)
    this.activeViewId = view.getId()
    this.changed()
    return success()
  }

  duplicateView(viewId: string): ActionResult {
    const original = this.getView(viewId)
    if (original === undefined) {
      return failure('This view does not exist any more.')
    }
    if (this.views.length >= MAX_OPEN_VIEWS) {
      return failure(tooManyViewsMessage())
    }
    const name = makeUniqueName(`${original.getName()} (copy)`, this.getOpenViewNames())
    const copy = this.makeView(copyViewSettings(original.getSettings(), name))
    this.views.splice(this.views.indexOf(original) + 1, 0, copy)
    this.activeViewId = copy.getId()
    this.changed()
    return success()
  }

  renameView(viewId: string, newName: string): ActionResult {
    const view = this.getView(viewId)
    if (view === undefined) {
      return failure('This view does not exist any more.')
    }
    const name = newName.trim()
    if (name === '') {
      return failure('Enter a name for the view.')
    }
    if (this.isOpenViewName(name, viewId)) {
      return failure(`Another open view is already called "${name}".`)
    }
    view.setName(name)
    this.changed()
    return success(`View renamed to "${name}".`)
  }

  deleteView(viewId: string): void {
    const view = this.getView(viewId)
    if (view === undefined) {
      return
    }
    const index = this.views.indexOf(view)
    this.views.splice(index, 1)
    this.stopListeningToView.get(viewId)?.()
    this.stopListeningToView.delete(viewId)

    if (this.views.length === 0) {
      this.views.push(this.makeView(createDefaultViewSettings(DEFAULT_VIEW_NAME)))
    }
    if (viewId === this.activeViewId) {
      const leftNeighbour = this.views[Math.max(0, index - 1)] as View
      this.activeViewId = leftNeighbour.getId()
    }
    this.changed()
  }

  getSavedViewNames(): string[] {
    return this.savedViews.map((settings) => settings.name)
  }

  saveActiveView(name: string): ActionResult {
    const trimmed = name.trim()
    if (trimmed === '') {
      return failure('Enter a name for the saved view.')
    }
    if (this.findSavedView(trimmed) !== undefined) {
      return failure(`A saved view called "${trimmed}" already exists.`)
    }
    const active = this.getActiveView()
    if (this.isOpenViewName(trimmed, active.getId())) {
      return failure(`Another open view is already called "${trimmed}".`)
    }

    const toSave = copyViewSettings(active.getSettings(), trimmed)
    const result = this.storage.saveSavedViews([...this.savedViews, toSave])
    if (!result.ok) {
      return result
    }
    this.savedViews = [...this.savedViews, toSave]
    active.setName(trimmed)
    this.changed()
    return success(`View saved as "${trimmed}".`)
  }

  openSavedView(name: string): ActionResult {
    const saved = this.findSavedView(name)
    if (saved === undefined) {
      return failure(`There is no saved view called "${name}".`)
    }
    if (this.views.length >= MAX_OPEN_VIEWS) {
      return failure(tooManyViewsMessage())
    }
    const viewName = makeUniqueName(saved.name, this.getOpenViewNames())
    const view = this.makeView(copyViewSettings(saved, viewName))
    this.views.push(view)
    this.activeViewId = view.getId()
    this.changed()
    return success()
  }

  deleteSavedView(name: string): ActionResult {
    const remaining = this.savedViews.filter((settings) => settings.name !== name)
    const result = this.storage.saveSavedViews(remaining)
    if (!result.ok) {
      return result
    }
    this.savedViews = remaining
    this.changed()
    return success(`Saved view "${name}" deleted.`)
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private makeView(settings: ViewSettings): View {
    const view = new View(settings, this.rowSource)
    const stop = view.subscribe(() => this.storeOpenViews())
    this.stopListeningToView.set(view.getId(), stop)
    return view
  }

  private changed(): void {
    this.storeOpenViews()
    this.state = this.buildState()
    this.notify()
  }

  private storeOpenViews(): void {
    const result = this.storage.saveOpenViews({
      views: this.views.map((view) => view.getSettings()),
      activeViewId: this.activeViewId,
    })
    const newError = result.ok ? null : result.error
    if (newError !== this.storageError) {
      this.storageError = newError
      this.state = this.buildState()
      this.notify()
    }
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener()
    }
  }

  private buildState(): ViewHandlerState {
    return {
      views: [...this.views],
      activeViewId: this.activeViewId,
      savedViewNames: this.getSavedViewNames(),
      storageError: this.storageError,
    }
  }

  private getOpenViewNames(): string[] {
    return this.views.map((view) => view.getName())
  }

  private isOpenViewName(name: string, exceptViewId: string): boolean {
    const wanted = name.toLowerCase()
    return this.views.some((view) => view.getId() !== exceptViewId && view.getName().toLowerCase() === wanted)
  }

  private findSavedView(name: string): ViewSettings | undefined {
    const wanted = name.trim().toLowerCase()
    return this.savedViews.find((settings) => settings.name.toLowerCase() === wanted)
  }
}

function tooManyViewsMessage(): string {
  return `At most ${MAX_OPEN_VIEWS} views can be open at the same time. Close a view first.`
}
