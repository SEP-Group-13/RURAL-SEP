import type { ColumnDisplay } from "./types";

const formatDate = (v: string | number) => new Date(`${v}T00:00`).toLocaleDateString();

export const columnCatalog: Record<string, ColumnDisplay> = {
  participant_identifier: { label: "ID",              width: "90px" },
  final_study_status:     { label: "Status",          width: "120px" },
  enrollment_date:        { label: "Enrolled",        width: "110px", format: formatDate },
  age:                    { label: "Age",             width: "60px" },
  gender_sex:             { label: "Gender",          width: "110px" },
  education_level:        { label: "Education",       width: "minmax(160px, 1fr)" },
  employment_status:      { label: "Employment",      width: "minmax(150px, 1fr)" },
  dropout_date:           { label: "Dropped out",     width: "110px", format: formatDate },
  dropout_reason:         { label: "Dropout reason",  width: "minmax(180px, 1fr)" },
  bmi:                    { label: "BMI",             width: "70px" },
  procedures_completed:   { label: "Procedures",      width: "100px" },
  procedures_missed:      { label: "Missed",          width: "80px" },
  inperson_minutes:       { label: "In-person (min)", width: "120px" },
  surveys_completed:      { label: "Surveys",         width: "80px" },
  survey_minutes:         { label: "Surveys (min)",   width: "110px" },
  burden_minutes:         { label: "Burden (min)",    width: "110px" },
};
