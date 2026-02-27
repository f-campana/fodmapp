import { useMemo, useState } from "react";

import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "../components/ui";
import { theme } from "../theme/tokens";

const STEPS = [
  {
    icon: "🌿",
    title: "Welcome to your FODMAP coach",
    body: "This prototype helps you quickly compare common trigger foods with easier alternatives.",
  },
  {
    icon: "🔎",
    title: "Find better swaps fast",
    body: "Browse foods, open details, and review alternatives with clear risk levels.",
  },
  {
    icon: "⚙️",
    title: "Tailor your preferences",
    body: "Save strict mode and safe-swap settings so each launch feels personalized.",
  },
] as const;

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];
  const isLast = useMemo(() => stepIndex === STEPS.length - 1, [stepIndex]);

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <Text style={styles.brand}>FODMAP Prototype</Text>
      <Card style={styles.heroCard}>
        <Text style={styles.heroIcon}>{step.icon}</Text>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.body}>{step.body}</Text>
      </Card>

      <View style={styles.dots}>
        {STEPS.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index === stepIndex ? styles.dotActive : null]}
          />
        ))}
      </View>

      <View style={styles.actions}>
        {!isLast ? (
          <Pressable onPress={onComplete} style={styles.secondaryButton}>
            <Text style={styles.secondaryLabel}>Skip</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => {
            if (isLast) {
              onComplete();
              return;
            }
            setStepIndex((current) => current + 1);
          }}
          style={[styles.primaryButton, isLast ? styles.fullWidth : null]}
        >
          <Text style={styles.primaryLabel}>
            {isLast ? "Start prototype" : "Next"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  body: {
    color: theme.color.textMuted,
    fontSize: 18,
    lineHeight: 30,
    marginTop: theme.spacing.sm,
    textAlign: "center",
  },
  brand: {
    color: theme.color.accentStrong,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1,
    marginBottom: theme.spacing.md,
    textAlign: "center",
  },
  container: {
    backgroundColor: theme.color.canvas,
    flex: 1,
    justifyContent: "center",
    padding: theme.spacing.md,
  },
  dot: {
    backgroundColor: theme.color.border,
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  dotActive: {
    backgroundColor: theme.color.accent,
    width: 30,
  },
  dots: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.xs,
    justifyContent: "center",
    marginTop: theme.spacing.sm,
  },
  fullWidth: {
    flex: 1,
  },
  heroCard: {
    minHeight: 260,
  },
  heroIcon: {
    fontSize: 48,
    textAlign: "center",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.color.accent,
    borderRadius: theme.radius.sm,
    flex: 1,
    justifyContent: "center",
    minHeight: 56,
  },
  primaryLabel: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: theme.color.surface,
    borderColor: theme.color.border,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 56,
  },
  secondaryLabel: {
    color: theme.color.text,
    fontSize: 22,
    fontWeight: "600",
  },
  title: {
    color: theme.color.text,
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginTop: theme.spacing.sm,
    textAlign: "center",
  },
});
