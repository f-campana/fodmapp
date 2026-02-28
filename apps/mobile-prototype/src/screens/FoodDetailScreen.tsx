import { useCallback, useEffect, useMemo, useState } from "react";

import { useNavigation } from "@react-navigation/native";

import { StyleSheet, Text, View } from "react-native";

import { Badge, Card, Screen, SectionTitle, StateView } from "../components/ui";
import { type Food, getFoodById } from "../data/repository";
import { useTheme } from "../theme/ThemeContext";
import type { RNColors } from "../theme/tokens";

function createStyles(colors: RNColors) {
  return StyleSheet.create({
    meta: { color: colors.textMuted, fontSize: 16, marginTop: 2 },
    note: { color: colors.text, fontSize: 17, lineHeight: 24, marginTop: 6 },
    sourceCard: {
      backgroundColor: colors.surfaceMuted,
    },
    swap: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "800",
      letterSpacing: -0.3,
      maxWidth: "72%",
    },
    swapCard: {
      borderLeftWidth: 3,
      borderLeftColor: colors.accent,
    },
    swapHeader: {
      alignItems: "flex-start",
      flexDirection: "row",
      justifyContent: "space-between",
    },
  });
}

export function FoodDetailScreen({ foodId }: { foodId: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation();
  const [food, setFood] = useState<Food | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await getFoodById(foodId);
      setFood(result);
      if (result) {
        navigation.setOptions({ title: result.name });
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [foodId, navigation]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <StateView loading message="Loading food details..." />;
  }
  if (error) {
    return (
      <StateView
        message="Could not load food detail."
        action={() => {
          void load();
        }}
      />
    );
  }
  if (!food) {
    return <StateView message="Food not found." />;
  }

  return (
    <Screen
      title={food.name}
      subtitle={`${food.category} · ${food.serving}`}
      scroll
    >
      <Card style={styles.sourceCard}>
        <Text style={styles.note}>{food.note}</Text>
        <Badge label={food.severity} variant={food.severity} />
      </Card>

      <SectionTitle>Suggested swaps</SectionTitle>
      {food.alternatives.map((swap) => (
        <Card key={swap.id} style={styles.swapCard}>
          <View style={styles.swapHeader}>
            <Text style={styles.swap}>{swap.name}</Text>
            <Badge label={swap.severity} variant={swap.severity} />
          </View>
          <Text style={styles.meta}>{swap.serving}</Text>
          <Text style={styles.note}>{swap.reason}</Text>
        </Card>
      ))}
    </Screen>
  );
}
