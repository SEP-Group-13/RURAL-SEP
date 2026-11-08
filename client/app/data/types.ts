export type Scalar = string | number | null;

export type ParticipantBase = {
  participant_identifier: string;
  enrollment_date: string;
  final_study_status: "Active" | "Completed" | "Dropped Out";
  dropout_date: string | null;
  dropout_reason: string | null;
  age: number;
  gender_sex: string;
  education_level: string;
  employment_status: string;
};

export type ParticipantRecord = ParticipantBase & Record<string, Scalar>;

export type Page<T> = { items: T[]; page: number; pageSize: number; total: number };

export type Filter = {
  field: string;
  op: "eq" | "neq" | "in" | "gte" | "lte";
  value: Scalar | Scalar[];
};

export interface ParticipantApi {
  getAllParticipants(filters?: Filter[]): Promise<ParticipantRecord[]>;
  getPageParticipants(n: number, filters?: Filter[]): Promise<Page<ParticipantRecord>>; // n starts at 1
  getParticipant(id: string): Promise<ParticipantRecord | null>;
}

export type ColumnDisplay = {
  label: string;
  width: string; // CSS grid track: "100px", "minmax(160px, 1fr)"
  format?: (value: string | number) => string; // null values always show as "—"
};

export type Column = ColumnDisplay & { id: string };

export type ComputedField = ColumnDisplay & { value: (r: ParticipantRecord) => Scalar };
