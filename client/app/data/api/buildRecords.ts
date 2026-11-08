import type { ParticipantBase, ParticipantRecord, Scalar } from "../types";

export type Source = (p: ParticipantBase) => Record<string, Scalar>;
// ideally this is how we handle adding burden calculations (along the lines)
export type Derived = (r: ParticipantRecord) => Scalar;

// sources are data from other datasets (extending the base data) and derived are the calculations
export function buildRecords(base: ParticipantBase[], sources: Source[], derived: Record<string, Derived>) {
  return base.map((p) => {
    const record: ParticipantRecord = Object.assign({}, p, ...sources.map((source) => source(p)));
    for (const [field, fn] of Object.entries(derived)) record[field] = fn(record);
    return record;
  });
}
