import { participantApi } from "./api";
import { columnCatalog } from "./columnCatalog";
import type { Column, ComputedField, Filter, Page, ParticipantRecord } from "./types";

export type ViewDefinition = {
  filters?: Filter[];
  computed?: Record<string, ComputedField>;
  columns: string[];
};

export type View = {
  columns: Column[];
  getAll(): Promise<ParticipantRecord[]>;
  getPage(n: number): Promise<Page<ParticipantRecord>>;
};

export function createView({ filters = [], computed = {}, columns }: ViewDefinition): View {
  const resolved = columns.map((id) => {
    const display = computed[id] ?? columnCatalog[id];
    if (!display) throw new Error(`Column "${id}" is not in the column catalog or this view's computed fields`);
    return { id, label: display.label, width: display.width, format: display.format };
  });

  const addComputed = (r: ParticipantRecord) => {
    const row = { ...r };
    for (const [id, field] of Object.entries(computed)) row[id] = field.value(row);
    return row;
  };

  return {
    columns: resolved,
    getAll: async () => (await participantApi.getAllParticipants(filters)).map(addComputed),
    getPage: async (n) => {
      const page = await participantApi.getPageParticipants(n, filters);
      return { ...page, items: page.items.map(addComputed) };
    },
  };
}
