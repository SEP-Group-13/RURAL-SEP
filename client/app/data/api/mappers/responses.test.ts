import { describe, expect, it } from 'vitest'
import { createDefaultColumns } from '../../columns/defaultColumns'
import type { ApiActivity, ApiColumn, ApiMeta, ApiParticipant, ParticipantBurden, ParticipantPage } from '../apiTypes'
import { toDatasetInfo } from './dataset'
import { toParticipantDetails } from './participant'
import { bandCellKey, fromParticipantPage } from './rows'
import { ColumnNames } from './view'

describe('fromParticipantPage', () => {
  const names = new ColumnNames(createDefaultColumns())
  const page: ParticipantPage = {
    total: 21,
    page: 3,
    pageSize: 10,
    columns: ['Participant ID', 'Age', 'Time burden (min) band 2024', 'Time burden (min) band 2025', 'Not ours'],
    rows: [
      {
        participantId: 'P1',
        values: {
          'Participant ID': 'P1',
          Age: 52,
          'Time burden (min) band 2024': 'Low',
          'Time burden (min) band 2025': null,
          'Not ours': 'x',
        },
      },
    ],
  }

  it('keys cells by frontend column key, with per-year band cells', () => {
    const result = fromParticipantPage(page, names)

    expect(result.rows).toEqual([
      {
        participantId: 'P1',
        cells: {
          participantId: 'P1',
          age: 52,
          [bandCellKey('timeBand', 2024)]: 'Low',
          [bandCellKey('timeBand', 2025)]: null,
        },
      },
    ])
    expect(result.bandYears).toEqual({ timeBand: [2024, 2025] })
  })

  it('maps paging and computes the page count', () => {
    const result = fromParticipantPage(page, names)
    expect(result).toMatchObject({ pageNumber: 3, pageSize: 10, totalRows: 21, totalPages: 3 })
  })

  it('reports one page when there are no rows', () => {
    const result = fromParticipantPage({ ...page, total: 0, rows: [] }, names)
    expect(result.totalPages).toBe(1)
  })

  it('treats a missing value as null', () => {
    const result = fromParticipantPage({ ...page, rows: [{ participantId: 'P2', values: {} }] }, names)
    expect(result.rows[0]?.cells.age).toBeNull()
  })
})

describe('toDatasetInfo', () => {
  const meta: ApiMeta = {
    dataSourceMode: 'external',
    contactDetails: { name: true, email: false, phone: true },
    years: [2024, 2025],
    dataRefreshedAt: '2026-11-01T08:00:00Z',
    unlinkedRecordCount: 3,
  }
  const columns: ApiColumn[] = [
    { name: 'Sex', type: 'categorical', values: ['Female', 'Male'], isDefault: true },
    { name: 'Age', type: 'numeric', isDefault: true },
    { name: 'Clinic', type: 'categorical', values: ['North'], isDefault: false },
  ]

  it('maps meta and keys category values by frontend column key', () => {
    expect(toDatasetInfo(meta, columns)).toEqual({
      refreshedAt: '2026-11-01T08:00:00Z',
      dataSourceMode: 'external',
      years: [2024, 2025],
      contactFields: ['name', 'phone'],
      categoryValues: { sex: ['Female', 'Male'], Clinic: ['North'] },
    })
  })
})

describe('toParticipantDetails', () => {
  const participant: ApiParticipant = {
    participantId: 'P1',
    age: 52,
    sex: 'Female',
    race: null,
    county: 'Story',
    state: 'IA',
    studyStatus: 'Active',
    name: null,
    email: null,
    phone: null,
  }
  const summary = (timeMinutes: number) => ({
    timeMinutes,
    timeByExamElement: [{ examElement: 'DEXA Scan', timeMinutes }],
    radiationMsv: 1.5,
    contactFrequency: 3,
    participation: 2,
    emailsSent: 2,
    smsSent: 1,
    coreExamCompleted: 1,
    additionalStudies: 1,
  })
  const burden: ParticipantBurden = {
    cumulative: summary(90),
    perYear: [
      { year: 2024, burden: summary(30) },
      { year: 2025, burden: summary(60) },
    ],
  }
  const activities: ApiActivity[] = [
    {
      date: '2025-03-01T09:00:00Z',
      examElement: 'DEXA Scan',
      examType: 'auxiliary',
      additionalStudy: 'Bone health',
      type: 'procedure',
      location: null,
      durationMinutes: null,
      radiationMsv: null,
      status: 'notCompleted',
    },
  ]

  it('maps the participant, yearly totals and time per exam element', () => {
    const details = toParticipantDetails(participant, burden, activities)

    expect(details).toMatchObject({ participantId: 'P1', age: 52, county: 'Story', name: null })
    expect(details.yearlyTotals).toEqual([
      { year: 2024, timeMinutes: 30, radiationMsv: 1.5, emailsSent: 2, smsSent: 1, coreExamCompleted: 1, additionalStudies: 1 },
      { year: 2025, timeMinutes: 60, radiationMsv: 1.5, emailsSent: 2, smsSent: 1, coreExamCompleted: 1, additionalStudies: 1 },
    ])
    expect(details.timeByExamElement).toEqual([
      { year: 2024, examElement: 'DEXA Scan', minutes: 30 },
      { year: 2025, examElement: 'DEXA Scan', minutes: 60 },
    ])
  })

  it('converts activities to the frontend shape', () => {
    const [activity] = toParticipantDetails(participant, burden, activities).activities

    expect(activity).toEqual({
      activityId: '2025-03-01T09:00:00Z#0',
      examElement: 'DEXA Scan',
      startTime: '2025-03-01T09:00:00Z',
      durationMinutes: null,
      radiationMsv: null,
      examType: 'additional',
      studyName: 'Bone health',
      location: '',
      status: 'notCollected',
    })
  })
})
