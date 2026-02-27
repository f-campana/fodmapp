import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Badge, Card, PrimaryButton, Screen, StateView } from '../components/ui';
import { type Preferences } from '../data/repository';
import {
  loadPreferences,
  saveOnboardingCompleted,
  savePreferences
} from '../storage/preferencesStore';
import { theme } from '../theme/tokens';

export function SettingsScreen() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setPrefs(await loadPreferences());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const persist = async (next: Preferences) => {
    setPrefs(next);
    setSaving(true);
    await savePreferences(next);
    setSaving(false);
  };

  if (loading) return <StateView loading message="Loading preferences..." />;
  if (error || !prefs) return <StateView message="Could not load settings." action={load} />;

  return (
    <Screen title="Settings" subtitle="Personalize your prototype experience" scroll>
      <Card>
        <Text style={styles.label}>Household</Text>
        <Text style={styles.value}>{prefs.householdName}</Text>
      </Card>

      <Card>
        <SettingRow
          label="Strict low-FODMAP mode"
          value={prefs.strictMode}
          onChange={(value) => persist({ ...prefs, strictMode: value })}
        />
        <SettingRow
          label="Only safe swaps"
          value={prefs.showOnlySafeSwaps}
          onChange={(value) => persist({ ...prefs, showOnlySafeSwaps: value })}
        />
      </Card>

      <Card>
        <Text style={styles.label}>Trigger tags</Text>
        <View style={styles.tags}>
          {prefs.triggerTags.map((tag) => (
            <Badge key={tag} label={tag} />
          ))}
        </View>
      </Card>

      <PrimaryButton label={saving ? 'Saving…' : 'Auto-save enabled'} />

      <Pressable
        onPress={() => {
          void saveOnboardingCompleted(false);
        }}
        style={styles.secondaryAction}>
        <Text style={styles.secondaryActionText}>Show onboarding on next launch</Text>
      </Pressable>
    </Screen>
  );
}

function SettingRow({ label, value, onChange }: { label: string; value: boolean; onChange: (next: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowText}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: theme.color.accent }} />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: theme.color.text, fontSize: 28, fontWeight: '800', marginBottom: 4 },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  rowText: { color: theme.color.text, flex: 1, fontSize: 20, marginRight: 8 },
  secondaryAction: {
    alignItems: 'center',
    backgroundColor: theme.color.surface,
    borderColor: theme.color.border,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    minHeight: 52,
    justifyContent: 'center'
  },
  secondaryActionText: {
    color: theme.color.text,
    fontSize: 18,
    fontWeight: '600'
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  value: { color: theme.color.textMuted, fontSize: 20, marginTop: 2 }
});
