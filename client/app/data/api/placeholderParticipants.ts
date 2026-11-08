import type { ParticipantBase } from "../types";

const row = (
  participant_identifier: string, enrollment_date: string, final_study_status: ParticipantBase["final_study_status"],
  age: number, education_level: string, employment_status: string, gender_sex: string,
  dropout_date: string | null = null, dropout_reason: string | null = null,
): ParticipantBase => ({
  participant_identifier, enrollment_date, final_study_status, dropout_date, dropout_reason,
  age, gender_sex, education_level, employment_status,
});

export const placeholderParticipants: ParticipantBase[] = [
  row("P0001", "2025-02-16", "Completed", 56, "Graduate degree", "Unemployed", "Male"),
  row("P0002", "2025-05-05", "Active", 34, "Less than high school", "Employed part-time", "Non-binary"),
  row("P0003", "2025-07-15", "Completed", 64, "Associate degree", "Unable to work", "Male"),
  row("P0004", "2025-07-19", "Completed", 59, "Bachelor's degree", "Employed part-time", "Female"),
  row("P0005", "2025-09-09", "Completed", 42, "Graduate degree", "Unemployed", "Female"),
  row("P0006", "2025-12-01", "Completed", 40, "Graduate degree", "Unemployed", "Female"),
  row("P0007", "2025-02-10", "Completed", 55, "Graduate degree", "Employed part-time", "Female"),
  row("P0008", "2025-12-10", "Completed", 45, "Some college", "Unemployed", "Female"),
  row("P0009", "2025-03-29", "Active", 67, "Some college", "Student", "Female"),
  row("P0010", "2025-12-15", "Active", 27, "High school or GED", "Employed full-time", "Male"),
  row("P0011", "2025-08-22", "Completed", 24, "Less than high school", "Unemployed", "Female"),
  row("P0012", "2025-08-30", "Dropped Out", 58, "High school or GED", "Employed part-time", "Female", "2025-09-26", "Too busy / time burden"),
  row("P0013", "2025-08-05", "Dropped Out", 56, "Bachelor's degree", "Employed part-time", "Female", "2026-01-09", "Participant withdrew consent"),
  row("P0014", "2025-06-13", "Completed", 55, "Some college", "Unemployed", "Male"),
  row("P0015", "2025-11-01", "Completed", 36, "Less than high school", "Unemployed", "Male"),
  row("P0016", "2025-08-11", "Completed", 43, "Bachelor's degree", "Unemployed", "Female"),
  row("P0017", "2025-08-02", "Completed", 24, "Graduate degree", "Employed full-time", "Female"),
  row("P0018", "2025-11-24", "Completed", 58, "Bachelor's degree", "Unable to work", "Male"),
  row("P0019", "2025-10-12", "Active", 49, "Associate degree", "Retired", "Male"),
  row("P0020", "2025-10-30", "Active", 19, "Bachelor's degree", "Employed part-time", "Male"),
];
