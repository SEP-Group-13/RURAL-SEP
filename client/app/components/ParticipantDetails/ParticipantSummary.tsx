import type { ParticipantDetails } from "~/data"

export default function ParticipantSummary({ participant }: { participant: ParticipantDetails }) {
    const details = [
        { label: "Participant ID", value: participant.participantId },
        { label: "Name", value: participant.name },
        { label: "Email", value: participant.email },
        { label: "Phone", value: participant.phone },
        { label: "Age", value: participant.age },
        { label: "Sex", value: participant.sex },
        { label: "Race", value: participant.race },
        { label: "County", value: participant.county },
        { label: "Study status", value: participant.studyStatus },
    ]

    return (
        <section className="flex-row p-4 rounded bg-sidebar-surface">
            <h1 className="text-xl font-semibold mb-3">Personal Summary</h1>

            <dl className="grid grid-cols-[1fr_max-content] gap-y-2">
                {details.map((detail) => (
                    <div key={detail.label} className="contents">
                        <dt>{detail.label}</dt>
                        <dd className="text-right">{detail.value ?? "-"}</dd>
                    </div>
                ))}
            </dl>
        </section>
    )
}
