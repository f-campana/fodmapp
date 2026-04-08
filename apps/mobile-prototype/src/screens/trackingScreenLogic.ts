import type { SymptomType, TrackingFeedEntry } from "@fodmapp/domain";

import type { TrackingConsentState } from "../data/consentRepository";
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

export interface CreateSymptomConsentGate {
  isLocked: boolean;
  message: string | null;
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

export function buildCreateSymptomConsentGate(
  consentState: TrackingConsentState | null,
): CreateSymptomConsentGate {
  if (consentState?.canCreateSymptoms) {
    return {
      isLocked: false,
      message: null,
    };
  }

  return {
    isLocked: true,
    message: "Tracking is disabled until you enable consent.",
  };
}

export function canSubmitCreateSymptom(
  consentState: TrackingConsentState | null,
  submitting: boolean,
): boolean {
  if (submitting) {
    return false;
  }

  return Boolean(consentState?.canCreateSymptoms);
}

export function isConsentLockedError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("423") &&
    (error.message.includes('"code":"locked"') ||
      error.message.includes("disabled by consent"))
  );
}

export function mapCreateSymptomSubmissionError(error: unknown): string {
  if (isConsentLockedError(error)) {
    return "Tracking is disabled until you enable consent.";
  }

  return "Could not create symptom entry. Try again.";
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
