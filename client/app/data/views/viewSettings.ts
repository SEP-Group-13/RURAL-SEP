import { createDefaultColumns } from "../columns/defaultColumns";
import type { ViewQuery, ViewSettings } from "../types/view";

export function createViewId(): string {
    const time = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 8);
    return `view-${time}-${random}`;
}

export function createDefaultViewSettings(name: string): ViewSettings {
    return {
        id: createViewId(),
        name,
        columns: createDefaultColumns(),
        filters: [],
        sort: null,
        selectedYears: "all",
        excludedIds: [],
    };
}

export function copyViewSettings(
    settings: ViewSettings,
    newName: string,
): ViewSettings {
    const copy = structuredClone(settings);
    copy.id = createViewId();
    copy.name = newName;
    return copy;
}

export function getQueryFromSettings(settings: ViewSettings): ViewQuery {
    return {
        columns: settings.columns,
        filters: settings.filters,
        sort: settings.sort,
        selectedYears: settings.selectedYears,
        excludedIds: settings.excludedIds,
    };
}

export function looksLikeViewSettings(value: unknown): value is ViewSettings {
    if (typeof value !== "object" || value === null) {
        return false;
    }
    const settings = value as Record<string, unknown>;
    return (
        typeof settings.id === "string" &&
        typeof settings.name === "string" &&
        Array.isArray(settings.columns) &&
        Array.isArray(settings.filters) &&
        Array.isArray(settings.excludedIds) &&
        (settings.selectedYears === "all" ||
            Array.isArray(settings.selectedYears)) &&
        (settings.sort === null || typeof settings.sort === "object")
    );
}

export function makeUniqueName(name: string, usedNames: string[]): string {
    const used = new Set(usedNames.map((n) => n.toLowerCase()));
    if (!used.has(name.toLowerCase())) {
        return name;
    }
    let number = 2;
    while (used.has(`${name} (${number})`.toLowerCase())) {
        number += 1;
    }
    return `${name} (${number})`;
}
