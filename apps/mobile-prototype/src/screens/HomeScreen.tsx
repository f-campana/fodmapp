import { useCallback, useEffect, useState } from "react";

import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { Card, PrimaryButton, Screen, StateView } from "../components/ui";
import { getDashboardSnapshot } from "../data/repository";
import { rnTheme } from "../theme/rn-adapter";
import { theme } from "../theme/tokens";

export function HomeScreen({ onBrowse }: { onBrowse: () => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<{
    trackedFoods: number;
    highRiskFoods: number;
    availableSwaps: number;
  } | null>(null);
  const [fadeAnim] = useState(() => new Animated.Value(0));

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    fadeAnim.setValue(0);
    try {
      setData(await getDashboardSnapshot());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [fadeAnim]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (data) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: rnTheme.motion.duration.normal,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [data, fadeAnim]);

  if (loading) {
    return <StateView loading message="Building your dashboard..." />;
  }
  if (error || !data) {
    return (
      <StateView
        message="Unable to load dashboard."
        action={() => {
          void load();
        }}
      />
    );
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <Screen
        title="Today"
        subtitle="Your personalized low-FODMAP dashboard"
        scroll
      >
        <Card style={styles.heroCard}>
          <Text style={styles.kicker}>Today&apos;s focus</Text>
          <Text style={styles.metric}>
            {data.highRiskFoods} high-risk foods to replace
          </Text>
          <Text style={styles.muted}>
            Tap below to explore swaps with the strongest symptom-relief
            potential.
          </Text>
          <PrimaryButton label="Browse foods" onPress={onBrowse} />
        </Card>

        <View style={styles.row}>
          <Card style={[styles.statCard, styles.flex]}>
            <Text style={styles.stat}>{data.trackedFoods}</Text>
            <Text style={styles.muted}>Tracked foods</Text>
          </Card>
          <Card style={[styles.statCard, styles.flex]}>
            <Text style={styles.stat}>{data.availableSwaps}</Text>
            <Text style={styles.muted}>Available swaps</Text>
          </Card>
        </View>

        <Card style={styles.tipCard}>
          <Text style={styles.tipTitle}>Quick tip</Text>
          <Text style={styles.muted}>
            Start by replacing one high-risk staple this week and track how you
            feel.
          </Text>
        </Card>
      </Screen>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  heroCard: {
    backgroundColor: rnTheme.color.surfaceRaised,
    borderLeftWidth: 3,
    borderLeftColor: rnTheme.color.accent,
  },
  kicker: {
    color: theme.color.accentStrong,
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  metric: {
    color: theme.color.text,
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
    marginTop: 8,
  },
  muted: {
    color: theme.color.textMuted,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: theme.spacing.sm,
  },
  row: { flexDirection: "row", gap: theme.spacing.sm },
  stat: { color: theme.color.text, fontSize: 34, fontWeight: "800" },
  statCard: { justifyContent: "flex-end", minHeight: 130 },
  tipCard: { backgroundColor: rnTheme.color.surfaceMuted },
  tipTitle: {
    color: theme.color.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
});
