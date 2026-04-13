import { useCallback, useEffect, useMemo, useState } from "react";

import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useAuth } from "../auth/useAuth";
import { Card, Screen, StateView } from "../components/ui";
import {
  type ConsentRepository,
  createConsentRepository,
  type TrackingConsentState,
} from "../data/consentRepository";
import {
  type CreateMealItemInput,
  createTrackingRepository,
  type TrackingRepository,
} from "../data/trackingRepository";
import { useTheme } from "../theme/ThemeContext";
import { type RNColors, theme } from "../theme/tokens";
import {
  buildCreateMealConsentGate,
  canSubmitCreateMeal,
  formatCreateMealDefaultTime,
  isConsentLockedError,
  mapCreateMealSubmissionError,
  submitCreateMealForm,
} from "./trackingScreenLogic";

function createStyles(colors: RNColors) {
  return StyleSheet.create({
    actions: {
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    currentTimePill: {
      alignSelf: "flex-start",
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.border,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    currentTimePillText: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: "600",
    },
    helper: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 21,
    },
    input: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      color: colors.text,
      fontSize: 17,
      minHeight: 54,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    inputGroup: {
      gap: theme.spacing.xs,
    },
    itemHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      gap: theme.spacing.sm,
    },
    itemTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "700",
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    itemsStack: {
      gap: theme.spacing.sm,
    },
    label: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "700",
    },
    primaryAction: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: theme.radius.sm,
      justifyContent: "center",
      minHeight: 52,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
    },
    primaryActionDisabled: {
      opacity: 0.5,
    },
    primaryActionLabel: {
      color: colors.accentFg,
      fontSize: 18,
      fontWeight: "700",
    },
    secondaryAction: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 48,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
    },
    secondaryActionLabel: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
    },
    status: {
      color: colors.textMuted,
      fontSize: 15,
      textAlign: "center",
    },
    tertiaryAction: {
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 42,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
    },
    tertiaryActionLabel: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "600",
    },
  });
}

function createEmptyMealItem(): CreateMealItemInput {
  return {
    label: "",
    quantityText: "",
  };
}

export function CreateMealScreen({
  onCreated,
  repository,
  consentRepository,
}: {
  onCreated: () => void;
  repository?: TrackingRepository;
  consentRepository?: ConsentRepository;
}) {
  const auth = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const consentDataRepository = useMemo(
    () => consentRepository ?? createConsentRepository(auth.getToken),
    [auth.getToken, consentRepository],
  );
  const trackingRepository = useMemo(
    () => repository ?? createTrackingRepository(auth.getToken),
    [auth.getToken, repository],
  );
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<CreateMealItemInput[]>([
    createEmptyMealItem(),
  ]);
  const [consentState, setConsentState] = useState<TrackingConsentState | null>(
    null,
  );
  const [consentLoading, setConsentLoading] = useState(true);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const defaultTimeLabel = useMemo(() => formatCreateMealDefaultTime(), []);

  const refreshConsentState = useCallback(async () => {
    setConsentLoading(true);
    setConsentError(null);

    try {
      setConsentState(await consentDataRepository.getConsentState());
    } catch {
      setConsentError("Could not verify whether meal logging is enabled.");
    } finally {
      setConsentLoading(false);
    }
  }, [consentDataRepository]);

  useEffect(() => {
    if (!auth.isSignedIn) {
      return;
    }

    void refreshConsentState();
  }, [auth.isSignedIn, refreshConsentState]);

  if (!auth.isSignedIn) {
    return <StateView message="Sign in to create a meal entry." />;
  }

  const handleSubmit = async () => {
    const canSubmit = canSubmitCreateMeal(consentState, submitting);
    if (!canSubmit) {
      setStatusMessage("Meal logging is disabled until you enable consent.");
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    try {
      const nextStatusMessage = await submitCreateMealForm(
        trackingRepository,
        {
          title,
          note,
          items,
        },
        onCreated,
      );
      setStatusMessage(nextStatusMessage);
    } catch (createError) {
      if (isConsentLockedError(createError)) {
        setConsentState({
          canCreateSymptoms: consentState?.canCreateSymptoms ?? false,
          canCreateMeals: false,
          isActive: false,
          missingScope: "diet_logs",
          scope: {},
          status: "locked",
        });
      }
      setStatusMessage(mapCreateMealSubmissionError(createError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnableTracking = async () => {
    setUnlocking(true);
    setStatusMessage(null);

    try {
      setConsentState(await consentDataRepository.enableTracking());
    } catch {
      setStatusMessage("Could not enable tracking right now. Try again.");
    } finally {
      setUnlocking(false);
    }
  };

  const updateItem = (
    index: number,
    key: keyof CreateMealItemInput,
    value: string,
  ) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    );
  };

  const addItem = () => {
    setItems((current) => [...current, createEmptyMealItem()]);
  };

  const removeItem = (index: number) => {
    setItems((current) =>
      current.length === 1
        ? [createEmptyMealItem()]
        : current.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  if (consentLoading && consentState === null && !consentError) {
    return (
      <StateView
        loading
        message="Checking whether meal logging is enabled..."
      />
    );
  }

  if (consentError && consentState === null) {
    return (
      <StateView
        message={consentError}
        action={() => {
          void refreshConsentState();
        }}
      />
    );
  }

  const consentGate = buildCreateMealConsentGate(consentState);
  const canSubmit = canSubmitCreateMeal(consentState, submitting);

  if (consentGate.isLocked) {
    return (
      <Screen
        title="Create meal"
        subtitle="Meal logging stays locked until this account enables consent."
        scroll
      >
        <Card>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Meal logging locked</Text>
            <Text style={styles.helper}>{consentGate.message}</Text>
            <Text style={styles.helper}>
              Enable tracking once, then return here to save your first meal.
            </Text>
          </View>
        </Card>

        <View style={styles.actions}>
          <Pressable
            disabled={unlocking}
            onPress={() => {
              void handleEnableTracking();
            }}
            style={[
              styles.primaryAction,
              unlocking && styles.primaryActionDisabled,
            ]}
            testID="enable-meal-tracking-submit"
          >
            <Text style={styles.primaryActionLabel}>
              {unlocking ? "Enabling tracking…" : "Enable tracking"}
            </Text>
          </Pressable>
          <Pressable
            onPress={onCreated}
            style={styles.secondaryAction}
            testID="create-meal-cancel"
          >
            <Text style={styles.secondaryActionLabel}>Cancel</Text>
          </Pressable>
        </View>

        {statusMessage ? (
          <Text style={styles.status}>{statusMessage}</Text>
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen
      title="Create meal"
      subtitle="Log what you ate with simple items and save it to your tracking feed."
      scroll
    >
      <Card>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Meal items</Text>
          <Text style={styles.helper}>
            Add at least one item. The meal will be saved for {defaultTimeLabel}
            .
          </Text>
          <View style={styles.currentTimePill}>
            <Text style={styles.currentTimePillText}>
              Saved for now at {defaultTimeLabel}
            </Text>
          </View>
        </View>

        <View style={styles.itemsStack}>
          {items.map((item, index) => (
            <View key={`meal-item-${index}`} style={styles.inputGroup}>
              <View style={styles.itemHeader}>
                {index > 0 ? (
                  <Text style={styles.itemTitle}>Item {index + 1}</Text>
                ) : (
                  <View />
                )}
                {items.length > 1 ? (
                  <Pressable
                    onPress={() => {
                      removeItem(index);
                    }}
                    style={styles.tertiaryAction}
                    testID={`meal-item-remove-${index}`}
                  >
                    <Text style={styles.tertiaryActionLabel}>Remove</Text>
                  </Pressable>
                ) : null}
              </View>
              <TextInput
                onChangeText={(value) => {
                  updateItem(index, "label", value);
                }}
                placeholder="What did you eat?"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                testID={`meal-item-label-${index}`}
                value={item.label}
              />
              <TextInput
                onChangeText={(value) => {
                  updateItem(index, "quantityText", value);
                }}
                placeholder="Optional amount"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                testID={`meal-item-quantity-${index}`}
                value={item.quantityText ?? ""}
              />
            </View>
          ))}
        </View>

        <Pressable
          onPress={addItem}
          style={styles.tertiaryAction}
          testID="meal-item-add"
        >
          <Text style={styles.tertiaryActionLabel}>Add another item</Text>
        </Pressable>
      </Card>

      <Card>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Optional details</Text>
          <Text style={styles.helper}>
            Add a short title or note only if it helps you recognize this meal
            later.
          </Text>
          <TextInput
            onChangeText={setTitle}
            placeholder="Optional title"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            testID="meal-title-input"
            value={title}
          />
          <TextInput
            multiline
            onChangeText={setNote}
            placeholder="Optional note"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { minHeight: 110, textAlignVertical: "top" }]}
            testID="meal-note-input"
            value={note}
          />
        </View>
      </Card>

      <View style={styles.actions}>
        <Pressable
          disabled={!canSubmit}
          onPress={() => {
            void handleSubmit();
          }}
          style={[
            styles.primaryAction,
            !canSubmit && styles.primaryActionDisabled,
          ]}
          testID="create-meal-submit"
        >
          <Text style={styles.primaryActionLabel}>
            {submitting ? "Saving meal…" : "Save meal"}
          </Text>
        </Pressable>
        <Pressable
          onPress={onCreated}
          style={styles.secondaryAction}
          testID="create-meal-cancel"
        >
          <Text style={styles.secondaryActionLabel}>Cancel</Text>
        </Pressable>
      </View>

      {statusMessage ? (
        <Text style={styles.status}>{statusMessage}</Text>
      ) : null}
    </Screen>
  );
}
