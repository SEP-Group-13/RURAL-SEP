export type BodyMeasureRow = { participant_identifier: string; bmxbmi: number };

export type InpersonEventRow = {
  participant_identifier: string;
  procedure_name: "Body Measures" | "Blood Pressure" | "DEXA Scan" | "Liver Ultrasound";
  duration_minutes: number | null;
  completion_status: "Completed" | "Not Completed";
};

export type SurveyResultRow = { participant_identifier: string; duration_minutes: number };

export const bodyMeasures: BodyMeasureRow[] = Object.entries({
  P0001: 17.5, P0002: 15.7, P0003: 31.7, P0004: 21.5, P0005: 18.1, P0006: 23.7, P0007: 38.9, P0008: 0, P0009: 21.3, P0010: 19.7,
  P0011: 23.5, P0012: 39.9, P0013: 22.5, P0014: 30.7, P0015: 24.5, P0016: 22, P0017: 26, P0018: 0, P0019: 35.9, P0020: 23.8,
}).map(([participant_identifier, bmxbmi]) => ({ participant_identifier, bmxbmi }));

const procedureMinutes: Record<InpersonEventRow["procedure_name"], Record<string, number | null>> = {
  "Body Measures": {
    P0001: 42.5, P0002: 39.3, P0003: 43.2, P0004: 47.6, P0005: 38.8, P0006: null, P0007: 47.9, P0008: 43.8, P0009: 37.7, P0010: 42.7,
    P0011: 37.7, P0012: 37.7, P0013: 41.2, P0014: 30.4, P0015: 31.4, P0016: 37.2, P0017: 34.9, P0018: 41.6, P0019: 35.5, P0020: 32.9,
  },
  "Blood Pressure": {
    P0001: 36.3, P0002: 34.7, P0003: 38.7, P0004: 42.5, P0005: 30.5, P0006: 37.9, P0007: 36.9, P0008: 40.0, P0009: 38.3, P0010: 34.7,
    P0011: 36.3, P0012: 34.5, P0013: 41.5, P0014: 37.6, P0015: 44.6, P0016: 37.3, P0017: 34.8, P0018: 31.8, P0019: 30.7, P0020: 31.6,
  },
  "DEXA Scan": { P0004: null, P0005: 21.9, P0009: 25.2, P0010: 21.8, P0012: 23.3, P0015: 22.7, P0016: 28.1, P0017: 24.0 },
  "Liver Ultrasound": {
    P0003: null, P0004: 52.4, P0005: 53.4, P0006: 45.8, P0007: 50.3, P0009: 40.0, P0010: 57.2, P0011: 47.4, P0012: 50.3, P0013: 48.5,
    P0014: null, P0015: 40.0, P0016: 49.9, P0017: 49.5, P0019: 47.7, P0020: 58.6,
  },
};

export const inpersonEvents: InpersonEventRow[] = Object.entries(procedureMinutes).flatMap(([procedure_name, byParticipant]) =>
  Object.entries(byParticipant).map(([participant_identifier, duration_minutes]) => ({
    participant_identifier,
    procedure_name: procedure_name as InpersonEventRow["procedure_name"],
    duration_minutes,
    completion_status: duration_minutes === null ? "Not Completed" : "Completed",
  })),
);

const surveyMinutes: Record<string, number[]> = {
  P0001: [2, 3, 4, 4], P0002: [5, 2, 15, 7], P0003: [5, 10], P0004: [11, 5, 15, 5, 13], P0005: [5, 11, 12, 11],
  P0006: [9, 2, 6, 4, 9], P0007: [11, 6, 6, 3, 10], P0008: [8, 14, 9, 5, 3], P0009: [4, 12, 6, 3], P0010: [8, 3, 9],
  P0011: [5, 11, 4, 2], P0012: [8, 11, 3], P0013: [6, 5, 8, 8], P0014: [15, 11, 6, 3, 3], P0015: [14, 4, 10, 7],
  P0016: [3, 6, 15, 11], P0017: [10, 14, 10, 11, 12], P0018: [14, 5, 10, 10, 10], P0019: [8, 13, 8, 4], P0020: [5, 15, 15, 3],
};

export const surveyResults: SurveyResultRow[] = Object.entries(surveyMinutes).flatMap(([participant_identifier, durations]) =>
  durations.map((duration_minutes) => ({ participant_identifier, duration_minutes })),
);
