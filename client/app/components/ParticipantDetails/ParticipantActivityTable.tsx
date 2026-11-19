import { ArrowDown, ArrowUp } from "lucide-react"
import { useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { Activity } from "~/data"

const ACTIVITY_COLUMNS = [
    {
        key: "date",
        label: "Date",
        width: "minmax(10rem,1.2fr)",
        sortValue: (activity: Activity) => activity.startTime,
        render: (activity: Activity) => new Date(activity.startTime).toLocaleDateString(),
    },
    {
        key: "activity",
        label: "Activity",
        width: "minmax(9rem,1fr)",
        sortValue: (activity: Activity) => activity.examElement,
        render: (activity: Activity) => activity.examElement,
    },
    {
        key: "type",
        label: "Type",
        width: "minmax(7rem,0.8fr)",
        sortValue: (activity: Activity) => activity.examType,
        render: (activity: Activity) => (activity.examType === "core" ? "Core" : "Additional"),
    },
    {
        key: "studyName",
        label: "Study name",
        width: "minmax(10rem,1.2fr)",
        sortValue: (activity: Activity) => activity.studyName,
        render: (activity: Activity) => activity.studyName ?? "—",
    },
    {
        key: "location",
        label: "Location",
        width: "minmax(7rem,0.8fr)",
        sortValue: (activity: Activity) => activity.location,
        render: (activity: Activity) => activity.location,
    },
    {
        key: "duration",
        label: "Duration (min)",
        width: "minmax(6rem,0.7fr)",
        sortValue: (activity: Activity) => activity.durationMinutes,
        render: (activity: Activity) => activity.durationMinutes ?? "—",
    },
    {
        key: "radiation",
        label: "Radiation (mSv)",
        width: "minmax(6rem,0.7fr)",
        sortValue: (activity: Activity) => activity.radiationMsv,
        render: (activity: Activity) => activity.radiationMsv ?? "—",
    },
    {
        key: "status",
        label: "Status",
        width: "minmax(8rem,0.9fr)",
        sortValue: (activity: Activity) => activity.status,
        render: (activity: Activity) => (activity.status === "completed" ? "Completed" : "Not collected"),
    },
] as const

type ActivitySortColumn = (typeof ACTIVITY_COLUMNS)[number]["key"]
type SortDirection = "asc" | "desc"
type ActivitySort = { columnKey: ActivitySortColumn; direction: SortDirection }

export default function ParticipantActivityTable({ activities }: { activities: Activity[] }) {
    const [sort, setSort] = useState<ActivitySort | null>(null)
    const gridTemplateColumns = ACTIVITY_COLUMNS.map((column) => column.width).join(" ")
    const sortedActivities = getSortedActivities(activities, sort)

    return (
        <section className="w-full mt-5 p-0 rounded">
            <h2 className="text-xl font-semibold mb-3">Activities</h2>
            <div className="overflow-x-auto">
                <div className="min-w-fit">
                    <div className="grid gap-2 px-3 py-2 font-semibold bg-sidebar-surface rounded-t" style={{ gridTemplateColumns }}>
                        {ACTIVITY_COLUMNS.map((column) => (
                            <ActivityHeaderCell
                                key={column.key}
                                column={column}
                                sort={sort}
                                setSort={setSort}
                            />
                        ))}
                    </div>
                    {sortedActivities.length === 0 && (
                        <p className="px-3 py-2">No activities recorded for this participant.</p>
                    )}
                    {sortedActivities.map((activity) => (
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

function ActivityHeaderCell({
    column,
    sort,
    setSort,
}: {
    column: (typeof ACTIVITY_COLUMNS)[number]
    sort: ActivitySort | null
    setSort: Dispatch<SetStateAction<ActivitySort | null>>
}) {
    const direction = sort?.columnKey === column.key ? sort.direction : null

    const changeSort = () => {
        setSort((current) => {
            if (current?.columnKey !== column.key) {
                return { columnKey: column.key, direction: "asc" }
            }
            if (current.direction === "asc") {
                return { columnKey: column.key, direction: "desc" }
            }
            return null
        })
    }

    return (
        <button type="button" onClick={changeSort} title={`Sort by ${column.label}`} className="flex items-center gap-1 min-w-0 text-left cursor-pointer">
            <span className="truncate">{column.label}</span>
            {direction === "asc" && <ArrowUp className="size-[1em] shrink-0" />}
            {direction === "desc" && <ArrowDown className="size-[1em] shrink-0" />}
        </button>
    )
}

function getSortedActivities(activities: Activity[], sort: ActivitySort | null): Activity[] {
    if (sort === null) {
        return activities
    }

    return [...activities].sort((first, second) => {
        const firstValue = getSortValue(first, sort.columnKey)
        const secondValue = getSortValue(second, sort.columnKey)

        if (firstValue === null) return secondValue === null ? 0 : 1
        if (secondValue === null) return -1

        const comparison =
            typeof firstValue === "number" && typeof secondValue === "number"
                ? firstValue - secondValue
                : String(firstValue).localeCompare(String(secondValue), undefined, { numeric: true })

        return sort.direction === "asc" ? comparison : -comparison
    })
}

function getSortValue(activity: Activity, column: ActivitySortColumn): string | number | null {
    return ACTIVITY_COLUMNS.find((columnDefinition) => columnDefinition.key === column)?.sortValue(activity) ?? null
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
