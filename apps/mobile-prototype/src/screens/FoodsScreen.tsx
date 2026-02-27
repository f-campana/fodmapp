import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Badge, Card, Screen, StateView } from '../components/ui';
import { listFoods, type Food } from '../data/repository';
import { theme } from '../theme/tokens';

export function FoodsScreen({ onSelectFood }: { onSelectFood: (foodId: string) => void }) {
  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (input: string) => {
    setLoading(true);
    setError(false);
    try {
      setFoods(await listFoods(input));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(query);
  }, [load, query]);

  return (
    <Screen title="Foods" subtitle="Search by name, category, or trigger tag">
      <TextInput
        style={styles.search}
        placeholder="Search foods or trigger tags"
        value={query}
        onChangeText={setQuery}
        placeholderTextColor={theme.color.textMuted}
      />

      {loading ? <StateView loading message="Loading foods..." /> : null}
      {error ? <StateView message="Could not load foods." action={() => load(query)} /> : null}
      {!loading && !error && foods.length === 0 ? (
        <StateView message="No foods found for this search." action={() => setQuery('')} actionLabel="Clear search" />
      ) : null}

      {!loading && !error && foods.length > 0 ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {foods.map((food) => (
            <Pressable key={food.id} onPress={() => onSelectFood(food.id)}>
              <Card>
                <View style={styles.headerRow}>
                  <Text style={styles.name}>{food.name}</Text>
                  <Badge label={food.severity} />
                </View>
                <Text style={styles.meta}>{food.category}</Text>
                <Text style={styles.meta}>{food.serving}</Text>
              </Card>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  meta: { color: theme.color.textMuted, fontSize: 16, marginTop: 2 },
  name: { color: theme.color.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.3, maxWidth: '72%' },
  search: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: theme.color.text,
    fontSize: 18,
    marginBottom: theme.spacing.sm,
    minHeight: 54,
    paddingHorizontal: 14,
    paddingVertical: 12
  }
});
