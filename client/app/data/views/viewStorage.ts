import { STORAGE_KEY_OPEN_VIEWS, STORAGE_KEY_SAVED_VIEWS } from '../config'
import { failure, success } from '../types/result'
import type { ActionResult } from '../types/result'
import type { ViewSettings } from '../types/view'
import { looksLikeViewSettings } from './viewSettings'

export interface StoredOpenViews {
  views: ViewSettings[]
  activeViewId: string
}

export interface ViewStorage {
  loadOpenViews(): StoredOpenViews | null
  saveOpenViews(openViews: StoredOpenViews): ActionResult
  loadSavedViews(): ViewSettings[]
  saveSavedViews(savedViews: ViewSettings[]): ActionResult
}

const STORAGE_ERROR =
  'The view settings could not be stored in this browser. ' +
  'Free up browser storage or leave private browsing mode, then try again.'

export function createBrowserViewStorage(): ViewStorage {
  return {
    loadOpenViews(): StoredOpenViews | null {
      const value = readJson(STORAGE_KEY_OPEN_VIEWS)
      if (typeof value !== 'object' || value === null) {
        return null
      }
      const stored = value as Record<string, unknown>
      if (
        !Array.isArray(stored.views) ||
        !stored.views.every(looksLikeViewSettings) ||
        typeof stored.activeViewId !== 'string'
      ) {
        return null
      }
      return { views: stored.views, activeViewId: stored.activeViewId }
    },

    saveOpenViews(openViews: StoredOpenViews): ActionResult {
      return writeJson(STORAGE_KEY_OPEN_VIEWS, openViews)
    },

    loadSavedViews(): ViewSettings[] {
      const value = readJson(STORAGE_KEY_SAVED_VIEWS)
      if (!Array.isArray(value)) {
        return []
      }
      return value.filter(looksLikeViewSettings)
    },

    saveSavedViews(savedViews: ViewSettings[]): ActionResult {
      return writeJson(STORAGE_KEY_SAVED_VIEWS, savedViews)
    },
  }
}

export function createMemoryViewStorage(): ViewStorage {
  let openViews: StoredOpenViews | null = null
  let savedViews: ViewSettings[] = []

  return {
    loadOpenViews: () => (openViews === null ? null : structuredClone(openViews)),
    saveOpenViews: (value) => {
      openViews = structuredClone(value)
      return success()
    },
    loadSavedViews: () => structuredClone(savedViews),
    saveSavedViews: (value) => {
      savedViews = structuredClone(value)
      return success()
    },
  }
}

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function readJson(key: string): unknown {
  const storage = getLocalStorage()
  if (storage === null) {
    return null
  }
  try {
    const text = storage.getItem(key)
    return text === null ? null : JSON.parse(text)
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown): ActionResult {
  if (typeof window === 'undefined') {
    return success()
  }
  const storage = getLocalStorage()
  if (storage === null) {
    return failure(STORAGE_ERROR)
  }
  try {
    storage.setItem(key, JSON.stringify(value))
    return success()
  } catch {
    return failure(STORAGE_ERROR)
  }
}
