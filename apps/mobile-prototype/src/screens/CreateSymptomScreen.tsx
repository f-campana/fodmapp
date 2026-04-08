import { useMemo, useState } from "react";

import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { type SymptomType } from "@fodmapp/domain";

import { useAuth } from "../auth/useAuth";
import { Card, Screen, StateView } from "../components/ui";
import {
  createTrackingRepository,
  type TrackingRepository,
} from "../data/trackingRepository";
import { useTheme } from "../theme/ThemeContext";
import { type RNColors, theme } from "../theme/tokens";
import { submitCreateSymptomForm } from "./trackingScreenLogic";

const SYMPTOM_OPTIONS: Array<{ value: SymptomType; label: string }> = [
  { value: "bloating", label: "Bloating" },
  { value: "pain", label: "Pain" },
  { value: "gas", label: "Gas" },
  { value: "diarrhea", label: "Diarrhea" },
  { value: "constipation", label: "Constipation" },
  { value: "nausea", label: "Nausea" },
  { value: "reflux", label: "Reflux" },
  { value: "other", label: "Other" },
];

function createStyles(colors: RNColors) {
  return StyleSheet.create({
    actions: {
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    chip: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      minHeight: 42,
      justifyContent: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    chipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    chipLabel: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "600",
    },
    chipLabelActive: {
      color: colors.accentFg,
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
    tags: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.xs,
    },
  });
}

export function CreateSymptomScreen({
  onCreated,
  repository,
}: {
  onCreated: () => void;
  repository?: TrackingRepository;
}) {
  const auth = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const trackingRepository = useMemo(
    () => repository ?? createTrackingRepository(auth.getToken),
    [auth.getToken, repository],
  );
  const [symptomType, setSymptomType] = useState<SymptomType>("bloating");
  const [severity, setSeverity] = useState("0");
  const [note, setNote] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!auth.isSignedIn) {
    return <StateView message="Sign in to create a symptom entry." />;
  }

  const handleSubmit = async () => {
    setSubmitting(true);
    setStatusMessage(null);

    try {
      const nextStatusMessage = await submitCreateSymptomForm(
        trackingRepository,
        {
          symptomType,
          severity,
          note,
        },
        onCreated,
      );
      setStatusMessage(nextStatusMessage);
    } catch (createError) {
      setStatusMessage(
        createError instanceof Error
          ? createError.message
          : "Could not create symptom entry.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      title="Create symptom"
      subtitle="Add one symptom entry to prove the first protected tracking write flow."
      scroll
    >
      <Card>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Symptom type</Text>
          <View style={styles.tags}>
            {SYMPTOM_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  setSymptomType(option.value);
                }}
                style={[
                  styles.chip,
                  option.value === symptomType && styles.chipActive,
                ]}
                testID={`symptom-option-${option.value}`}
              >
                <Text
                  style={[
                    styles.chipLabel,
                    option.value === symptomType && styles.chipLabelActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Card>

      <Card>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Intensity</Text>
          <TextInput
            keyboardType="number-pad"
            onChangeText={setSeverity}
            placeholder="0 to 10"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            testID="symptom-severity-input"
            value={severity}
          />
          <Text style={styles.helper}>
            Use a simple whole number. 0 means no discomfort, 10 means maximum
            intensity.
          </Text>
        </View>
      </Card>

      <Card>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Note</Text>
          <TextInput
            multiline
            onChangeText={setNote}
            placeholder="Optional note"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { minHeight: 110, textAlignVertical: "top" }]}
            testID="symptom-note-input"
            value={note}
          />
        </View>
      </Card>

      <View style={styles.actions}>
        <Pressable
          disabled={submitting}
          onPress={() => {
            void handleSubmit();
          }}
          style={[
            styles.primaryAction,
            submitting && styles.primaryActionDisabled,
          ]}
          testID="create-symptom-submit"
        >
          <Text style={styles.primaryActionLabel}>
            {submitting ? "Saving symptom…" : "Save symptom"}
          </Text>
        </Pressable>
        <Pressable
          onPress={onCreated}
          style={styles.secondaryAction}
          testID="create-symptom-cancel"
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
