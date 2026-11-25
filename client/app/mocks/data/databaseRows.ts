export interface ParticipantTableRow {
  participant_identifier: string
  enrollment_date: string
  final_study_status: string
  dropout_date: string | null
  dropout_reason: string | null
  age: number
  education_level: string
  employment_status: string
  gender_sex: string
}

export interface InpersonBurdenEventRow {
  event_id: number
  participant_identifier: string
  procedure_name: string
  location_type: string
  start_datetime: string
  end_datetime: string | null
  duration_minutes: number | null
  completion_status: 'Completed' | 'Not Completed'
}

export interface DxxJRow {
  participant_identifier: string
  radiation_msv: number
}

export interface TestDataSurveyRow {
  participant_identifier: string
  start_tm: string
  complete_tm: string
  elapsed_tm: number
  survey_id: number
  survey: string | null
  white: boolean
  county: number
  phone: string
}

export interface EmailSendRow {
  participant_identifier: string
  message_id: string
  to_email_address: string | null
}

export interface EmailDeliveryRow {
  participant_identifier: string
  message_id: string
  delivery_timestamp: string | null
}

export interface SmsSendRow {
  participant_identifier: string
  message_id: string
  phone_number: string | null
  timestamp: string
}

export interface MockDatabase {
  participant: ParticipantTableRow[]
  inperson_burden_events: InpersonBurdenEventRow[]
  dxx_j: DxxJRow[]
  test_data_surveys: TestDataSurveyRow[]
  email_send: EmailSendRow[]
  email_delivery: EmailDeliveryRow[]
  sms_send: SmsSendRow[]
}
