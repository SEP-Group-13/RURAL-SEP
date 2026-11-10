import type { Activity, ExamElementTime, ExamType, ParticipantDetails, YearlyTotals } from '../types/participant'
import type { InpersonBurdenEventRow, MockDatabase, ParticipantTableRow, TestDataSurveyRow } from './databaseRows'

interface ExamElementInfo {
  examType: ExamType
  studyName: string | null
}

const EXAM_ELEMENTS: Record<string, ExamElementInfo> = {
  'Body Measures': { examType: 'core', studyName: null },
  'Blood Pressure': { examType: 'core', studyName: null },
  'DEXA Scan': { examType: 'additional', studyName: 'Bone density study' },
  'Liver Ultrasound': { examType: 'additional', studyName: 'Liver study' },
}

const SURVEY_ELEMENT: ExamElementInfo = { examType: 'core', studyName: null }

export function buildAllParticipantDetails(database: MockDatabase): ParticipantDetails[] {
  return database.participant.map((participant) => buildParticipantDetails(participant, database))
}

function buildParticipantDetails(participant: ParticipantTableRow, database: MockDatabase): ParticipantDetails {
  const participantId = participant.participant_identifier
  const surveys = database.test_data_surveys.filter((row) => row.participant_identifier === participantId)
  const emails = database.email_send.filter((row) => row.participant_identifier === participantId)
  const smsMessages = database.sms_send.filter((row) => row.participant_identifier === participantId)
  const firstSurvey = surveys[0]

  const activities = [
    ...database.inperson_burden_events
      .filter((row) => row.participant_identifier === participantId)
      .map((row) => toInpersonActivity(row, database)),
    ...surveys.map(toSurveyActivity),
  ].sort((a, b) => a.startTime.localeCompare(b.startTime))

  const emailYears = emails.flatMap((email) => {
    const delivery = database.email_delivery.find((row) => row.message_id === email.message_id)
    return delivery?.delivery_timestamp ? [yearOf(delivery.delivery_timestamp)] : []
  })
  const smsYears = smsMessages.map((sms) => yearOf(sms.timestamp))

  return {
    participantId,
    name: null,
    email: emails[0]?.to_email_address ?? null,
    phone: smsMessages[0]?.phone_number ?? firstSurvey?.phone ?? null,
    age: participant.age,
    sex: participant.gender_sex,
    race: firstSurvey === undefined ? null : firstSurvey.white ? 'White' : 'Other',
    county: firstSurvey === undefined ? null : `County ${firstSurvey.county}`,
    state: null,
    studyStatus: participant.final_study_status,
    yearlyTotals: buildYearlyTotals(activities, emailYears, smsYears),
    timeByExamElement: buildTimeByExamElement(activities),
    activities,
  }
}

function toInpersonActivity(row: InpersonBurdenEventRow, database: MockDatabase): Activity {
  const element = EXAM_ELEMENTS[row.procedure_name] ?? SURVEY_ELEMENT
  const completed = row.completion_status === 'Completed'
  const dexa = database.dxx_j.find((dxx) => dxx.participant_identifier === row.participant_identifier)
  const radiationMsv = row.procedure_name === 'DEXA Scan' ? (dexa?.radiation_msv ?? 0) : 0

  return {
    activityId: `E${row.event_id}`,
    examElement: row.procedure_name,
    startTime: toUtc(row.start_datetime),
    durationMinutes: completed ? row.duration_minutes : null,
    radiationMsv: completed ? radiationMsv : null,
    examType: element.examType,
    studyName: element.studyName,
    location: row.location_type,
    status: completed ? 'completed' : 'notCollected',
  }
}

function toSurveyActivity(row: TestDataSurveyRow): Activity {
  return {
    activityId: `S${row.participant_identifier}-${row.survey_id}`,
    examElement: row.survey ?? 'Survey',
    startTime: toUtc(row.start_tm),
    durationMinutes: round(row.elapsed_tm / 60, 1),
    radiationMsv: 0,
    examType: SURVEY_ELEMENT.examType,
    studyName: SURVEY_ELEMENT.studyName,
    location: 'On-site',
    status: 'completed',
  }
}

function buildYearlyTotals(activities: Activity[], emailYears: number[], smsYears: number[]): YearlyTotals[] {
  const years = new Set([...activities.map((activity) => yearOf(activity.startTime)), ...emailYears, ...smsYears])

  return [...years]
    .sort((a, b) => a - b)
    .map((year) => {
      const done = activities.filter((a) => a.status === 'completed' && yearOf(a.startTime) === year)
      const additionalStudies = new Set(done.filter((a) => a.examType === 'additional').map((a) => a.studyName))

      return {
        year,
        timeMinutes: round(sum(done.map((a) => a.durationMinutes ?? 0)), 1),
        radiationMsv: round(sum(done.map((a) => a.radiationMsv ?? 0)), 2),
        emailsSent: emailYears.filter((y) => y === year).length,
        smsSent: smsYears.filter((y) => y === year).length,
        coreExamCompleted: done.some((a) => a.examType === 'core') ? 1 : 0,
        additionalStudies: additionalStudies.size,
      }
    })
}

function buildTimeByExamElement(activities: Activity[]): ExamElementTime[] {
  const totals = new Map<string, ExamElementTime>()

  for (const activity of activities) {
    if (activity.status !== 'completed') {
      continue
    }
    const year = yearOf(activity.startTime)
    const key = `${year}|${activity.examElement}`
    const total = totals.get(key) ?? { year, examElement: activity.examElement, minutes: 0 }
    total.minutes = round(total.minutes + (activity.durationMinutes ?? 0), 1)
    totals.set(key, total)
  }

  return [...totals.values()].sort((a, b) => a.year - b.year || a.examElement.localeCompare(b.examElement))
}

function toUtc(timestamp: string): string {
  return timestamp.endsWith('Z') ? timestamp : `${timestamp}Z`
}

function yearOf(timestamp: string): number {
  return Number(timestamp.slice(0, 4))
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}
