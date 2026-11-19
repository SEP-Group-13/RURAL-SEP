import { useLoaderData } from "react-router"
import type { Route } from "./+types/participant-details"
import ParticipantActivityTable from "~/components/ParticipantDetails/ParticipantActivityTable"
import ParticipantBurdenTable from "~/components/ParticipantDetails/ParticipantBurdenTable"
import ParticipantSummary from "~/components/ParticipantDetails/ParticipantSummary"
import { api } from "~/data"

export function clientLoader({ params }: Route.ClientLoaderArgs) {
    const id = params.participantId
    if (!id) {
        throw new Error("Missing participant ID.")
    }

    return api.getParticipant(id)
}

export default function ParticipantDetailsPage() {
    const participant = useLoaderData<typeof clientLoader>()

    return (
        <div className="flex-row p-4">
            <div className="grid grid-cols-[1fr_3fr] gap-5 min-h-fit">
                <ParticipantSummary participant={participant} />
                <ParticipantBurdenTable
                    activities={participant.activities}
                    timeByExamElement={participant.timeByExamElement}
                    yearlyTotals={participant.yearlyTotals}
                />
            </div>
            <ParticipantActivityTable activities={participant.activities} />
        </div>
    )
}
