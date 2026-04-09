import { useCallback, useMemo, useState } from "react";

import { useFocusEffect } from "@react-navigation/native";

import { Pressable, StyleSheet, Text, View } from "react-native";

import type { TrackingFeedEntry, WeeklyTrackingSummary } from "@fodmapp/domain";

import { useAuth } from "../auth/useAuth";
import {
  Badge,
  Card,
  PrimaryButton,
  Screen,
  SectionTitle,
  StateView,
} from "../components/ui";
import {
  createHomeRepository,
  type HomeRepository,
} from "../data/homeRepository";
import { useTheme } from "../theme/ThemeContext";
import { type RNColors, theme } from "../theme/tokens";
import {
  buildHomeRecentActivityItems,
  buildHomeRecentActivitySubtitle,
  buildHomeWeeklySummary,
  formatHomeDate,
  resolveHomeActivityState,
} from "./homeScreenLogic";

function createStyles(colors: RNColors) {
  return StyleSheet.create({
    activityRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: theme.spacing.sm,
      justifyContent: "space-between",
    },
    activitySectionHeader: {
      alignItems: "flex-end",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    helper: {
      color: colors.textMuted,
      fontSize: 16,
      lineHeight: 22,
    },
    inlineAction: {
      paddingVertical: theme.spacing.xs,
    },
    inlineActionText: {
      color: colors.accent,
      fontSize: 16,
      fontWeight: "600",
    },
    note: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 21,
      marginTop: theme.spacing.xs,
    },
    secondaryAction: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 52,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
    },
    secondaryActionText: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "600",
    },
    sectionSubtitle: {
      color: colors.textMuted,
      fontSize: 15,
      marginBottom: theme.spacing.sm,
      marginTop: -theme.spacing.xs,
    },
    summaryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    summaryStat: {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.border,
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      flexGrow: 1,
      minWidth: 92,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    summaryStatLabel: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: "600",
      marginBottom: 2,
    },
    summaryStatValue: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "800",
    },
    title: {
      color: colors.text,
      flex: 1,
      fontSize: 19,
      fontWeight: "700",
    },
  });
}

export function HomeScreen({
  onBrowse,
  onCreateSymptom,
  onOpenTracking,
  repository,
}: {
  onBrowse: () => void;
  onCreateSymptom: () => void;
  onOpenTracking: () => void;
  repository?: HomeRepository;
}) {
  const auth = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const homeRepository = useMemo(
    () => repository ?? createHomeRepository(auth.getToken),
    [auth.getToken, repository],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentEntries, setRecentEntries] = useState<TrackingFeedEntry[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [weeklySummary, setWeeklySummary] =
    useState<WeeklyTrackingSummary | null>(null);
  const dateLabel = useMemo(() => formatHomeDate(), []);
  const recentActivityItems = useMemo(
    () => buildHomeRecentActivityItems(recentEntries),
    [recentEntries],
  );
  const weeklySummaryViewModel = useMemo(
    () => (weeklySummary ? buildHomeWeeklySummary(weeklySummary) : null),
    [weeklySummary],
  );
  const activityState = resolveHomeActivityState({
    loading,
    error,
    itemCount: recentActivityItems.length,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const homeData = await homeRepository.getHomeData();
      setRecentEntries(homeData.recentEntries);
      setTotalEntries(homeData.totalEntries);
      setWeeklySummary(homeData.weeklySummary);
    } catch (homeError) {
      setError(
        homeError instanceof Error
          ? homeError.message
          : "Could not load your recent activity.",
      );
    } finally {
      setLoading(false);
    }
  }, [homeRepository]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading) {
    return <StateView loading message="Loading your home..." />;
  }

  if (!auth.isSignedIn) {
    return <StateView message="Sign in to load your home." />;
  }

  return (
    <Screen title="Home" subtitle={dateLabel} scroll>
      <Card>
        <Text style={styles.title}>How are you feeling today?</Text>
        <Text style={styles.helper}>
          Log a symptom to keep your recent activity real and up to date.
        </Text>
        <PrimaryButton label="Log symptom" onPress={onCreateSymptom} />
      </Card>

      <Card>
        <Text style={styles.title}>Need a food check?</Text>
        <Text style={styles.helper}>
          Search foods before your next meal and compare safer options.
        </Text>
        <Pressable onPress={onBrowse} style={styles.secondaryAction}>
          <Text style={styles.secondaryActionText}>Search foods</Text>
        </Pressable>
      </Card>

      {weeklySummaryViewModel ? (
        <Card>
          <Text style={styles.title}>{weeklySummaryViewModel.title}</Text>
          <Text style={styles.helper}>{weeklySummaryViewModel.subtitle}</Text>
          <View style={styles.summaryGrid}>
            {weeklySummaryViewModel.stats.map((stat) => (
              <View key={stat.label} style={styles.summaryStat}>
                <Text style={styles.summaryStatLabel}>{stat.label}</Text>
                <Text style={styles.summaryStatValue}>{stat.value}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <View style={styles.activitySectionHeader}>
        <SectionTitle>Recent activity</SectionTitle>
        <Pressable onPress={onOpenTracking} style={styles.inlineAction}>
          <Text style={styles.inlineActionText}>View all</Text>
        </Pressable>
      </View>
      <Text style={styles.sectionSubtitle}>
        {buildHomeRecentActivitySubtitle(
          totalEntries,
          recentActivityItems.length,
        )}
      </Text>

      {activityState === "error" ? (
        <StateView
          message={error ?? "Could not load your recent activity."}
          action={() => {
            void load();
          }}
          actionLabel="Retry"
        />
      ) : null}

      {activityState === "empty" ? (
        <Card>
          <Text style={styles.title}>No recent activity yet</Text>
          <Text style={styles.helper}>
            Log your first symptom to turn Home into a personal activity view.
          </Text>
          <PrimaryButton
            label="Log your first symptom"
            onPress={onCreateSymptom}
          />
        </Card>
      ) : null}

      {activityState === "ready"
        ? recentActivityItems.map((item) => (
            <Card key={item.id}>
              <View style={styles.activityRow}>
                <Text style={styles.title}>{item.title}</Text>
                <Badge label={item.entryType} />
              </View>
              <Text style={styles.helper}>{item.occurredAtLabel}</Text>
              {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
            </Card>
          ))
        : null}
    </Screen>
  );
}
