import type { Activity, ExamElementTime, YearlyTotals } from "~/data"

interface BurdenRow {
    key: string
    category: string
    measure: string
    values: number[]
    total: number
    bold?: boolean
    showYearlyValues?: boolean
}

interface BurdenColumn {
    key: string
    label: string
    width: string
}

interface ParticipantBurdenTableProps {
    activities: Activity[]
    timeByExamElement: ExamElementTime[]
    yearlyTotals: YearlyTotals[]
}

export default function ParticipantBurdenTable({
    activities,
    timeByExamElement,
    yearlyTotals,
}: ParticipantBurdenTableProps) {
    const years = collectYears(activities, timeByExamElement, yearlyTotals)
    const columns = buildColumns(years)
    const gridTemplateColumns = columns.map((column) => column.width).join(" ")
    const burdenRows = [
        ...buildSummaryRows(years, yearlyTotals),
        ...buildActivityRows(years, activities, timeByExamElement),
    ]

    return (
        <section className="p-0 mt-4 rounded">
            <h1 className="text-xl font-semibold mb-3">Burden</h1>
            <div className="h-80 overflow-x-auto overflow-y-auto">
                <div className="min-w-fit text-sm">
                    <div className="sticky top-0 z-10 grid gap-1 px-2 py-1.5 font-semibold bg-sidebar-surface rounded-t" style={{ gridTemplateColumns }}>
                        {columns.map((column) => (
                            <BurdenHeaderCell key={column.key} column={column} />
                        ))}
                    </div>
                    {(years.length === 0 || burdenRows.length === 0) && (
                        <p className="px-2 py-1.5">No burden data available for this participant.</p>
                    )}
                    {years.length > 0 && burdenRows.map((row) => (
                        <BurdenTableRow
                            key={row.key}
                            row={row}
                            years={years}
                            gridTemplateColumns={gridTemplateColumns}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}

function collectYears(
    activities: Activity[],
    timeByExamElement: ExamElementTime[],
    yearlyTotals: YearlyTotals[],
): number[] {
    const yearsSet = new Set<number>()
    for (const yearlyTotal of yearlyTotals) {
        yearsSet.add(yearlyTotal.year)
    }
    for (const entry of timeByExamElement) {
        yearsSet.add(entry.year)
    }
    for (const activity of activities) {
        yearsSet.add(Number(activity.startTime.slice(0, 4)))
    }
    return Array.from(yearsSet).sort((firstYear, secondYear) => firstYear - secondYear)
}

function buildColumns(years: number[]): BurdenColumn[] {
    return [
        { key: "activity", label: "Burden", width: "minmax(8rem,1.2fr)" },
        { key: "burden", label: "Type", width: "minmax(7rem,1fr)" },
        ...years.map((year) => ({key: `year-${year}`, label: String(year), width: "minmax(5rem,0.8fr)",})),
        { key: "total", label: "Total", width: "minmax(5rem,0.8fr)" },
    ]
}

function buildSummaryRows(years: number[], yearlyTotals: YearlyTotals[]): BurdenRow[] {
    const yearlyTotalByYear = new Map(
        yearlyTotals.map((yearlyTotal) => [yearlyTotal.year, yearlyTotal]),
    )
    const radiationByYear = years.map((year) => yearlyTotalByYear.get(year)?.radiationMsv ?? 0)
    const contactFrequencyByYear = years.map((year) => {
        const yearlyTotal = yearlyTotalByYear.get(year)
        return (yearlyTotal?.emailsSent ?? 0) + (yearlyTotal?.smsSent ?? 0)
    })
    const timeByYear = years.map((year) => yearlyTotalByYear.get(year)?.timeMinutes ?? 0)

    return [
        {
            key: "participation-burden",
            category: "Participation Burden",
            measure: "Core exam + Additional",
            values: [],
            total: sum(
                yearlyTotals.map(
                    (yearlyTotal) => yearlyTotal.coreExamCompleted + yearlyTotal.additionalStudies,
                ),
            ),
            bold: true,
            showYearlyValues: false,
        },
        {
            key: "radiation-burden",
            category: "Radiation Burden",
            measure: "Radiation (mSv)",
            values: radiationByYear,
            total: sum(radiationByYear),
            bold: true,
        },
        {
            key: "contact-frequency",
            category: "Contact Frequency",
            measure: "Emails + SMS",
            values: contactFrequencyByYear,
            total: sum(contactFrequencyByYear),
            bold: true,
        },
        {
            key: "time-burden",
            category: "Time Burden",
            measure: "Time (min)",
            values: timeByYear,
            total: sum(timeByYear),
            bold: true,
        },
    ]
}

function buildActivityRows(
    years: number[],
    activities: Activity[],
    timeByExamElement: ExamElementTime[],
): BurdenRow[] {
    const examElementsSet = new Set<string>()
    for (const entry of timeByExamElement) {
        examElementsSet.add(entry.examElement)
    }
    for (const activity of activities) {
        examElementsSet.add(activity.examElement)
    }
    const examElements = Array.from(examElementsSet).sort((first, second) =>
        first.localeCompare(second),
    )

    return examElements.map((examElement) => {
        const entries = timeByExamElement.filter((entry) => entry.examElement === examElement)
        const timeForYear = (year: number) =>
            sum(entries.filter((entry) => entry.year === year).map((entry) => entry.minutes))

        return {
            key: examElement,
            category: examElement,
            measure: "Time (min)",
            values: years.map(timeForYear),
            total: sum(entries.map((entry) => entry.minutes)),
        }
    })
}

function BurdenHeaderCell({ column }: { column: BurdenColumn }) {
    return <span>{column.label}</span>
}

function BurdenTableRow({
    row,
    years,
    gridTemplateColumns,
}: {
    row: BurdenRow
    years: number[]
    gridTemplateColumns: string
}) {
    return (
        <div className={`grid gap-x-1 px-2 py-1.5 border-b border-sidebar-surface ${row.bold ? "font-semibold" : ""}`} style={{ gridTemplateColumns }}>
            <span>{row.category}</span>
            <span>{row.measure}</span>
            {years.map((year, index) => (
                <span key={year}>{row.showYearlyValues === false ? "" : (row.values[index] ?? 0)}</span>
            ))}
            <span>{row.total}</span>
        </div>
    )
}

function sum(values: number[]): number {
    let sum = 0
    for (const value of values) {
        sum += value
    }
    return sum
}
