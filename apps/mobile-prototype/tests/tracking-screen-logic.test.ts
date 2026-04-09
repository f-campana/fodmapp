import assert from "node:assert/strict";
import test from "node:test";

import type {
  SymptomEntry,
  TrackingFeedEntry,
  WeeklyTrackingSummary,
} from "@fodmapp/domain";

import {
  buildCreateSymptomConsentGate,
  buildTrackingFeedViewModel,
  buildWeeklyTrackingSummaryStats,
  buildWeeklyTrackingSummarySubtitle,
  canSubmitCreateSymptom,
  mapCreateSymptomSubmissionError,
  parseSymptomSeverityInput,
  submitCreateSymptomForm,
} from "../src/screens/trackingScreenLogic.ts";

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

void test("buildTrackingFeedViewModel groups recent entries by local day headings", () => {
  const viewModel = buildTrackingFeedViewModel(3, [
    createTrackingFeedEntryFixture({
      entryId: "symptom-1",
      occurredAtUtc: "2026-04-09T10:15:00.000Z",
    }),
    createTrackingFeedEntryFixture({
      entryId: "symptom-2",
      occurredAtUtc: "2026-04-09T08:30:00.000Z",
      symptom: createSymptomEntryFixture({
        symptomLogId: "symptom-2",
        symptomType: "pain",
        severity: 7,
        note: "Sharp pain after breakfast",
      }),
    }),
    createTrackingFeedEntryFixture({
      entryId: "symptom-3",
      occurredAtUtc: "2026-04-08T18:45:00.000Z",
      symptom: createSymptomEntryFixture({
        symptomLogId: "symptom-3",
        symptomType: "gas",
        severity: 5,
        note: "After dinner",
      }),
    }),
  ]);

  assert.equal(viewModel.subtitle, "3 entries in your recent history");
  assert.equal(viewModel.sections.length, 2);
  assert.equal(viewModel.sections[0]?.items.length, 2);
  assert.equal(viewModel.sections[0]?.items[0]?.entryType, "symptom");
  assert.equal(
    viewModel.sections[0]?.items[0]?.title,
    "bloating · intensity 4",
  );
  assert.equal(viewModel.sections[0]?.items[1]?.title, "pain · intensity 7");
  assert.equal(viewModel.sections[1]?.items[0]?.title, "gas · intensity 5");
});

void test("weekly summary helpers stay observational and compact", () => {
  const summary: WeeklyTrackingSummary = {
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
      { symptomType: "bloating", count: 2 },
      { symptomType: "pain", count: 1 },
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
    evidenceTier: "derived" as const,
    capabilities: {
      canBeSwapOrigin: false,
      canBeSwapTarget: false,
      canAppearInTracking: true,
      canBeSavedMealItem: false,
      hasEvidenceBackedGuidance: false,
      isInformationalOnly: false,
    },
  };

  assert.equal(
    buildWeeklyTrackingSummarySubtitle(summary),
    "3 entries recorded in the last 7 days.",
  );
  assert.deepEqual(buildWeeklyTrackingSummaryStats(summary), [
    { label: "Entries", value: "3" },
    { label: "Symptoms", value: "3" },
    { label: "Avg intensity", value: "4.5" },
  ]);
});

void test("parseSymptomSeverityInput only accepts whole numbers from 0 to 10", () => {
  assert.equal(parseSymptomSeverityInput("0"), 0);
  assert.equal(parseSymptomSeverityInput("7"), 7);
  assert.equal(parseSymptomSeverityInput("11"), null);
  assert.equal(parseSymptomSeverityInput("2.5"), null);
  assert.equal(parseSymptomSeverityInput("pain"), null);
});

void test("buildCreateSymptomConsentGate reports a locked state when symptom consent is missing", () => {
  const consentGate = buildCreateSymptomConsentGate({
    canCreateSymptoms: false,
    isActive: false,
    missingScope: "symptom_logs",
    scope: {},
    status: null,
  });

  assert.equal(consentGate.isLocked, true);
  assert.equal(
    consentGate.message,
    "Tracking is disabled until you enable consent.",
  );
  assert.equal(
    canSubmitCreateSymptom(
      {
        canCreateSymptoms: false,
        isActive: false,
        missingScope: "symptom_logs",
        scope: {},
        status: null,
      },
      false,
    ),
    false,
  );
});

void test("mapCreateSymptomSubmissionError replaces raw consent locks with product copy", () => {
  assert.equal(
    mapCreateSymptomSubmissionError(
      new Error(
        'tracking-api error 423: {"error":{"code":"locked","message":"symptom_logs disabled by consent"}}',
      ),
    ),
    "Tracking is disabled until you enable consent.",
  );
});

void test("submitCreateSymptomForm triggers the repository write and completion callback", async () => {
  const createCalls: Array<{
    symptomType: string;
    severity: number;
    note: string | null;
  }> = [];
  let createdCount = 0;

  const statusMessage = await submitCreateSymptomForm(
    {
      getFeed: async () => {
        throw new Error("not used");
      },
      getHubReadModel: async () => {
        throw new Error("not used");
      },
      createSymptom: async (input) => {
        createCalls.push(input);
        return createSymptomEntryFixture({
          symptomType: input.symptomType,
          severity: input.severity,
          note: input.note,
        });
      },
    },
    {
      symptomType: "pain",
      severity: "7",
      note: "Sharp pain after lunch",
    },
    () => {
      createdCount += 1;
    },
  );

  assert.equal(statusMessage, null);
  assert.deepEqual(createCalls, [
    {
      symptomType: "pain",
      severity: 7,
      note: "Sharp pain after lunch",
    },
  ]);
  assert.equal(createdCount, 1);
});
