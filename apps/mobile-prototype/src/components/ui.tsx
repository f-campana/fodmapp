import { type ReactNode, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import type { FoodLevelBadgeVariant } from "../lib/catalog";
import { rnTheme } from "../theme/rn-adapter";
import { useTheme } from "../theme/ThemeContext";
import { type RNColors, theme } from "../theme/tokens";

function createStyles(colors: RNColors) {
  return StyleSheet.create({
    badge: {
      alignSelf: "flex-start",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0.4,
      marginTop: theme.spacing.sm,
      overflow: "hidden",
      paddingHorizontal: 12,
      paddingVertical: 6,
      textTransform: "uppercase",
    },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      marginBottom: theme.spacing.sm,
      padding: theme.spacing.md,
      ...theme.shadow.card,
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 200,
      paddingHorizontal: theme.spacing.lg,
    },
    divider: {
      backgroundColor: colors.border,
      height: 1,
      marginVertical: rnTheme.spacing[2],
    },
    muted: {
      color: colors.textMuted,
      marginBottom: theme.spacing.sm,
      marginTop: theme.spacing.xs,
      textAlign: "center",
    },
    primaryButton: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: theme.radius.sm,
      minHeight: 52,
      justifyContent: "center",
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
    },
    primaryButtonPressed: {
      backgroundColor: colors.accentStrong,
    },
    primaryLabel: {
      color: "white",
      fontSize: 18,
      fontWeight: "700",
    },
    screenContent: {
      flex: 1,
      gap: theme.spacing.sm,
    },
    screenHeader: {
      marginBottom: rnTheme.spacing[4],
      marginTop: theme.spacing.xs,
    },
    screenSubtitle: {
      color: colors.textMuted,
      fontSize: 16,
      marginTop: 2,
    },
    screenTitle: {
      color: colors.text,
      fontSize: rnTheme.typography.fontSize["3xl"],
      fontWeight: "700",
      letterSpacing: -0.4,
    },
    scrollContent: {
      paddingBottom: theme.spacing.xl,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "800",
      marginBottom: theme.spacing.xs,
    },
  });
}

export function Screen({
  title,
  subtitle,
  children,
  scroll = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  scroll?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const content = (
    <View style={styles.screenContent}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>{title}</Text>
        {subtitle ? (
          <Text style={styles.screenSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
      {children}
    </View>
  );

  if (scroll) {
    return (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {content}
      </ScrollView>
    );
  }

  return content;
}

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Divider() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <View style={styles.divider} />;
}

export function PrimaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [scaleAnim] = useState(() => new Animated.Value(1));

  const handlePressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 60,
      bounciness: 0,
    }).start();

  const handlePressOut = () =>
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 60,
      bounciness: 4,
    }).start();

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.primaryButtonPressed}
    >
      <Animated.View
        style={[styles.primaryButton, { transform: [{ scale: scaleAnim }] }]}
      >
        <Text style={styles.primaryLabel}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function Badge({
  label,
  variant,
}: {
  label: string;
  variant?: FoodLevelBadgeVariant;
}) {
  const { colors, severityColors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const badgeColors =
    variant && variant !== "default"
      ? { bg: severityColors[variant].bg, fg: severityColors[variant].fg }
      : { bg: colors.surfaceMuted, fg: colors.accentStrong };

  return (
    <Text
      style={[
        styles.badge,
        { backgroundColor: badgeColors.bg, color: badgeColors.fg },
      ]}
    >
      {label}
    </Text>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function StateView({
  loading,
  message,
  action,
  actionLabel,
}: {
  loading?: boolean;
  message: string;
  action?: () => void;
  actionLabel?: string;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.centered}>
      {loading ? <ActivityIndicator color={colors.accent} /> : null}
      <Text style={styles.muted}>{message}</Text>
      {action ? (
        <PrimaryButton label={actionLabel ?? "Retry"} onPress={action} />
      ) : null}
    </View>
  );
}
