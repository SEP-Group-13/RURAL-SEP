import { createView } from "./viewHandler";

const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);

export const allParticipantsView = createView({
  columns: ["participant_identifier", "final_study_status", "enrollment_date", "age", "gender_sex", "bmi", "burden_minutes"],
});

export const activeView = createView({
  filters: [{ field: "final_study_status", op: "eq", value: "Active" }],
  columns: ["participant_identifier", "enrollment_date", "age", "education_level", "employment_status"],
});

export const highBurdenView = createView({
  filters: [{ field: "burden_minutes", op: "gte", value: 150 }],
  columns: ["participant_identifier", "procedures_completed", "procedures_missed", "inperson_minutes", "surveys_completed", "survey_minutes", "burden_minutes"],
});

export const dropoutsView = createView({
  filters: [{ field: "final_study_status", op: "eq", value: "Dropped Out" }],
  computed: {
    days_in_study: {
      label: "Days in study",
      width: "110px",
      value: (r) => (r.dropout_date ? daysBetween(r.enrollment_date, r.dropout_date) : null),
    },
  },
  columns: ["participant_identifier", "enrollment_date", "dropout_date", "dropout_reason", "days_in_study"],
});

// Views that can be picked in the UI
export const views = {
  "All participants": allParticipantsView,
  Active: activeView,
  "High burden": highBurdenView,
  Dropouts: dropoutsView,
};
