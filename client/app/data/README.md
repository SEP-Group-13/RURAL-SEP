# Data layer: how to use it

All data comes from the API (`/api`). The server filters, sorts, computes formulas and bands, and pages.
The frontend only describes **what** it wants (a view) and shows the result. Import everything from `~/data`.

In development the API is mocked with MSW (`client/app/mocks/`, on when `VITE_MOCK_API=true`), so no server is needed.

## The idea in one paragraph

A **view** holds the table settings: columns, filters, sort, selected years and excluded participants.
Components read data through **hooks** (`useViewPage`, `useChartCounts`, …).
When you change a view, the hooks build the API request again. A request is sent only if it differs
from the last one, and an outdated request still in flight is aborted. Nothing is cached in the browser.

## Showing a table

```tsx
import { useState } from 'react'
import { getLatestData, useViewHandlerState, useViewPage, useViewSettings, viewHandler } from '~/data'

export default function MyTable() {
  useViewHandlerState(viewHandler)              // re-render when the active view changes
  const view = viewHandler.getActiveView()
  const settings = useViewSettings(view)         // re-render when this view's settings change
  const [pageNumber, setPageNumber] = useState(1)

  const { state, retry } = useViewPage(view, pageNumber)
  const page = getLatestData(state)              // previous page while loading, null on first load

  if (state.status === 'error') return <button onClick={retry}>Retry: {state.error}</button>
  if (page === null) return <p>Loading…</p>

  const columns = settings.columns.filter((column) => column.visible)
  return (
    <table>
      <tbody>
        {page.rows.map((row) => (
          <tr key={row.participantId}>
            {columns.map((column) => <td key={column.key}>{String(row.cells[column.key] ?? '')}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

`components/ParticipantTable/ParticipantTable.tsx` is the full example (sorting, paging, band columns).

## Changing what is shown

Call methods on the view. The hooks pick up the change, so you never fetch by hand.

```ts
view.setSort('age', 'desc')
view.setFilter({ columnKey: 'age', operator: 'between', value: { min: 40, max: null } }) // shapes in types/filter.ts
view.showColumn('email')
view.setSelectedYears([2023, 2024])   // or 'all'
```

Methods that can fail return an `ActionResult`: `{ ok: true }` or `{ ok: false, error }`. Show `error` to the user.
Input is checked in the browser first (formula syntax, min > max, bands) so the user gets instant feedback;
the server still has the final say.

## Hooks

| Hook | Gives you |
| --- | --- |
| `useViewPage(view, pageNumber)` | One page of rows (`RowPage`, 25 rows) |
| `useChartCounts(chartHandler, views, columnKey)` | Participants per value of a category or band column |
| `useHistogram(chartHandler, views, columnKey, binWidth)` | Participants per bin of a numeric column |
| `useParticipantDetails(dataHandler, participantId)` | Profile, burden summary and activities of one participant |
| `useDatasetInfo(dataHandler)` | Data source mode, years, contact fields, category values |
| `useViewSettings(view)` / `useViewHandlerState(viewHandler)` | The settings / the open views (no request) |

The chart hooks take 1–10 views (`MAX_CHART_VIEWS`) so views can be compared.

Every data hook returns `{ state, retry }`:

- `state.status` is `'loading'` (with `previousData`), `'ready'` (with `data`) or `'error'` (with `error`, a message
  for the user, and `kind`).
- `getLatestData(state)` gives the data to show: the current data, or the previous data while loading, or `null`.

## Things to know

- **Band columns are per year.** A band column has one value per selected year. Read it with
  `row.cells[bandCellKey(column.key, year)]`, for each year in `page.bandYears[column.key]`.
- **Go back to page 1 when the settings change.** A page number from before a filter change may not exist any more
  (the server then returns an empty page). `ParticipantTable` keeps the page number together with the settings.
- **Don't filter, sort or compute in components.** If you need data the hooks don't give you, add a hook (below).
- **Don't store participant data** (localStorage etc.). Only view settings are saved.

## Adding a new kind of data

1. Add the call to `ApiConsumer`/`HttpApi` if the endpoint is new, passing its response schema from
   `shared/api/generated/api.zod.ts` to `call()`, which validates every response. Export any new types from `api/apiTypes.ts`.
2. Put the method on a handler (`DataHandler`, `ChartHandler`) and map API types to UI types in `api/mappers/`.
3. Wrap it in a hook in `react/useView.ts` with `useDataRequest`:

```ts
export function useThing(dataHandler: DataHandler, id: string): LoadResult<Thing> {
  return useDataRequest({
    key: requestKey(['thing', id]),                       // same key = same request, nothing is sent
    run: (signal) => dataHandler.getThing(id, { signal }), // pass the signal so it can be aborted
  })
}
```

For requests built from a view, use `buildRequest` so the key is the API body itself (see `useViewPage`).

## Where things live

| Folder | What |
| --- | --- |
| `api/` | HTTP client, `ApiConsumer`, errors, mappers (UI types ↔ API types) |
| `views/` | `View`, `ViewHandler`, saved views |
| `participants/`, `charts/` | `DataHandler`, `ChartHandler` |
| `react/` | The hooks |
| `pipeline/` | Input validation only (formulas, filters, bands) |
| `types/` | UI types |
