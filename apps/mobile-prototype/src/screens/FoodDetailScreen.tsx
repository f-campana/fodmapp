import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Badge, Card, Screen, SectionTitle, StateView } from '../components/ui';
import { getFoodById, type Food } from '../data/repository';
import { theme } from '../theme/tokens';

export function FoodDetailScreen({ foodId }: { foodId: string }) {
  const [food, setFood] = useState<Food | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setFood(await getFoodById(foodId));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [foodId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <StateView loading message="Loading food details..." />;
  if (error) return <StateView message="Could not load food detail." action={load} />;
  if (!food) return <StateView message="Food not found." />;

  return (
    <Screen title={food.name} subtitle={`${food.category} · ${food.serving}`} scroll>
      <Card>
        <Text style={styles.note}>{food.note}</Text>
        <Badge label={food.severity} />
      </Card>

      <SectionTitle>Suggested swaps</SectionTitle>
      {food.alternatives.map((swap) => (
        <Card key={swap.id}>
          <View style={styles.swapHeader}>
            <Text style={styles.swap}>{swap.name}</Text>
            <Badge label={swap.severity} />
          </View>
          <Text style={styles.meta}>{swap.serving}</Text>
          <Text style={styles.note}>{swap.reason}</Text>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  meta: { color: theme.color.textMuted, fontSize: 16, marginTop: 2 },
  note: { color: theme.color.text, fontSize: 17, lineHeight: 24, marginTop: 6 },
  swap: { color: theme.color.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.3, maxWidth: '72%' },
  swapHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
});
