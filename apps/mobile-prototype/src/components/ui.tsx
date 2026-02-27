import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle
} from 'react-native';

import { theme } from '../theme/tokens';

export function Screen({
  title,
  subtitle,
  children,
  scroll = false
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  scroll?: boolean;
}) {
  const content = (
    <View style={styles.screenContent}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>{title}</Text>
        {subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );

  if (scroll) {
    return <ScrollView contentContainerStyle={styles.scrollContent}>{content}</ScrollView>;
  }

  return content;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.primaryButton}>
      <Text style={styles.primaryLabel}>{label}</Text>
    </Pressable>
  );
}

export function Badge({ label }: { label: string }) {
  return <Text style={styles.badge}>{label}</Text>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function StateView({
  loading,
  message,
  action,
  actionLabel
}: {
  loading?: boolean;
  message: string;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <View style={styles.centered}>
      {loading ? <ActivityIndicator color={theme.color.accent} /> : null}
      <Text style={styles.muted}>{message}</Text>
      {action ? <PrimaryButton label={actionLabel ?? 'Retry'} onPress={action} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.color.accentSoft,
    borderRadius: 999,
    color: theme.color.accentStrong,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginTop: theme.spacing.sm,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 6,
    textTransform: 'uppercase'
  },
  card: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    ...theme.shadow.card
  },
  centered: { alignItems: 'center', justifyContent: 'center', minHeight: 240, paddingHorizontal: theme.spacing.lg },
  muted: { color: theme.color.textMuted, marginBottom: theme.spacing.sm, marginTop: theme.spacing.xs, textAlign: 'center' },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: theme.color.accent,
    borderRadius: theme.radius.sm,
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm
  },
  primaryLabel: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700'
  },
  screenContent: {
    flex: 1,
    gap: theme.spacing.sm
  },
  screenHeader: {
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.xs
  },
  screenSubtitle: {
    color: theme.color.textMuted,
    fontSize: 16,
    marginTop: 2
  },
  screenTitle: {
    color: theme.color.text,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.4
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl
  },
  sectionTitle: {
    color: theme.color.text,
    fontSize: 32,
    fontWeight: '800',
    marginBottom: theme.spacing.xs
  }
});
