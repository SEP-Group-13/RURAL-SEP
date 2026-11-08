import type { Filter, ParticipantApi, ParticipantRecord, Scalar } from "../types";
import { buildRecords } from "./buildRecords";
import { derived, sources } from "./participantFields";
import { placeholderParticipants } from "./placeholderParticipants";

const PAGE_SIZE = 10;

const records = buildRecords(placeholderParticipants, sources, derived);

function compare(a: Scalar, b: Scalar) {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

// Simulating filters (from views) applied on server
function matches(r: ParticipantRecord, filters: Filter[]) {
  return filters.every(({ field, op, value }) => {
    const v = r[field] ?? null;
    switch (op) {
      case "eq": return v === value;
      case "neq": return v !== value;
      case "in": return (value as Scalar[]).includes(v);
      case "gte": return v !== null && compare(v, value as Scalar) >= 0;
      case "lte": return v !== null && compare(v, value as Scalar) <= 0;
    }
  });
}

// Simulating network delay for UX/UI development
const delay = <T>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 200));

export const mockParticipantApi: ParticipantApi = {
  getAllParticipants: (filters = []) =>
    delay(records.filter((r) => matches(r, filters))),

  getPageParticipants: (n, filters = []) => {
    const rows = records.filter((r) => matches(r, filters));
    const start = (n - 1) * PAGE_SIZE;
    return delay({ items: rows.slice(start, start + PAGE_SIZE), page: n, pageSize: PAGE_SIZE, total: rows.length });
  },

  getParticipant: (id) =>
    delay(records.find((r) => r.participant_identifier === id) ?? null),
};
