import { useCallback, useMemo, useState } from "react";

import { useFocusEffect } from "@react-navigation/native";

import { StyleSheet, Text, View } from "react-native";

import {
  type TrackingFeedEntry,
  type WeeklyTrackingSummary,
} from "@fodmapp/domain";

import { useAuth } from "../auth/useAuth";
import {
  Badge,
  Card,
  PrimaryButton,
  Screen,
  StateView,
} from "../components/ui";
import {
  createTrackingRepository,
  type TrackingRepository,
} from "../data/trackingRepository";
import { useTheme } from "../theme/ThemeContext";
import { type RNColors, theme } from "../theme/tokens";
import {
  buildTrackingFeedViewModel,
  buildWeeklyTrackingSummaryStats,
  buildWeeklyTrackingSummarySubtitle,
} from "./trackingScreenLogic";

function createStyles(colors: RNColors) {
  return StyleSheet.create({
    actions: {
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    meta: {
      color: colors.textMuted,
      fontSize: 14,
      marginTop: 4,
    },
    note: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 21,
      marginTop: 8,
    },
    sectionHeading: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "800",
      marginBottom: theme.spacing.xs,
    },
    sectionSubtitle: {
      color: colors.textMuted,
      fontSize: 15,
      marginBottom: theme.spacing.sm,
    },
    row: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      gap: theme.spacing.sm,
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

export function TrackingFeedScreen({
  onCreateSymptom,
  repository,
}: {
  onCreateSymptom: () => void;
  repository?: TrackingRepository;
}) {
  const auth = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const trackingRepository = useMemo(
    () => repository ?? createTrackingRepository(auth.getToken),
    [auth.getToken, repository],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<TrackingFeedEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [weeklySummary, setWeeklySummary] =
    useState<WeeklyTrackingSummary | null>(null);
  const viewModel = useMemo(
    () => buildTrackingFeedViewModel(total, entries),
    [entries, total],
  );
  const summaryStats = useMemo(
    () => (weeklySummary ? buildWeeklyTrackingSummaryStats(weeklySummary) : []),
    [weeklySummary],
  );
  const summarySubtitle = useMemo(
    () =>
      weeklySummary ? buildWeeklyTrackingSummarySubtitle(weeklySummary) : null,
    [weeklySummary],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const hubReadModel = await trackingRepository.getHubReadModel();
      setEntries(hubReadModel.feed.items);
      setTotal(hubReadModel.feed.total);
      setWeeklySummary(hubReadModel.summary);
    } catch (feedError) {
      setError(
        feedError instanceof Error
          ? feedError.message
          : "Could not load tracking feed.",
      );
    } finally {
      setLoading(false);
    }
  }, [trackingRepository]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading) {
    return <StateView loading message="Loading tracking feed..." />;
  }

  if (error) {
    return (
      <StateView
        message={error}
        action={() => {
          void load();
        }}
        actionLabel="Retry"
      />
    );
  }

  if (!auth.isSignedIn) {
    return <StateView message="Sign in to load your tracking feed." />;
  }

  return (
    <Screen title="Tracking feed" subtitle={viewModel.subtitle} scroll>
      <View style={styles.actions}>
        <PrimaryButton label="Create symptom" onPress={onCreateSymptom} />
      </View>

      {weeklySummary && summarySubtitle ? (
        <Card>
          <Text style={styles.title}>This week</Text>
          <Text style={styles.sectionSubtitle}>{summarySubtitle}</Text>
          <View style={styles.summaryGrid}>
            {summaryStats.map((stat) => (
              <View key={stat.label} style={styles.summaryStat}>
                <Text style={styles.summaryStatLabel}>{stat.label}</Text>
                <Text style={styles.summaryStatValue}>{stat.value}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      {entries.length === 0 ? (
        <StateView
          message="No tracking entries yet. Create your first symptom to start using the protected mobile flow."
          action={onCreateSymptom}
          actionLabel="Create symptom"
        />
      ) : (
        viewModel.sections.map((section) => (
          <View key={section.key}>
            <Text style={styles.sectionHeading}>{section.title}</Text>
            {section.items.map((item) => (
              <Card key={item.id}>
                <View style={styles.row}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Badge label={item.entryType} />
                </View>
                <Text style={styles.meta}>{item.occurredAtLabel}</Text>
                {item.note ? (
                  <Text style={styles.note}>{item.note}</Text>
                ) : null}
              </Card>
            ))}
          </View>
        ))
      )}
    </Screen>
  );
}
