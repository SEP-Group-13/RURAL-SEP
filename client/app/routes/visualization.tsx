import { useMemo } from "react";
import BarChart from "~/components/charts/BarChart";
import { useViewAll } from "~/data/hooks";
import { allParticipantsView } from "~/data/views";

// TEMPORARY, add settings when pushed to repo
const statuses = ["Active", "Completed", "Dropped Out"];

export default function VisualizationRoute() {
  const { data, error } = useViewAll(allParticipantsView);
  const counts = useMemo(
    () => statuses.map((s) => (data ?? []).filter((r) => r.final_study_status === s).length),
    [data],
  );

  if (error) return <p className="p-4">Could not load participants: {error.message}</p>;
  if (!data) return <p className="p-4">Loading…</p>;

  return (
    <div className="p-4 max-w-3xl">
      <BarChart labels={statuses} data={counts} label="Participants by status" />
    </div>
  );
}
