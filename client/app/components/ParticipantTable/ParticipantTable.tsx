import { useState } from "react";
import { useViewPage } from "~/data/hooks";
import type { Column, ParticipantRecord } from "~/data/types";
import type { View } from "~/data/viewHandler";

// Renders whatever columns the view defines, one page at a time
export default function ParticipantTable({ view }: { view: View }) {
  const [page, setPage] = useState(1);
  const { data, error, loading } = useViewPage(view, page);

  const gridTemplateColumns = view.columns.map((c) => c.width).join(" ");
  const pageCount = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  if (error) return <p>Could not load participants: {error.message}</p>;

  return (
    <div>
      <div className={`overflow-x-auto ${loading ? "opacity-60" : ""}`}>
        <div className="min-w-fit">
          <div className="grid gap-2 px-3 py-2 font-semibold bg-sidebar-surface rounded-t" style={{ gridTemplateColumns }}>
            {view.columns.map((c) => <span key={c.id} className="truncate">{c.label}</span>)}
          </div>
          {data?.items.map((r) => (
            <ParticipantRow key={r.participant_identifier} row={r} columns={view.columns} gridTemplateColumns={gridTemplateColumns} />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3">
        <button
          className="px-2 py-1 rounded bg-sidebar-surface cursor-pointer disabled:opacity-50"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <span>Page {page} of {pageCount} · {data?.total ?? 0} participants</span>
        <button
          className="px-2 py-1 rounded bg-sidebar-surface cursor-pointer disabled:opacity-50"
          disabled={page >= pageCount}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function ParticipantRow({ row, columns, gridTemplateColumns }: {
  row: ParticipantRecord;
  columns: Column[];
  gridTemplateColumns: string;
}) {
  return (
    <div className="grid gap-2 px-3 py-2 border-b border-sidebar-surface" style={{ gridTemplateColumns }}>
      {columns.map((col) => {
        const v = row[col.id];
        return <span key={col.id} className="truncate">{v == null ? "—" : col.format ? col.format(v) : v}</span>;
      })}
    </div>
  );
}
