import type { SearchResult } from "../types/search";
import { DataHandler } from "../participants/DataHandler";
import { useCallback, useRef, useState } from 'react';
import { getErrorMessage } from "../api/ApiError";

export type SearchState =
  | { status: 'idle' }
  | { status: 'loading'; query: string }
  | { status: 'ready'; query: string; result: SearchResult }
  | { status: 'error'; query: string; error: string }

export function useParticipantSearch(dataHandler: DataHandler) {
  const [state, setState] = useState<SearchState>({ status: 'idle' })
  const latest = useRef(0)

  // Resolves to the result, or null when the search failed or a newer one replaced it.
  const search = useCallback(async (text: string): Promise<SearchResult | null> => {
    const query = text.trim()
    const id = ++latest.current
    if (query === '') {
      setState({ status: 'idle' })
      return null
    }
    setState({ status: 'loading', query })
    try {
      const result = await dataHandler.searchParticipants(query)
      if (id !== latest.current) return null
      setState({ status: 'ready', query, result })
      return result
    } catch (error) {
      if (id === latest.current) setState({ status: 'error', query, error: getErrorMessage(error) })
      return null
    }
  }, [dataHandler])

  const clear = useCallback(() => {
    latest.current++
    setState({ status: 'idle' })
  }, [])

  return { state, search, clear }
}
