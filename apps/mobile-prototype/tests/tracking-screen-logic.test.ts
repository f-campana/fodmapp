import assert from "node:assert/strict";
import test from "node:test";

import type { SymptomEntry, TrackingFeedEntry } from "@fodmapp/domain";

import {
  buildCreateSymptomConsentGate,
  buildTrackingFeedViewModel,
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

void test("buildTrackingFeedViewModel prepares minimal symptom rows for rendering", () => {
  const viewModel = buildTrackingFeedViewModel(1, [
    createTrackingFeedEntryFixture(),
  ]);

  assert.equal(viewModel.subtitle, "1 entry in your recent history");
  assert.equal(viewModel.items.length, 1);
  assert.equal(viewModel.items[0]?.entryType, "symptom");
  assert.equal(viewModel.items[0]?.title, "bloating · intensity 4");
  assert.equal(viewModel.items[0]?.note, "After lunch");
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
