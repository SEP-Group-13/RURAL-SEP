// components/TopBar/Search.tsx
import { LoaderCircle, SearchIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'
import Button from '~/components/Button/Button'
import { dataHandler, getLatestData, useDatasetInfo } from '~/data'
import { useParticipantSearch } from '~/data/react/useParticipantSearch'
import type { SearchState } from '~/data/react/useParticipantSearch'
import type { ContactField } from '~/data'

export default function Search() {
  const [text, setText] = useState('')
  const { state, search, clear } = useParticipantSearch(dataHandler)
  const info = getLatestData(useDatasetInfo(dataHandler).state)
  const navigate = useNavigate()
  const formRef = useRef<HTMLFormElement>(null)

  const open = useCallback(
    (participantId: string) => {
      clear()
      navigate(`/participants/${encodeURIComponent(participantId)}`) // URF 3.3, 3.4
    },
    [clear, navigate],
  )

  // Used for both Enter and Retry, so a retry with one match also opens the details page.
  async function run(query: string) {
    const result = await search(query)
    const only = result?.participants[0]
    if (result?.total === 1 && only !== undefined) {
      open(only.participantId)
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void run(text)
  }

  // Close the results list when the user clicks outside the search bar.
  useEffect(() => {
    if (state.status === 'idle') {
      return
    }
    function onPointerDown(event: PointerEvent) {
      if (!formRef.current?.contains(event.target as Node)) {
        clear()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [state.status, clear])

  return (
    <form
      ref={formRef}
      role="search"
      onSubmit={submit}
      className="bg-sidebar-surface px-2 py-1.5 text-m relative flex w-full items-center rounded"
    >
      {state.status === 'loading' ? (
        <LoaderCircle className="size-[1em] mr-2 animate-spin" aria-hidden /> // URF 1.6
      ) : (
        <SearchIcon className="size-[1em] mr-2" aria-hidden />
      )}
      <input
        type="text"
        enterKeyHint="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') clear()
        }}
        placeholder={searchPlaceholder(info?.contactFields ?? [])} // URF 2.7
        aria-label="Search participants"
        className="w-full placeholder:text-stone-400 focus:outline-none"
      />
      {state.status !== 'idle' && (
        <SearchResults state={state} onSelect={open} onRetry={() => void run(state.query)} />
      )}
    </form>
  )
}

function SearchResults({
  state,
  onSelect,
  onRetry,
}: {
  state: Exclude<SearchState, { status: 'idle' }>
  onSelect: (participantId: string) => void
  onRetry: () => void
}) {
  return (
    <div className="absolute left-0 right-0 top-full mt-1 z-10 rounded bg-sidebar-surface p-1 shadow">
      {state.status === 'loading' && <p className="px-2 py-1 opacity-70">Searching…</p>}

      {state.status === 'error' && ( // URF 1.7, 1.8
        <div className="flex items-center gap-2 px-2 py-1">
          <p>Search failed: {state.error}</p>
          <Button onClick={onRetry} className="bg-route-button-hover-bg">
            Retry
          </Button>
        </div>
      )}

      {state.status === 'ready' && state.result.total === 0 && (
        <p className="px-2 py-1">No participant found</p> // URF 3.7
      )}

      {state.status === 'ready' && state.result.total > 1 && (
        <>
          <ul className="max-h-80 overflow-y-auto">
            {state.result.participants.map((participant) => (
              <li key={participant.participantId}>
                <button
                  type="button"
                  onClick={() => onSelect(participant.participantId)} // URF 3.4
                  className="flex w-full gap-2 px-2 py-1 rounded cursor-pointer text-left hover:bg-route-button-hover-bg text-route-button-hover-text"
                >
                  <span>{participant.participantId}</span>
                  {participant.name !== null && <span className="opacity-70">{participant.name}</span>} {/* URF 3.5 */}
                </button>
              </li>
            ))}
          </ul>
          {state.result.total > state.result.participants.length && (
            <p className="px-2 py-1 text-sm opacity-70">
              Showing {state.result.participants.length} of {state.result.total}. Refine your search to see the others.
            </p>
          )}
        </>
      )}
    </div>
  )
}

// "Search by participant ID, email or phone", listing only the contact details the database holds.
function searchPlaceholder(contactFields: ContactField[]): string {
  const parts = ['participant ID', ...contactFields]
  const last = parts.pop()
  return parts.length === 0 ? `Search by ${last}` : `Search by ${parts.join(', ')} or ${last}`
}
