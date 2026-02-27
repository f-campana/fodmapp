import { useCallback, useEffect, useState } from "react";

import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Badge, Card, Screen, StateView } from "../components/ui";
import { type Food, listFoods } from "../data/repository";
import { rnTheme } from "../theme/rn-adapter";
import { theme } from "../theme/tokens";

export function FoodsScreen({
  onSelectFood,
}: {
  onSelectFood: (foodId: string, foodName?: string) => void;
}) {
  const [rawQuery, setRawQuery] = useState("");
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [itemAnims] = useState<Animated.Value[]>(() => []);

  useEffect(() => {
    const id = setTimeout(() => setQuery(rawQuery), 300);
    return () => clearTimeout(id);
  }, [rawQuery]);

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
    void load(query);
  }, [load, query]);

  useEffect(() => {
    if (foods.length === 0) {
      return;
    }
    while (itemAnims.length < foods.length) {
      itemAnims.push(new Animated.Value(0));
    }
    itemAnims.slice(0, foods.length).forEach((a) => a.setValue(0));
    Animated.stagger(
      40,
      itemAnims.slice(0, foods.length).map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: rnTheme.motion.duration.normal,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [foods, itemAnims]);

  return (
    <Screen title="Foods" subtitle="Search by name, category, or trigger tag">
      <TextInput
        style={styles.search}
        placeholder="Search foods or trigger tags"
        value={rawQuery}
        onChangeText={setRawQuery}
        placeholderTextColor={theme.color.textMuted}
      />

      {loading ? <StateView loading message="Loading foods..." /> : null}
      {error ? (
        <StateView
          message="Could not load foods."
          action={() => {
            void load(query);
          }}
        />
      ) : null}
      {!loading && !error && foods.length === 0 ? (
        <StateView
          message="No foods found for this search."
          action={() => setRawQuery("")}
          actionLabel="Clear search"
        />
      ) : null}

      {!loading && !error && foods.length > 0 ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {foods.map((food, index) => (
            <Animated.View
              key={food.id}
              style={{
                opacity: itemAnims[index] ?? 1,
                transform: [
                  {
                    translateY: (
                      itemAnims[index] ?? new Animated.Value(1)
                    ).interpolate({
                      inputRange: [0, 1],
                      outputRange: [8, 0],
                    }),
                  },
                ],
              }}
            >
              <Pressable
                onPress={() => onSelectFood(food.id, food.name)}
                style={({ pressed }) =>
                  pressed ? { opacity: 0.72 } : undefined
                }
              >
                <Card>
                  <View style={styles.headerRow}>
                    <Text style={styles.name}>{food.name}</Text>
                    <Badge label={food.severity} variant={food.severity} />
                  </View>
                  <Text style={styles.meta}>{food.category}</Text>
                  <Text style={styles.meta}>{food.serving}</Text>
                </Card>
              </Pressable>
            </Animated.View>
          ))}
        </ScrollView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  meta: { color: theme.color.textMuted, fontSize: 16, marginTop: 2 },
  name: {
    color: theme.color.text,
    fontSize: rnTheme.typography.fontSize["2xl"],
    fontWeight: "800",
    letterSpacing: -0.3,
    maxWidth: "72%",
  },
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
    paddingVertical: 12,
  },
});
