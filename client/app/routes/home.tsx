import { useState } from "react";
import type { Route } from "./+types/home";
import ParticipantTable from "~/components/ParticipantTable/ParticipantTable";
import { views, type ViewName } from "~/data/views";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "RURAL Study Dashboard" },
    { name: "description", content: "Welcome to dashboard!" },
  ];
}

export default function HomeRoute() {
  const [viewName, setViewName] = useState<ViewName>("All participants");

  return (
    <div className="p-4">
      <select
        value={viewName}
        onChange={(e) => setViewName(e.target.value as ViewName)}
        className="mb-3 bg-sidebar-surface rounded px-2 py-1"
      >
        {Object.keys(views).map((name) => <option key={name}>{name}</option>)}
      </select>
      {/* key resets the page to 1 when the view changes */}
      <ParticipantTable key={viewName} view={views[viewName]} />
    </div>
  );
}
