import assert from "node:assert/strict";
import test from "node:test";

import type {
  SymptomEntry,
  TrackingFeedEntry,
  WeeklyTrackingSummary,
} from "@fodmapp/domain";

import {
  buildHomeRecentActivityItems,
  buildHomeRecentActivitySubtitle,
  buildHomeWeeklySummary,
  formatHomeDate,
  resolveHomeActivityState,
} from "../src/screens/homeScreenLogic.ts";

function createSymptomEntryFixture(
  overrides: Partial<SymptomEntry> = {},
): SymptomEntry {
  return {
    kind: "symptom_log",
    symptomLogId: "symptom-1",
    symptomType: "bloating",
    severity: 4,
    notedAtUtc: "2026-04-08T10:15:00.000Z",
    note: "After lunch",
    version: 1,
    createdAtUtc: "2026-04-08T10:15:00.000Z",
    updatedAtUtc: "2026-04-08T10:15:00.000Z",
    provenance: {
      kind: "tracking_log",
      provider: "fodmapp",
      sourceId: "symptom-1",
    },
    evidenceTier: "user_entered",
    capabilities: {
      canBeSwapOrigin: false,
      canBeSwapTarget: false,
      canAppearInTracking: true,
      canBeSavedMealItem: false,
      hasEvidenceBackedGuidance: false,
      isInformationalOnly: false,
    },
    ...overrides,
  };
}

function createTrackingFeedEntryFixture(
  overrides: Partial<Extract<TrackingFeedEntry, { entryType: "symptom" }>> = {},
): TrackingFeedEntry {
  return {
    entryType: "symptom",
    occurredAtUtc: "2026-04-08T10:15:00.000Z",
    entryId: "symptom-1",
    symptom: createSymptomEntryFixture(),
    provenance: {
      kind: "tracking_projection",
      provider: "fodmapp",
      sourceId: "symptom-1",
    },
    evidenceTier: "derived",
    capabilities: {
      canBeSwapOrigin: false,
      canBeSwapTarget: false,
      canAppearInTracking: true,
      canBeSavedMealItem: false,
      hasEvidenceBackedGuidance: false,
      isInformationalOnly: false,
    },
    ...overrides,
  };
}

function createWeeklySummaryFixture(
  overrides: Partial<WeeklyTrackingSummary> = {},
): WeeklyTrackingSummary {
  return {
    anchorDate: "2026-04-09",
    windowStartUtc: "2026-04-03T00:00:00.000Z",
    windowEndUtc: "2026-04-09T23:59:59.000Z",
    dailyCounts: [
      {
        date: "2026-04-08",
        mealCount: 0,
        symptomCount: 1,
      },
      {
        date: "2026-04-09",
        mealCount: 0,
        symptomCount: 2,
      },
    ],
    symptomCounts: [
      {
        symptomType: "bloating",
        count: 2,
      },
      {
        symptomType: "pain",
        count: 1,
      },
    ],
    severity: {
      average: 4.5,
      maximum: 7,
    },
    proximityGroups: [],
    provenance: {
      kind: "tracking_projection",
      provider: "fodmapp",
      sourceSlug: "weekly_tracking_summary",
    },
    evidenceTier: "derived",
    capabilities: {
      canBeSwapOrigin: false,
      canBeSwapTarget: false,
      canAppearInTracking: true,
      canBeSavedMealItem: false,
      hasEvidenceBackedGuidance: false,
      isInformationalOnly: false,
    },
    ...overrides,
  };
}

void test("resolveHomeActivityState covers loading, empty, error, and ready states", () => {
  assert.equal(
    resolveHomeActivityState({ loading: true, error: null, itemCount: 0 }),
    "loading",
  );
  assert.equal(
    resolveHomeActivityState({ loading: false, error: "boom", itemCount: 0 }),
    "error",
  );
  assert.equal(
    resolveHomeActivityState({ loading: false, error: null, itemCount: 0 }),
    "empty",
  );
  assert.equal(
    resolveHomeActivityState({ loading: false, error: null, itemCount: 1 }),
    "ready",
  );
});

void test("buildHomeRecentActivityItems keeps only the latest small set for Home", () => {
  const recentActivityItems = buildHomeRecentActivityItems(
    [
      createTrackingFeedEntryFixture({
        entryId: "symptom-1",
        symptom: createSymptomEntryFixture({
          symptomLogId: "symptom-1",
          symptomType: "pain",
          severity: 7,
          note: "Sharp pain after lunch",
        }),
      }),
      createTrackingFeedEntryFixture({
        entryId: "symptom-2",
        symptom: createSymptomEntryFixture({
          symptomLogId: "symptom-2",
          symptomType: "gas",
          severity: 5,
          note: "After dinner",
        }),
      }),
      createTrackingFeedEntryFixture({
        entryId: "symptom-3",
        symptom: createSymptomEntryFixture({
          symptomLogId: "symptom-3",
          symptomType: "bloating",
          severity: 4,
          note: "At bedtime",
        }),
      }),
      createTrackingFeedEntryFixture({
        entryId: "symptom-4",
        symptom: createSymptomEntryFixture({
          symptomLogId: "symptom-4",
          symptomType: "nausea",
          severity: 3,
          note: "Next morning",
        }),
      }),
    ],
    3,
  );

  assert.equal(recentActivityItems.length, 3);
  assert.equal(recentActivityItems[0]?.title, "pain · intensity 7");
  assert.equal(recentActivityItems[2]?.title, "bloating · intensity 4");
});

void test("buildHomeRecentActivitySubtitle reports empty and truncated activity summaries", () => {
  assert.equal(buildHomeRecentActivitySubtitle(0, 0), "No recent entries yet");
  assert.equal(buildHomeRecentActivitySubtitle(1, 1), "1 recent entry");
  assert.equal(
    buildHomeRecentActivitySubtitle(5, 3),
    "Showing 3 of 5 recent entries",
  );
});

void test("buildHomeWeeklySummary prepares a compact factual seven-day summary", () => {
  const viewModel = buildHomeWeeklySummary(createWeeklySummaryFixture());

  assert.equal(viewModel.title, "This week");
  assert.equal(viewModel.subtitle, "3 entries recorded in the last 7 days.");
  assert.deepEqual(viewModel.stats, [
    { label: "Entries", value: "3" },
    { label: "Symptoms", value: "3" },
    { label: "Avg intensity", value: "4.5" },
  ]);
});

void test("formatHomeDate returns a human-readable date anchor", () => {
  const label = formatHomeDate(new Date("2026-04-09T08:00:00Z"));

  assert.equal(typeof label, "string");
  assert.notEqual(label.length, 0);
});
