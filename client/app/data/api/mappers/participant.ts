import type { Activity, ExamElementTime, ParticipantDetails, YearlyTotals } from '../../types/participant'
import type { ApiActivity, ApiParticipant, ParticipantBurden } from '../apiTypes'

type BurdenSummary = ParticipantBurden['cumulative']

/**
 * TODO: remove once PR #100 (feat/openapi-activity-counts) is merged and the types are regenerated;
 * BurdenSummary then has these fields itself. Until then a missing count reads as 0.
 */
type BurdenSummaryWithCounts = BurdenSummary &
  Partial<Record<'emailsSent' | 'smsSent' | 'coreExamCompleted' | 'additionalStudies', number>>

/**
 * Combines GET /participants/{id}, /burden and /activities into the frontend's ParticipantDetails.
 */
export function toParticipantDetails(
  participant: ApiParticipant,
  burden: ParticipantBurden,
  activities: ApiActivity[],
): ParticipantDetails {
  return {
    participantId: participant.participantId,
    name: participant.name,
    email: participant.email,
    phone: participant.phone,
    age: participant.age,
    sex: participant.sex,
    race: participant.race,
    county: participant.county,
    state: participant.state,
    studyStatus: participant.studyStatus,
    yearlyTotals: burden.perYear.map(({ year, burden: summary }) => toYearlyTotals(year, summary)),
    timeByExamElement: burden.perYear.flatMap(({ year, burden: summary }) =>
      summary.timeByExamElement.map(
        (element): ExamElementTime => ({ year, examElement: element.examElement, minutes: element.timeMinutes }),
      ),
    ),
    activities: activities.map(toActivity),
  }
}

function toYearlyTotals(year: number, summary: BurdenSummaryWithCounts): YearlyTotals {
  return {
    year,
    timeMinutes: summary.timeMinutes,
    radiationMsv: summary.radiationMsv,
    emailsSent: summary.emailsSent ?? 0,
    smsSent: summary.smsSent ?? 0,
    coreExamCompleted: summary.coreExamCompleted ?? 0,
    additionalStudies: summary.additionalStudies ?? 0,
  }
}

/**
 * The spec's Activity and the frontend's differ; these conversions are provisional until one side
 * is changed to match the other (to be settled when the participant detail view is wired up):
 * - the spec has no activity ID, so one is derived from the position in the (date-ordered) list
 * - examType `auxiliary` → `additional`; status `completed` → `completed`, anything else → `notCollected`
 * - a missing exam element or location becomes an empty string
 * - the spec's `type` (procedure | survey) has no frontend counterpart and is dropped
 */
function toActivity(activity: ApiActivity, index: number): Activity {
  return {
    activityId: `${activity.date}#${index}`,
    examElement: activity.examElement ?? '',
    startTime: activity.date,
    durationMinutes: activity.durationMinutes,
    radiationMsv: activity.radiationMsv,
    examType: activity.examType === 'core' ? 'core' : 'additional',
    studyName: activity.additionalStudy,
    location: activity.location ?? '',
    status: activity.status === 'completed' ? 'completed' : 'notCollected',
  }
}
