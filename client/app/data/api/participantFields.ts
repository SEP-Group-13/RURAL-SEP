import type { Derived, Source } from "./buildRecords";
import { bodyMeasures, inpersonEvents, surveyResults } from "./placeholderDatasets";

const rowsFor = <T extends { participant_identifier: string }>(rows: T[], id: string) =>
  rows.filter((r) => r.participant_identifier === id);
const sum = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) * 10) / 10;
const num = (v: unknown) => (typeof v === "number" ? v : 0);

export const sources: Source[] = [
  (p) => {
    const m = bodyMeasures.find((r) => r.participant_identifier === p.participant_identifier);
    return { bmi: m?.bmxbmi || null };
  },

  (p) => {
    const events = rowsFor(inpersonEvents, p.participant_identifier);
    const done = events.filter((e) => e.completion_status === "Completed");
    return {
      procedures_completed: done.length,
      procedures_missed: events.length - done.length,
      inperson_minutes: sum(done.map((e) => e.duration_minutes ?? 0)),
    };
  },

  (p) => {
    const surveys = rowsFor(surveyResults, p.participant_identifier);
    return { surveys_completed: surveys.length, survey_minutes: sum(surveys.map((s) => s.duration_minutes)) };
  },
];

export const derived: Record<string, Derived> = {
  burden_minutes: (r) => sum([num(r.inperson_minutes), num(r.survey_minutes)]),
};
