export interface YearlyTotals {
  year: number

  timeMinutes: number

  radiationMsv: number

  emailsSent: number

  smsSent: number

  coreExamCompleted: number

  additionalStudies: number
}

export type YearlyMetric = Exclude<keyof YearlyTotals, 'year'>

export interface Participant {
  participantId: string
  name: string | null
  email: string | null
  phone: string | null
  age: number | null
  sex: string | null
  race: string | null
  county: string | null
  state: string | null
  studyStatus: string | null
  yearlyTotals: YearlyTotals[]
}

export type ParticipantField = Exclude<keyof Participant, 'yearlyTotals'>

export type ExamType = 'core' | 'additional'

export type ActivityStatus = 'completed' | 'notCollected'

export interface Activity {
  activityId: string
  examElement: string

  startTime: string

  durationMinutes: number | null

  radiationMsv: number | null
  examType: ExamType

  studyName: string | null
  location: string
  status: ActivityStatus
}

export interface ExamElementTime {
  year: number
  examElement: string
  minutes: number
}

export interface ParticipantDetails extends Participant {
  timeByExamElement: ExamElementTime[]
  activities: Activity[]
}

export type ContactField = 'name' | 'email' | 'phone'
