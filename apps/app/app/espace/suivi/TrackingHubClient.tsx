"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@clerk/nextjs";

import { Alert, AlertDescription, AlertTitle } from "@fodmapp/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@fodmapp/ui/alert-dialog";
import { Badge } from "@fodmapp/ui/badge";
import { Button } from "@fodmapp/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@fodmapp/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@fodmapp/ui/dialog";
import { Input } from "@fodmapp/ui/input";
import { Label } from "@fodmapp/ui/label";
import { NativeSelect } from "@fodmapp/ui/native-select";
import { Textarea } from "@fodmapp/ui/textarea";

import { searchFoods } from "../../../lib/api";
import {
  formatUtcIsoForDateTimeLocal,
  nowDateInputValue,
} from "../../../lib/dateTimeLocal";
import { type ProtectedApiAuth } from "../../../lib/protectedApiAuth";
import {
  createTrackingCustomFood,
  createTrackingMeal,
  createTrackingSavedMeal,
  createTrackingSymptom,
  type CustomFood,
  type CustomFoodCreateRequest,
  type CustomFoodUpdateRequest,
  deleteTrackingCustomFood,
  deleteTrackingMeal,
  deleteTrackingSavedMeal,
  deleteTrackingSymptom,
  getTrackingFeed,
  getWeeklyTrackingSummary,
  listTrackingCustomFoods,
  listTrackingSavedMeals,
  type MealLog,
  type MealLogCreateRequest,
  type MealLogUpdateRequest,
  type SavedMeal,
  type SavedMealCreateRequest,
  type SavedMealUpdateRequest,
  type SymptomLog,
  type SymptomLogCreateRequest,
  type SymptomLogUpdateRequest,
  type TrackingFeedResponse,
  updateTrackingCustomFood,
  updateTrackingMeal,
  updateTrackingSavedMeal,
  updateTrackingSymptom,
  type WeeklyTrackingSummaryResponse,
} from "../../../lib/tracking";

type TrackingItemKind = "canonical_food" | "custom_food" | "free_text";

type EditableItem = {
  itemKind: TrackingItemKind;
  foodSlug: string;
  selectedLabel: string;
  customFoodId: string;
  freeTextLabel: string;
  quantityText: string;
  note: string;
  searchQuery: string;
  searchResults: Array<{ food_slug: string; canonical_name_fr: string }>;
  searchError: string | null;
  searchLoading: boolean;
};

type SymptomFormState = {
  symptomType: SymptomLogCreateRequest["symptom_type"];
  severity: string;
  notedAtUtc: string;
  note: string;
};

type MealFormState = {
  title: string;
  occurredAtUtc: string;
  note: string;
  items: EditableItem[];
};

type CustomFoodFormState = {
  label: string;
  note: string;
};

type SavedMealFormState = {
  label: string;
  note: string;
  items: EditableItem[];
};

type PendingDelete =
  | {
      kind: "symptom";
      item: SymptomLog;
      title: string;
      description: string;
    }
  | {
      kind: "meal";
      item: MealLog;
      title: string;
      description: string;
    }
  | {
      kind: "custom_food";
      item: CustomFood;
      title: string;
      description: string;
    }
  | {
      kind: "saved_meal";
      item: SavedMeal;
      title: string;
      description: string;
    };

const SYMPTOM_OPTIONS: Array<{
  value: SymptomLogCreateRequest["symptom_type"];
  label: string;
}> = [
  { value: "bloating", label: "Ballonnements" },
  { value: "pain", label: "Douleur" },
  { value: "gas", label: "Gaz" },
  { value: "diarrhea", label: "Diarrhée" },
  { value: "constipation", label: "Constipation" },
  { value: "nausea", label: "Nausée" },
  { value: "reflux", label: "Reflux" },
  { value: "other", label: "Autre" },
];

function normalizeText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function createEmptyItem(): EditableItem {
  return {
    itemKind: "free_text",
    foodSlug: "",
    selectedLabel: "",
    customFoodId: "",
    freeTextLabel: "",
    quantityText: "",
    note: "",
    searchQuery: "",
    searchResults: [],
    searchError: null,
    searchLoading: false,
  };
}

function createEmptySymptomForm(): SymptomFormState {
  return {
    symptomType: "bloating",
    severity: "0",
    notedAtUtc: nowDateInputValue(),
    note: "",
  };
}

function createEmptyMealForm(): MealFormState {
  return {
    title: "",
    occurredAtUtc: nowDateInputValue(),
    note: "",
    items: [createEmptyItem()],
  };
}

function createEmptyCustomFoodForm(): CustomFoodFormState {
  return {
    label: "",
    note: "",
  };
}

function createEmptySavedMealForm(): SavedMealFormState {
  return {
    label: "",
    note: "",
    items: [createEmptyItem()],
  };
}

function toEditableItem(
  item: MealLog["items"][number] | SavedMeal["items"][number],
): EditableItem {
  return {
    itemKind: item.item_kind,
    foodSlug: item.food_slug ?? "",
    selectedLabel: item.label,
    customFoodId: item.custom_food_id ?? "",
    freeTextLabel: item.item_kind === "free_text" ? item.label : "",
    quantityText: item.quantity_text ?? "",
    note: item.note ?? "",
    searchQuery: item.food_slug ?? item.label,
    searchResults: [],
    searchError: null,
    searchLoading: false,
  };
}

function buildMealForm(meal: MealLog): MealFormState {
  return {
    title: meal.title ?? "",
    occurredAtUtc: formatUtcIsoForDateTimeLocal(meal.occurred_at_utc),
    note: meal.note ?? "",
    items: meal.items.map(toEditableItem),
  };
}

function buildSavedMealForm(savedMeal: SavedMeal): SavedMealFormState {
  return {
    label: savedMeal.label,
    note: savedMeal.note ?? "",
    items: savedMeal.items.map(toEditableItem),
  };
}

function buildSymptomForm(symptom: SymptomLog): SymptomFormState {
  return {
    symptomType: symptom.symptom_type,
    severity: String(symptom.severity),
    notedAtUtc: formatUtcIsoForDateTimeLocal(symptom.noted_at_utc),
    note: symptom.note ?? "",
  };
}

function buildTrackingItemPayload(item: EditableItem) {
  if (item.itemKind === "canonical_food") {
    const foodSlug = normalizeText(item.foodSlug);
    if (!foodSlug) {
      throw new Error("Sélectionne un aliment référencé pour cet item.");
    }
    return {
      item_kind: "canonical_food" as const,
      food_slug: foodSlug,
      quantity_text: normalizeText(item.quantityText),
      note: normalizeText(item.note),
    };
  }

  if (item.itemKind === "custom_food") {
    const customFoodId = normalizeText(item.customFoodId);
    if (!customFoodId) {
      throw new Error("Sélectionne un aliment personnel pour cet item.");
    }
    return {
      item_kind: "custom_food" as const,
      custom_food_id: customFoodId,
      quantity_text: normalizeText(item.quantityText),
      note: normalizeText(item.note),
    };
  }

  const freeTextLabel = normalizeText(item.freeTextLabel);
  if (!freeTextLabel) {
    throw new Error("Renseigne un libellé libre pour cet item.");
  }
  return {
    item_kind: "free_text" as const,
    free_text_label: freeTextLabel,
    quantity_text: normalizeText(item.quantityText),
    note: normalizeText(item.note),
  };
}

function formatError(error: unknown) {
  return error instanceof Error ? error.message : "Erreur inconnue";
}

function formatFeedTimestamp(value: string) {
  return new Date(value).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

interface TrackingItemEditorProps {
  item: EditableItem;
  index: number;
  customFoods: CustomFood[];
  onChange: (index: number, nextItem: EditableItem) => void;
  onRemove: (index: number) => void;
}

function TrackingItemEditor({
  item,
  index,
  customFoods,
  onChange,
  onRemove,
}: TrackingItemEditorProps) {
  const update = (patch: Partial<EditableItem>) =>
    onChange(index, { ...item, ...patch });

  const searchCanonicalFoods = async () => {
    const query = normalizeText(item.searchQuery);
    if (!query) {
      update({ searchError: "Saisis un mot-clé avant de chercher." });
      return;
    }

    update({ searchLoading: true, searchError: null });
    const result = await searchFoods(query, 5);
    if (!result.ok) {
      update({
        searchLoading: false,
        searchError: "Recherche indisponible pour le moment.",
        searchResults: [],
      });
      return;
    }

    update({
      searchLoading: false,
      searchResults: result.data.items.map((food) => ({
        food_slug: food.food_slug,
        canonical_name_fr: food.canonical_name_fr,
      })),
      searchError: null,
    });
  };

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={`item-kind-${index}`}>Item {index + 1}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onRemove(index)}
        >
          Retirer
        </Button>
      </div>

      <NativeSelect
        id={`item-kind-${index}`}
        value={item.itemKind}
        onChange={(event) =>
          update({
            itemKind: event.target.value as TrackingItemKind,
            foodSlug: "",
            selectedLabel: "",
            customFoodId: "",
            freeTextLabel: "",
            searchResults: [],
            searchError: null,
          })
        }
      >
        <option value="free_text">Texte libre</option>
        <option value="canonical_food">Aliment référencé</option>
        <option value="custom_food">Aliment personnel</option>
      </NativeSelect>

      {item.itemKind === "canonical_food" ? (
        <div className="space-y-2">
          <Label htmlFor={`item-search-${index}`}>Rechercher un aliment</Label>
          <div className="flex gap-2">
            <Input
              id={`item-search-${index}`}
              value={item.searchQuery}
              onChange={(event) => update({ searchQuery: event.target.value })}
              placeholder="ex. ail, huile, poulet"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void searchCanonicalFoods();
              }}
            >
              {item.searchLoading ? "Recherche…" : "Chercher"}
            </Button>
          </div>
          {item.selectedLabel && (
            <p className="text-sm text-muted-foreground">
              Sélection: {item.selectedLabel}
            </p>
          )}
          {item.searchError && (
            <p className="text-sm text-destructive">{item.searchError}</p>
          )}
          {item.searchResults.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.searchResults.map((result) => (
                <Button
                  key={result.food_slug}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    update({
                      foodSlug: result.food_slug,
                      selectedLabel: result.canonical_name_fr,
                      searchQuery: result.canonical_name_fr,
                      searchResults: [],
                    })
                  }
                >
                  {result.canonical_name_fr}
                </Button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {item.itemKind === "custom_food" ? (
        <div className="space-y-2">
          <Label htmlFor={`item-custom-food-${index}`}>Aliment personnel</Label>
          <NativeSelect
            id={`item-custom-food-${index}`}
            value={item.customFoodId}
            onChange={(event) => {
              const nextValue = event.target.value;
              const selected = customFoods.find(
                (customFood) => customFood.custom_food_id === nextValue,
              );
              update({
                customFoodId: nextValue,
                selectedLabel: selected?.label ?? "",
              });
            }}
          >
            <option value="">Choisir…</option>
            {customFoods.map((customFood) => (
              <option
                key={customFood.custom_food_id}
                value={customFood.custom_food_id}
              >
                {customFood.label}
              </option>
            ))}
          </NativeSelect>
        </div>
      ) : null}

      {item.itemKind === "free_text" ? (
        <div className="space-y-2">
          <Label htmlFor={`item-free-text-${index}`}>Libellé libre</Label>
          <Input
            id={`item-free-text-${index}`}
            value={item.freeTextLabel}
            onChange={(event) =>
              update({
                freeTextLabel: event.target.value,
                selectedLabel: event.target.value,
              })
            }
            placeholder="ex. salade verte"
          />
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`item-quantity-${index}`}>Quantité</Label>
          <Input
            id={`item-quantity-${index}`}
            value={item.quantityText}
            onChange={(event) => update({ quantityText: event.target.value })}
            placeholder="ex. 120 g"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`item-note-${index}`}>Note</Label>
          <Input
            id={`item-note-${index}`}
            value={item.note}
            onChange={(event) => update({ note: event.target.value })}
            placeholder="optionnel"
          />
        </div>
      </div>
    </div>
  );
}

type TrackingHubClientMode =
  | { mode: "preview"; userId: string }
  | { mode: "runtime" };

interface TrackingHubClientProps {
  auth: TrackingHubClientMode;
}

function TrackingHubClientInner({ auth }: { auth: ProtectedApiAuth }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feed, setFeed] = useState<TrackingFeedResponse | null>(null);
  const [summary, setSummary] = useState<WeeklyTrackingSummaryResponse | null>(
    null,
  );
  const [customFoods, setCustomFoods] = useState<CustomFood[]>([]);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);

  const [symptomDialogOpen, setSymptomDialogOpen] = useState(false);
  const [mealDialogOpen, setMealDialogOpen] = useState(false);
  const [customFoodDialogOpen, setCustomFoodDialogOpen] = useState(false);
  const [savedMealDialogOpen, setSavedMealDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
    null,
  );

  const [editingSymptom, setEditingSymptom] = useState<SymptomLog | null>(null);
  const [editingMeal, setEditingMeal] = useState<MealLog | null>(null);
  const [editingCustomFood, setEditingCustomFood] = useState<CustomFood | null>(
    null,
  );
  const [editingSavedMeal, setEditingSavedMeal] = useState<SavedMeal | null>(
    null,
  );

  const [symptomForm, setSymptomForm] = useState(createEmptySymptomForm);
  const [mealForm, setMealForm] = useState(createEmptyMealForm);
  const [customFoodForm, setCustomFoodForm] = useState(
    createEmptyCustomFoodForm,
  );
  const [savedMealForm, setSavedMealForm] = useState(createEmptySavedMealForm);

  const anchorDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextFeed, nextSummary, nextCustomFoods, nextSavedMeals] =
        await Promise.all([
          getTrackingFeed(auth, 50),
          getWeeklyTrackingSummary(auth, anchorDate),
          listTrackingCustomFoods(auth),
          listTrackingSavedMeals(auth),
        ]);
      setFeed(nextFeed);
      setSummary(nextSummary);
      setCustomFoods(nextCustomFoods);
      setSavedMeals(nextSavedMeals);
    } catch (nextError) {
      setError(formatError(nextError));
    } finally {
      setLoading(false);
    }
  }, [anchorDate, auth]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const resetDialogs = () => {
    setEditingSymptom(null);
    setEditingMeal(null);
    setEditingCustomFood(null);
    setEditingSavedMeal(null);
    setSymptomForm(createEmptySymptomForm());
    setMealForm(createEmptyMealForm());
    setCustomFoodForm(createEmptyCustomFoodForm());
    setSavedMealForm(createEmptySavedMealForm());
    setActionError(null);
  };

  const refreshAfterMutation = async () => {
    await loadData();
    resetDialogs();
    setPendingDelete(null);
    setSymptomDialogOpen(false);
    setMealDialogOpen(false);
    setCustomFoodDialogOpen(false);
    setSavedMealDialogOpen(false);
  };

  const submitSymptom = async () => {
    setSubmitting(true);
    setActionError(null);
    try {
      const payload: SymptomLogCreateRequest = {
        symptom_type: symptomForm.symptomType,
        severity: Number(symptomForm.severity),
        noted_at_utc: new Date(symptomForm.notedAtUtc).toISOString(),
        note: normalizeText(symptomForm.note),
      };
      if (editingSymptom) {
        const updatePayload: SymptomLogUpdateRequest = { ...payload };
        await updateTrackingSymptom(
          auth,
          editingSymptom.symptom_log_id,
          updatePayload,
        );
      } else {
        await createTrackingSymptom(auth, payload);
      }
      await refreshAfterMutation();
    } catch (nextError) {
      setActionError(formatError(nextError));
    } finally {
      setSubmitting(false);
    }
  };

  const submitMeal = async () => {
    setSubmitting(true);
    setActionError(null);
    try {
      const payload: MealLogCreateRequest = {
        title: normalizeText(mealForm.title),
        occurred_at_utc: new Date(mealForm.occurredAtUtc).toISOString(),
        note: normalizeText(mealForm.note),
        items: mealForm.items.map(buildTrackingItemPayload),
      };
      if (editingMeal) {
        const updatePayload: MealLogUpdateRequest = { ...payload };
        await updateTrackingMeal(auth, editingMeal.meal_log_id, updatePayload);
      } else {
        await createTrackingMeal(auth, payload);
      }
      await refreshAfterMutation();
    } catch (nextError) {
      setActionError(formatError(nextError));
    } finally {
      setSubmitting(false);
    }
  };

  const submitCustomFood = async () => {
    setSubmitting(true);
    setActionError(null);
    try {
      const payload: CustomFoodCreateRequest = {
        label: customFoodForm.label,
        note: normalizeText(customFoodForm.note),
      };
      if (editingCustomFood) {
        const updatePayload: CustomFoodUpdateRequest = { ...payload };
        await updateTrackingCustomFood(
          auth,
          editingCustomFood.custom_food_id,
          updatePayload,
        );
      } else {
        await createTrackingCustomFood(auth, payload);
      }
      await refreshAfterMutation();
    } catch (nextError) {
      setActionError(formatError(nextError));
    } finally {
      setSubmitting(false);
    }
  };

  const submitSavedMeal = async () => {
    setSubmitting(true);
    setActionError(null);
    try {
      const payload: SavedMealCreateRequest = {
        label: savedMealForm.label,
        note: normalizeText(savedMealForm.note),
        items: savedMealForm.items.map(buildTrackingItemPayload),
      };
      if (editingSavedMeal) {
        const updatePayload: SavedMealUpdateRequest = { ...payload };
        await updateTrackingSavedMeal(
          auth,
          editingSavedMeal.saved_meal_id,
          updatePayload,
        );
      } else {
        await createTrackingSavedMeal(auth, payload);
      }
      await refreshAfterMutation();
    } catch (nextError) {
      setActionError(formatError(nextError));
    } finally {
      setSubmitting(false);
    }
  };

  const updateMealItem = (index: number, nextItem: EditableItem) => {
    setMealForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? nextItem : item,
      ),
    }));
  };

  const updateSavedMealItem = (index: number, nextItem: EditableItem) => {
    setSavedMealForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? nextItem : item,
      ),
    }));
  };

  const removeMealItem = (index: number) => {
    setMealForm((current) => ({
      ...current,
      items:
        current.items.length === 1
          ? [createEmptyItem()]
          : current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const removeSavedMealItem = (index: number) => {
    setSavedMealForm((current) => ({
      ...current,
      items:
        current.items.length === 1
          ? [createEmptyItem()]
          : current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const requestDeleteSymptom = (symptom: SymptomLog) => {
    setActionError(null);
    setPendingDelete({
      kind: "symptom",
      item: symptom,
      title: "Supprimer ce symptôme ?",
      description: "Cette entrée sera retirée de ton journal personnel.",
    });
  };

  const requestDeleteMeal = (meal: MealLog) => {
    setActionError(null);
    setPendingDelete({
      kind: "meal",
      item: meal,
      title: "Supprimer ce repas ?",
      description: "Ce repas sera retiré de ton historique personnel.",
    });
  };

  const requestDeleteCustomFood = (customFood: CustomFood) => {
    setActionError(null);
    setPendingDelete({
      kind: "custom_food",
      item: customFood,
      title: "Supprimer cet aliment personnel ?",
      description:
        "Cet aliment sera retiré de ta bibliothèque. Les repas déjà enregistrés gardent leur libellé historique.",
    });
  };

  const requestDeleteSavedMeal = (savedMeal: SavedMeal) => {
    setActionError(null);
    setPendingDelete({
      kind: "saved_meal",
      item: savedMeal,
      title: "Supprimer ce modèle de repas ?",
      description:
        "Ce modèle sera retiré de ta bibliothèque privée, sans modifier les repas déjà enregistrés.",
    });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) {
      return;
    }

    setSubmitting(true);
    setActionError(null);
    try {
      switch (pendingDelete.kind) {
        case "symptom":
          await deleteTrackingSymptom(auth, pendingDelete.item.symptom_log_id);
          break;
        case "meal":
          await deleteTrackingMeal(auth, pendingDelete.item.meal_log_id);
          break;
        case "custom_food":
          await deleteTrackingCustomFood(
            auth,
            pendingDelete.item.custom_food_id,
          );
          break;
        case "saved_meal":
          await deleteTrackingSavedMeal(auth, pendingDelete.item.saved_meal_id);
          break;
      }
      await loadData();
      setPendingDelete(null);
    } catch (nextError) {
      setActionError(formatError(nextError));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chargement du suivi…</CardTitle>
          <CardDescription>
            Historique, résumé et formulaires en cours de chargement.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Suivi indisponible</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {actionError ? (
        <Alert variant="destructive">
          <AlertTitle>Action impossible</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>
            Ajoute un repas, un symptôme ou enrichis ta bibliothèque
            personnelle.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            onClick={() => {
              setEditingMeal(null);
              setMealForm(createEmptyMealForm());
              setMealDialogOpen(true);
            }}
          >
            Ajouter un repas
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setEditingSymptom(null);
              setSymptomForm(createEmptySymptomForm());
              setSymptomDialogOpen(true);
            }}
          >
            Ajouter un symptôme
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setEditingCustomFood(null);
              setCustomFoodForm(createEmptyCustomFoodForm());
              setCustomFoodDialogOpen(true);
            }}
          >
            Ajouter un aliment perso
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setEditingSavedMeal(null);
              setSavedMealForm(createEmptySavedMealForm());
              setSavedMealDialogOpen(true);
            }}
          >
            Ajouter un modèle repas
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Résumé hebdomadaire</CardTitle>
          <CardDescription>
            Vue descriptive sur 7 jours: volumes, sévérité et repas proches des
            symptômes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Badge>Gravité moyenne: {summary?.severity.average ?? "—"}</Badge>
            <Badge variant="outline">
              Gravité max: {summary?.severity.maximum ?? "—"}
            </Badge>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Par jour</h3>
            <ul className="space-y-2">
              {summary?.daily_counts.map((day) => (
                <li
                  key={day.date}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <span>{day.date}</span>
                  <span>
                    {day.meal_count} repas · {day.symptom_count} symptômes
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Types de symptômes</h3>
            {summary?.symptom_counts.length ? (
              <div className="flex flex-wrap gap-2">
                {summary.symptom_counts.map((item) => (
                  <Badge key={item.symptom_type} variant="outline">
                    {item.symptom_type}: {item.count}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun symptôme sur la période.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Repas proches des symptômes</h3>
            {summary?.proximity_groups.length ? (
              <div className="space-y-3">
                {summary.proximity_groups.map((group) => (
                  <div
                    key={group.symptom_log_id}
                    className="space-y-2 rounded-lg border p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">
                        {group.symptom_type} · intensité {group.severity}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatFeedTimestamp(group.noted_at_utc)}
                      </span>
                    </div>
                    {group.nearby_meals.length ? (
                      <ul className="space-y-2 text-sm">
                        {group.nearby_meals.map((meal) => (
                          <li key={meal.meal_log_id}>
                            {meal.title ?? "Repas"} ·{" "}
                            {meal.hours_before_symptom} h avant ·{" "}
                            {meal.item_labels.join(", ")}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Aucun repas dans la fenêtre de 6 heures.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Les proximités apparaîtront ici après quelques entrées.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique</CardTitle>
          <CardDescription>
            Journal des repas et symptômes, trié du plus récent au plus ancien.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {feed?.items.length ? (
            feed.items.map((entry) => {
              if (entry.entry_type === "meal" && entry.meal) {
                const meal = entry.meal;

                return (
                  <div
                    key={`meal-${meal.meal_log_id}`}
                    className="space-y-2 rounded-lg border p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{meal.title ?? "Repas"}</p>
                        <p className="text-sm text-muted-foreground">
                          {meal.items.map((item) => item.label).join(", ")}
                        </p>
                      </div>
                      <Badge variant="outline">Repas</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatFeedTimestamp(meal.occurred_at_utc)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingMeal(meal);
                          setMealForm(buildMealForm(meal));
                          setMealDialogOpen(true);
                        }}
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => requestDeleteMeal(meal)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                );
              }

              if (entry.symptom) {
                const symptom = entry.symptom;

                return (
                  <div
                    key={`symptom-${symptom.symptom_log_id}`}
                    className="space-y-2 rounded-lg border p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          {symptom.symptom_type} · intensité {symptom.severity}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {symptom.note ?? "Sans note"}
                        </p>
                      </div>
                      <Badge variant="outline">Symptôme</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatFeedTimestamp(symptom.noted_at_utc)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingSymptom(symptom);
                          setSymptomForm(buildSymptomForm(symptom));
                          setSymptomDialogOpen(true);
                        }}
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => requestDeleteSymptom(symptom)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                );
              }

              return null;
            })
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun historique pour le moment.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Aliments personnels</CardTitle>
            <CardDescription>
              Référentiel privé pour les aliments absents du catalogue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {customFoods.length ? (
              customFoods.map((customFood) => (
                <div
                  key={customFood.custom_food_id}
                  className="space-y-2 rounded-lg border p-3"
                >
                  <p className="font-medium">{customFood.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {customFood.note ?? "Sans note"}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCustomFood(customFood);
                        setCustomFoodForm({
                          label: customFood.label,
                          note: customFood.note ?? "",
                        });
                        setCustomFoodDialogOpen(true);
                      }}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => requestDeleteCustomFood(customFood)}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun aliment personnel enregistré.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modèles de repas</CardTitle>
            <CardDescription>
              Modèles réutilisables pour les repas fréquents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {savedMeals.length ? (
              savedMeals.map((savedMeal) => (
                <div
                  key={savedMeal.saved_meal_id}
                  className="space-y-2 rounded-lg border p-3"
                >
                  <p className="font-medium">{savedMeal.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {savedMeal.items.map((item) => item.label).join(", ")}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingSavedMeal(savedMeal);
                        setSavedMealForm(buildSavedMealForm(savedMeal));
                        setSavedMealDialogOpen(true);
                      }}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingMeal(null);
                        setMealForm({
                          title: savedMeal.label,
                          occurredAtUtc: nowDateInputValue(),
                          note: savedMeal.note ?? "",
                          items: savedMeal.items.map(toEditableItem),
                        });
                        setMealDialogOpen(true);
                      }}
                    >
                      Utiliser comme repas
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => requestDeleteSavedMeal(savedMeal)}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun modèle enregistré.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingDelete?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              onClick={() => {
                void confirmDelete();
              }}
            >
              {submitting ? "Suppression…" : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={symptomDialogOpen} onOpenChange={setSymptomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSymptom ? "Modifier le symptôme" : "Ajouter un symptôme"}
            </DialogTitle>
            <DialogDescription>
              Entrée descriptive: type, intensité et note optionnelle.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="symptom-type">Type</Label>
              <NativeSelect
                id="symptom-type"
                value={symptomForm.symptomType}
                onChange={(event) =>
                  setSymptomForm((current) => ({
                    ...current,
                    symptomType: event.target
                      .value as SymptomFormState["symptomType"],
                  }))
                }
              >
                {SYMPTOM_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="symptom-severity">Intensité (0-10)</Label>
                <Input
                  id="symptom-severity"
                  type="number"
                  min={0}
                  max={10}
                  value={symptomForm.severity}
                  onChange={(event) =>
                    setSymptomForm((current) => ({
                      ...current,
                      severity: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="symptom-noted-at">Date / heure</Label>
                <Input
                  id="symptom-noted-at"
                  type="datetime-local"
                  value={symptomForm.notedAtUtc}
                  onChange={(event) =>
                    setSymptomForm((current) => ({
                      ...current,
                      notedAtUtc: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="symptom-note">Note</Label>
              <Textarea
                id="symptom-note"
                value={symptomForm.note}
                onChange={(event) =>
                  setSymptomForm((current) => ({
                    ...current,
                    note: event.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSymptomDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={() => void submitSymptom()} disabled={submitting}>
              {submitting ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mealDialogOpen} onOpenChange={setMealDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingMeal ? "Modifier le repas" : "Ajouter un repas"}
            </DialogTitle>
            <DialogDescription>
              Historique structuré avec aliments référencés, personnels ou texte
              libre.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="meal-title">Titre</Label>
                <Input
                  id="meal-title"
                  value={mealForm.title}
                  onChange={(event) =>
                    setMealForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="ex. Déjeuner"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meal-occurred-at">Date / heure</Label>
                <Input
                  id="meal-occurred-at"
                  type="datetime-local"
                  value={mealForm.occurredAtUtc}
                  onChange={(event) =>
                    setMealForm((current) => ({
                      ...current,
                      occurredAtUtc: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="meal-note">Note</Label>
              <Textarea
                id="meal-note"
                value={mealForm.note}
                onChange={(event) =>
                  setMealForm((current) => ({
                    ...current,
                    note: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium">Items du repas</h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setMealForm((current) => ({
                      ...current,
                      items: [...current.items, createEmptyItem()],
                    }))
                  }
                >
                  Ajouter un item
                </Button>
              </div>
              {mealForm.items.map((item, index) => (
                <TrackingItemEditor
                  key={`meal-item-${index}`}
                  item={item}
                  index={index}
                  customFoods={customFoods}
                  onChange={updateMealItem}
                  onRemove={removeMealItem}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMealDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => void submitMeal()} disabled={submitting}>
              {submitting ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={customFoodDialogOpen}
        onOpenChange={setCustomFoodDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCustomFood
                ? "Modifier l’aliment personnel"
                : "Ajouter un aliment personnel"}
            </DialogTitle>
            <DialogDescription>
              Ces aliments restent privés à ton compte.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="custom-food-label">Libellé</Label>
              <Input
                id="custom-food-label"
                value={customFoodForm.label}
                onChange={(event) =>
                  setCustomFoodForm((current) => ({
                    ...current,
                    label: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-food-note">Note</Label>
              <Textarea
                id="custom-food-note"
                value={customFoodForm.note}
                onChange={(event) =>
                  setCustomFoodForm((current) => ({
                    ...current,
                    note: event.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCustomFoodDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={() => void submitCustomFood()}
              disabled={submitting}
            >
              {submitting ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={savedMealDialogOpen} onOpenChange={setSavedMealDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingSavedMeal
                ? "Modifier le modèle de repas"
                : "Ajouter un modèle de repas"}
            </DialogTitle>
            <DialogDescription>
              Modèle réutilisable pour construire de futurs repas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="saved-meal-label">Libellé</Label>
                <Input
                  id="saved-meal-label"
                  value={savedMealForm.label}
                  onChange={(event) =>
                    setSavedMealForm((current) => ({
                      ...current,
                      label: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="saved-meal-note">Note</Label>
                <Input
                  id="saved-meal-note"
                  value={savedMealForm.note}
                  onChange={(event) =>
                    setSavedMealForm((current) => ({
                      ...current,
                      note: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium">Items du modèle</h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setSavedMealForm((current) => ({
                      ...current,
                      items: [...current.items, createEmptyItem()],
                    }))
                  }
                >
                  Ajouter un item
                </Button>
              </div>
              {savedMealForm.items.map((item, index) => (
                <TrackingItemEditor
                  key={`saved-meal-item-${index}`}
                  item={item}
                  index={index}
                  customFoods={customFoods}
                  onChange={updateSavedMealItem}
                  onRemove={removeSavedMealItem}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSavedMealDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={() => void submitSavedMeal()}
              disabled={submitting}
            >
              {submitting ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RuntimeTrackingHubClient() {
  const { getToken } = useAuth();
  const auth = useMemo<ProtectedApiAuth>(
    () => ({
      mode: "runtime",
      getToken: async () => getToken(),
    }),
    [getToken],
  );

  return <TrackingHubClientInner auth={auth} />;
}

export default function TrackingHubClient({ auth }: TrackingHubClientProps) {
  if (auth.mode === "runtime") {
    return <RuntimeTrackingHubClient />;
  }

  return (
    <TrackingHubClientInner auth={{ mode: "preview", userId: auth.userId }} />
  );
}
