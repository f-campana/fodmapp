import type { SymptomType, TrackingFeedEntry } from "@fodmapp/domain";

import type { TrackingRepository } from "../data/trackingRepository";

function formatOccurredAt(value: string) {
  return new Date(value).toLocaleString();
}

function renderEntryTitle(entry: TrackingFeedEntry) {
  if (entry.entryType === "symptom") {
    return `${entry.symptom.symptomType} · intensity ${entry.symptom.severity}`;
  }

  return entry.meal.title ?? "Meal entry";
}

function renderEntryNote(entry: TrackingFeedEntry) {
  if (entry.entryType === "symptom") {
    return entry.symptom.note;
  }

  return entry.meal.note;
}

export interface TrackingFeedListItem {
  id: string;
  entryType: TrackingFeedEntry["entryType"];
  title: string;
  occurredAtLabel: string;
  note: string | null;
}

export interface TrackingFeedViewModel {
  subtitle: string;
  items: TrackingFeedListItem[];
}

export function buildTrackingFeedViewModel(
  total: number,
  entries: TrackingFeedEntry[],
): TrackingFeedViewModel {
  return {
    subtitle: `${total} entry${total === 1 ? "" : "ies"} in your recent history`,
    items: entries.map((entry) => ({
      id: `${entry.entryType}-${entry.entryId}`,
      entryType: entry.entryType,
      title: renderEntryTitle(entry),
      occurredAtLabel: formatOccurredAt(entry.occurredAtUtc),
      note: renderEntryNote(entry),
    })),
  };
}

function normalizeNote(note: string): string | null {
  const trimmed = note.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseSymptomSeverityInput(rawValue: string): number | null {
  const parsedSeverity = Number(rawValue);
  if (
    !Number.isInteger(parsedSeverity) ||
    parsedSeverity < 0 ||
    parsedSeverity > 10
  ) {
    return null;
  }

  return parsedSeverity;
}

export async function submitCreateSymptomForm(
  repository: TrackingRepository,
  input: {
    symptomType: SymptomType;
    severity: string;
    note: string;
  },
  onCreated: () => void,
): Promise<string | null> {
  const parsedSeverity = parseSymptomSeverityInput(input.severity);
  if (parsedSeverity === null) {
    return "Intensity must be a whole number from 0 to 10.";
  }

  await repository.createSymptom({
    symptomType: input.symptomType,
    severity: parsedSeverity,
    note: normalizeNote(input.note),
  });
  onCreated();
  return null;
}
