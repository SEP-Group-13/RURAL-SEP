import type { Column, ColumnDataType, ColumnGroup } from '../types/column'
import type { ParticipantField, YearlyMetric } from '../types/participant'
import { getPresetBands } from './presetBands'

export function createDefaultColumns(): Column[] {
  return [
    fieldColumn('participantId', 'Participant ID', 'text', 'Participant', true),
    fieldColumn('age', 'Age', 'number', 'Participant', true),
    fieldColumn('sex', 'Sex', 'category', 'Participant', true),
    fieldColumn('race', 'Race', 'category', 'Participant', true),
    fieldColumn('county', 'County', 'category', 'Participant', true),
    fieldColumn('state', 'State', 'category', 'Participant', true),
    fieldColumn('studyStatus', 'Study status', 'category', 'Participant', true),

    yearlyColumn('timeBurden', 'timeMinutes', 'Time burden (min)', 'Burden', true),
    {
      key: 'timeBand',
      label: 'Time band',
      dataType: 'category',
      group: 'Burden',
      visible: true,
      removable: false,
      source: {
        kind: 'band',
        sourceColumnKey: 'timeBurden',
        bands: getPresetBands('time'),
        presetName: 'time',
      },
    },
    yearlyColumn('radiationBurden', 'radiationMsv', 'Radiation burden (mSv)', 'Burden', true),
    {
      key: 'radiationBand',
      label: 'Radiation band',
      dataType: 'category',
      group: 'Burden',
      visible: true,
      removable: false,
      source: {
        kind: 'band',
        sourceColumnKey: 'radiationBurden',
        bands: getPresetBands('radiation'),
        presetName: 'radiation',
      },
    },

    fieldColumn('name', 'Name', 'text', 'Contact details', false),
    fieldColumn('email', 'Email', 'text', 'Contact details', false),
    fieldColumn('phone', 'Phone', 'text', 'Contact details', false),

    yearlyColumn('coreExamCompleted', 'coreExamCompleted', 'Core exam completed', 'Activity counts', false),
    yearlyColumn('additionalStudies', 'additionalStudies', 'Additional studies', 'Activity counts', false),
    yearlyColumn('emailsSent', 'emailsSent', 'Emails sent', 'Activity counts', false),
    yearlyColumn('smsSent', 'smsSent', 'SMS sent', 'Activity counts', false),
  ]
}

function fieldColumn(
  field: ParticipantField,
  label: string,
  dataType: ColumnDataType,
  group: ColumnGroup,
  visible: boolean,
): Column {
  return {
    key: field,
    label,
    dataType,
    group,
    visible,
    removable: false,
    source: { kind: 'field', field },
  }
}

function yearlyColumn(key: string, metric: YearlyMetric, label: string, group: ColumnGroup, visible: boolean): Column {
  return {
    key,
    label,
    dataType: 'number',
    group,
    visible,
    removable: false,
    source: { kind: 'yearly', metric },
  }
}
