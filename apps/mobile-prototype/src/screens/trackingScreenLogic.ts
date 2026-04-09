import type {
  SymptomType,
  TrackingFeedEntry,
  WeeklyTrackingSummary,
} from "@fodmapp/domain";

import type { TrackingConsentState } from "../data/consentRepository";
import type { TrackingRepository } from "../data/trackingRepository";

function formatOccurredAt(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatOccurredAtTime(value: string) {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
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

export interface TrackingFeedSection {
  key: string;
  title: string;
  items: TrackingFeedListItem[];
}

export interface TrackingWeeklySummaryStat {
  label: string;
  value: string;
}

export interface TrackingFeedViewModel {
  subtitle: string;
  sections: TrackingFeedSection[];
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
    subtitle: `${total} ${total === 1 ? "entry" : "entries"} in your recent history`,
    sections: buildTrackingFeedSections(entries),
  };
}

export function buildTrackingFeedListItems(
  entries: TrackingFeedEntry[],
): TrackingFeedListItem[] {
  return entries.map((entry) => ({
    id: `${entry.entryType}-${entry.entryId}`,
    entryType: entry.entryType,
    title: renderEntryTitle(entry),
    occurredAtLabel: formatOccurredAt(entry.occurredAtUtc),
    note: renderEntryNote(entry),
  }));
}

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatTrackingDayHeading(date: Date, now: Date): string {
  const today = startOfLocalDay(now);
  const target = startOfLocalDay(date);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const differenceInDays = Math.round(
    (today.getTime() - target.getTime()) / millisecondsPerDay,
  );

  if (differenceInDays === 0) {
    return "Today";
  }

  if (differenceInDays === 1) {
    return "Yesterday";
  }

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function buildTrackingFeedSections(
  entries: TrackingFeedEntry[],
  now: Date = new Date(),
): TrackingFeedSection[] {
  const sections: TrackingFeedSection[] = [];

  for (const entry of entries) {
    const occurredAt = new Date(entry.occurredAtUtc);
    const key = getLocalDateKey(occurredAt);
    const item: TrackingFeedListItem = {
      id: `${entry.entryType}-${entry.entryId}`,
      entryType: entry.entryType,
      title: renderEntryTitle(entry),
      occurredAtLabel: formatOccurredAtTime(entry.occurredAtUtc),
      note: renderEntryNote(entry),
    };
    const lastSection = sections.at(-1);

    if (lastSection && lastSection.key === key) {
      lastSection.items.push(item);
      continue;
    }

    sections.push({
      key,
      title: formatTrackingDayHeading(occurredAt, now),
      items: [item],
    });
  }

  return sections;
}

function getWeeklySummaryEntryCount(summary: WeeklyTrackingSummary): number {
  return summary.dailyCounts.reduce(
    (total, day) => total + day.mealCount + day.symptomCount,
    0,
  );
}

function getWeeklySummarySymptomCount(summary: WeeklyTrackingSummary): number {
  return summary.dailyCounts.reduce(
    (total, day) => total + day.symptomCount,
    0,
  );
}

function formatSummaryValue(value: number | null): string {
  if (value === null) {
    return "—";
  }

  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function buildWeeklyTrackingSummarySubtitle(
  summary: WeeklyTrackingSummary,
): string {
  const totalEntries = getWeeklySummaryEntryCount(summary);

  if (totalEntries === 0) {
    return "No entries recorded in the last 7 days yet.";
  }

  return `${totalEntries} entr${totalEntries === 1 ? "y" : "ies"} recorded in the last 7 days.`;
}

export function buildWeeklyTrackingSummaryStats(
  summary: WeeklyTrackingSummary,
): TrackingWeeklySummaryStat[] {
  return [
    {
      label: "Entries",
      value: String(getWeeklySummaryEntryCount(summary)),
    },
    {
      label: "Symptoms",
      value: String(getWeeklySummarySymptomCount(summary)),
    },
    {
      label: "Avg intensity",
      value: formatSummaryValue(summary.severity.average),
    },
  ];
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
