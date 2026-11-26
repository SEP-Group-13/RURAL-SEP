import { useParams } from "react-router"
import Button from "~/components/Button/Button"
import ParticipantActivityTable from "~/components/ParticipantDetails/ParticipantActivityTable"
import ParticipantBurdenTable from "~/components/ParticipantDetails/ParticipantBurdenTable"
import ParticipantSummary from "~/components/ParticipantDetails/ParticipantSummary"
import { dataHandler, getLatestData, useParticipantDetails } from "~/data"

export default function ParticipantDetailsPage() {
    const { participantId } = useParams()

    return <ParticipantDetails participantId={participantId!} />
}

function ParticipantDetails({ participantId }: { participantId: string }) {
    const { state, retry } = useParticipantDetails(dataHandler, participantId)
    const latestParticipant = getLatestData(state)
    const participant =
        latestParticipant?.participantId === participantId
            ? latestParticipant
            : null

    if (state.status === "error") {
        return (
            <div className="flex items-center gap-3 p-4">
                <p>404: {state.error}</p>
                <Button onClick={retry}>Retry</Button>
            </div>
        )
    }

    if (participant === null) {
        return <p className="p-4">Loading participant…</p>
    }

    return (
        <div className="flex-row p-4" key={participantId}>
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
