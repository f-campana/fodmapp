import { afterEach, describe, expect, it, vi } from "vitest";

import { getSafeHarbors } from "../lib/api";
import type { ProtectedApiAuth } from "../lib/protectedApiAuth";
import {
  buildCustomFoodCreateRequestFromDraft,
  buildCustomFoodUpdateRequestFromDraft,
  buildMealLogCreateRequestFromDraft,
  buildMealLogUpdateRequestFromDraft,
  buildSavedMealLogCreateRequestFromDraft,
  buildSavedMealLogUpdateRequestFromDraft,
  buildSymptomLogCreateRequestFromDraft,
  buildSymptomLogUpdateRequestFromDraft,
  createTrackingSymptom,
  deleteTrackingMeal,
} from "../lib/tracking";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("safe-harbor helper", () => {
  it("returns api_not_configured when the API base URL is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");

    const result = await getSafeHarbors();

    expect(result).toEqual({
      ok: false,
      status: 0,
      error: "api_not_configured",
    });
  });
});

describe("tracking client", () => {
  it("builds custom food transport payloads from a domain draft", () => {
    const draft = {
      label: "Pain maison",
      note: "Recette perso pauvre en lactose",
    };

    expect(buildCustomFoodCreateRequestFromDraft(draft)).toEqual({
      label: "Pain maison",
      note: "Recette perso pauvre en lactose",
    });
    expect(buildCustomFoodUpdateRequestFromDraft(draft)).toEqual({
      label: "Pain maison",
      note: "Recette perso pauvre en lactose",
    });
  });

  it("builds meal transport payloads from a domain draft", () => {
    const draft = {
      title: "Déjeuner",
      occurredAtUtc: "2026-03-20T12:30:00Z",
      note: "Test digestif",
      items: [
        {
          reference: {
            kind: "canonical_food" as const,
            foodSlug: "phase2-ail-cru",
          },
          quantityText: "10 g",
          note: null,
        },
        {
          reference: {
            kind: "custom_food" as const,
            customFoodId: "11111111-1111-4111-8111-111111111111",
          },
          quantityText: null,
          note: "Maison",
        },
        {
          reference: {
            kind: "free_text" as const,
            label: "Snack libre",
          },
          quantityText: "1 portion",
          note: null,
        },
      ],
    };

    expect(buildMealLogCreateRequestFromDraft(draft)).toEqual({
      title: "Déjeuner",
      occurred_at_utc: "2026-03-20T12:30:00Z",
      note: "Test digestif",
      items: [
        {
          item_kind: "canonical_food",
          food_slug: "phase2-ail-cru",
          quantity_text: "10 g",
          note: null,
        },
        {
          item_kind: "custom_food",
          custom_food_id: "11111111-1111-4111-8111-111111111111",
          quantity_text: null,
          note: "Maison",
        },
        {
          item_kind: "free_text",
          free_text_label: "Snack libre",
          quantity_text: "1 portion",
          note: null,
        },
      ],
    });
    expect(buildMealLogUpdateRequestFromDraft(draft)).toEqual({
      title: "Déjeuner",
      occurred_at_utc: "2026-03-20T12:30:00Z",
      note: "Test digestif",
      items: [
        {
          item_kind: "canonical_food",
          food_slug: "phase2-ail-cru",
          quantity_text: "10 g",
          note: null,
        },
        {
          item_kind: "custom_food",
          custom_food_id: "11111111-1111-4111-8111-111111111111",
          quantity_text: null,
          note: "Maison",
        },
        {
          item_kind: "free_text",
          free_text_label: "Snack libre",
          quantity_text: "1 portion",
          note: null,
        },
      ],
    });
  });

  it("builds saved meal transport payloads from a domain draft", () => {
    const draft = {
      label: "Petit-déjeuner type",
      note: "À réutiliser les jours sensibles",
      items: [
        {
          reference: {
            kind: "canonical_food" as const,
            foodSlug: "phase2-pain-blanc",
          },
          quantityText: "2 tranches",
          note: null,
        },
        {
          reference: {
            kind: "custom_food" as const,
            customFoodId: "22222222-2222-4222-8222-222222222222",
          },
          quantityText: null,
          note: "Version maison",
        },
        {
          reference: {
            kind: "free_text" as const,
            label: "Boisson chaude",
          },
          quantityText: "1 tasse",
          note: null,
        },
      ],
    };

    expect(buildSavedMealLogCreateRequestFromDraft(draft)).toEqual({
      label: "Petit-déjeuner type",
      note: "À réutiliser les jours sensibles",
      items: [
        {
          item_kind: "canonical_food",
          food_slug: "phase2-pain-blanc",
          quantity_text: "2 tranches",
          note: null,
        },
        {
          item_kind: "custom_food",
          custom_food_id: "22222222-2222-4222-8222-222222222222",
          quantity_text: null,
          note: "Version maison",
        },
        {
          item_kind: "free_text",
          free_text_label: "Boisson chaude",
          quantity_text: "1 tasse",
          note: null,
        },
      ],
    });
    expect(buildSavedMealLogUpdateRequestFromDraft(draft)).toEqual({
      label: "Petit-déjeuner type",
      note: "À réutiliser les jours sensibles",
      items: [
        {
          item_kind: "canonical_food",
          food_slug: "phase2-pain-blanc",
          quantity_text: "2 tranches",
          note: null,
        },
        {
          item_kind: "custom_food",
          custom_food_id: "22222222-2222-4222-8222-222222222222",
          quantity_text: null,
          note: "Version maison",
        },
        {
          item_kind: "free_text",
          free_text_label: "Boisson chaude",
          quantity_text: "1 tasse",
          note: null,
        },
      ],
    });
  });

  it("builds symptom transport payloads from a domain draft", () => {
    const draft = {
      symptomType: "bloating" as const,
      severity: 4,
      notedAtUtc: "2026-03-20T10:00:00Z",
      note: "Après déjeuner",
    };

    expect(buildSymptomLogCreateRequestFromDraft(draft)).toEqual({
      symptom_type: "bloating",
      severity: 4,
      noted_at_utc: "2026-03-20T10:00:00Z",
      note: "Après déjeuner",
    });
    expect(buildSymptomLogUpdateRequestFromDraft(draft)).toEqual({
      symptom_type: "bloating",
      severity: 4,
      noted_at_utc: "2026-03-20T10:00:00Z",
      note: "Après déjeuner",
    });
  });

  it("keeps preview mode on X-User-Id for local validation", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.fodmap.example");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          symptom_log_id: "symptom-1",
          symptom_type: "bloating",
          severity: 4,
          noted_at_utc: "2026-03-20T10:00:00Z",
          note: null,
          version: 1,
          created_at_utc: "2026-03-20T10:00:00Z",
          updated_at_utc: "2026-03-20T10:00:00Z",
        }),
        { status: 201 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const auth: ProtectedApiAuth = {
      mode: "preview",
      userId: "11111111-1111-4111-8111-111111111111",
    };

    const result = await createTrackingSymptom(auth, {
      symptom_type: "bloating",
      severity: 4,
      noted_at_utc: "2026-03-20T10:00:00Z",
      note: null,
    });

    expect(result.symptom_type).toBe("bloating");
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("POST");
    expect((init.headers as Headers).get("X-User-Id")).toBe(
      "11111111-1111-4111-8111-111111111111",
    );
    expect((init.headers as Headers).get("Content-Type")).toBe(
      "application/json",
    );
  });

  it("returns undefined on 204 delete responses", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.fodmap.example");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );
    const auth: ProtectedApiAuth = {
      mode: "runtime",
      getToken: vi.fn().mockResolvedValue("token_123"),
    };

    const result = await deleteTrackingMeal(auth, "meal-1");

    expect(result).toBeUndefined();
  });
});
