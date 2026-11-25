import type { Activity } from "~/data"

const ACTIVITY_COLUMNS = [
    {
        key: "date",
        label: "Date",
        width: "minmax(10rem,1.2fr)",
        render: (activity: Activity) => new Date(activity.startTime).toLocaleDateString(),
    },
    {
        key: "activity",
        label: "Activity",
        width: "minmax(9rem,1fr)",
        render: (activity: Activity) => activity.examElement,
    },
    {
        key: "type",
        label: "Type",
        width: "minmax(7rem,0.8fr)",
        render: (activity: Activity) => (activity.examType === "core" ? "Core" : "Additional"),
    },
    {
        key: "studyName",
        label: "Study name",
        width: "minmax(10rem,1.2fr)",
        render: (activity: Activity) => activity.studyName ?? "—",
    },
    {
        key: "location",
        label: "Location",
        width: "minmax(7rem,0.8fr)",
        render: (activity: Activity) => activity.location,
    },
    {
        key: "duration",
        label: "Duration (min)",
        width: "minmax(6rem,0.7fr)",
        render: (activity: Activity) => activity.durationMinutes ?? "—",
    },
    {
        key: "radiation",
        label: "Radiation (mSv)",
        width: "minmax(6rem,0.7fr)",
        render: (activity: Activity) => activity.radiationMsv ?? "—",
    },
    {
        key: "status",
        label: "Status",
        width: "minmax(8rem,0.9fr)",
        render: (activity: Activity) => (activity.status === "completed" ? "Completed" : "Not collected"),
    },
] as const

export default function ParticipantActivityTable({ activities }: { activities: Activity[] }) {
    const gridTemplateColumns = ACTIVITY_COLUMNS.map((column) => column.width).join(" ")

    return (
        <section className="w-full mt-5 p-0 rounded">
            <h2 className="text-xl font-semibold mb-3">Activities</h2>
            <div className="overflow-x-auto">
                <div className="min-w-fit">
                    <div className="grid gap-2 px-3 py-2 font-semibold bg-sidebar-surface rounded-t" style={{ gridTemplateColumns }}>
                        {ACTIVITY_COLUMNS.map((column) => (
                            <span key={column.key}>{column.label}</span>
                        ))}
                    </div>
                    {activities.length === 0 && (
                        <p className="px-3 py-2">No activities recorded for this participant.</p>
                    )}
                    {activities.map((activity) => (
                        <ActivityRow
                            key={activity.activityId}
                            activity={activity}
                            gridTemplateColumns={gridTemplateColumns}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}

function ActivityRow({
    activity,
    gridTemplateColumns,
}: {
    activity: Activity
    gridTemplateColumns: string
}) {
    return (
        <div className="grid gap-2 px-3 py-2 border-b border-sidebar-surface" style={{ gridTemplateColumns }}>
            {ACTIVITY_COLUMNS.map((column) => (
                <span key={column.key}>{column.render(activity)}</span>
            ))}
        </div>
    )
}
