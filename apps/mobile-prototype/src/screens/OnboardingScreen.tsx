import { useMemo, useState } from "react";

import {
  Animated,
  Easing,
  LayoutAnimation,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "../components/ui";
import { rnTheme } from "../theme/rn-adapter";
import { useTheme } from "../theme/ThemeContext";
import { type RNColors, theme } from "../theme/tokens";

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

function createStyles(colors: RNColors) {
  return StyleSheet.create({
    actions: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
    },
    body: {
      color: colors.textMuted,
      fontSize: 18,
      lineHeight: 30,
      marginTop: theme.spacing.sm,
      textAlign: "center",
    },
    brand: {
      color: colors.accentStrong,
      fontSize: 34,
      fontWeight: "800",
      letterSpacing: -1,
      marginBottom: theme.spacing.md,
      textAlign: "center",
    },
    container: {
      backgroundColor: colors.canvas,
      flex: 1,
      justifyContent: "center",
      padding: theme.spacing.md,
    },
    dot: {
      backgroundColor: colors.border,
      borderRadius: 999,
      height: 10,
      width: 10,
    },
    dotActive: {
      backgroundColor: colors.accent,
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
      backgroundColor: colors.accent,
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
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      flex: 1,
      justifyContent: "center",
      minHeight: 56,
    },
    secondaryLabel: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "600",
    },
    title: {
      color: colors.text,
      fontSize: 38,
      fontWeight: "800",
      letterSpacing: -0.8,
      marginTop: theme.spacing.sm,
      textAlign: "center",
    },
  });
}

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { colors } = useTheme();
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];
  const isLast = useMemo(() => stepIndex === STEPS.length - 1, [stepIndex]);
  const [contentOpacity] = useState(() => new Animated.Value(1));
  const styles = useMemo(() => createStyles(colors), [colors]);

  const advanceStep = () => {
    if (isLast) {
      onComplete();
      return;
    }
    Animated.timing(contentOpacity, {
      toValue: 0,
      duration: rnTheme.motion.duration.fast,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      LayoutAnimation.configureNext({
        duration: rnTheme.motion.duration.normal,
        update: { type: LayoutAnimation.Types.easeInEaseOut },
      });
      setStepIndex((i) => i + 1);
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: rnTheme.motion.duration.slow,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <Text style={styles.brand}>FODMAP Prototype</Text>
      <Animated.View style={{ opacity: contentOpacity }}>
        <Card style={styles.heroCard}>
          <Text style={styles.heroIcon}>{step.icon}</Text>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.body}>{step.body}</Text>
        </Card>
      </Animated.View>

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
          onPress={advanceStep}
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
