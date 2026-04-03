import { useCallback, useEffect, useMemo, useState } from "react";

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

import type { CuratedFoodSummary } from "@fodmapp/domain";

import { Badge, Card, Screen, StateView } from "../components/ui";
import { searchCatalogFoods } from "../data/catalogRepository";
import {
  formatCoverageRatio,
  formatFoodLevel,
  getFoodDisplayName,
  getFoodLevelBadgeVariant,
  QUICK_SEARCHES,
} from "../lib/catalog";
import { rnTheme } from "../theme/rn-adapter";
import { useTheme } from "../theme/ThemeContext";
import { type RNColors, theme } from "../theme/tokens";

function createStyles(colors: RNColors) {
  return StyleSheet.create({
    headerRow: {
      alignItems: "flex-start",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    meta: { color: colors.textMuted, fontSize: 16, marginTop: 2 },
    name: {
      color: colors.text,
      fontSize: rnTheme.typography.fontSize["2xl"],
      fontWeight: "800",
      letterSpacing: -0.3,
      maxWidth: "78%",
    },
    quickSearchButton: {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.border,
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    quickSearchLabel: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "700",
    },
    quickSearchRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    search: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      color: colors.text,
      fontSize: 18,
      marginBottom: theme.spacing.sm,
      minHeight: 54,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    searchHelp: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 21,
      marginBottom: theme.spacing.sm,
    },
  });
}

export function FoodsScreen({
  onSelectFood,
}: {
  onSelectFood: (foodId: string, foodName?: string) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [rawQuery, setRawQuery] = useState("");
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState<CuratedFoodSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [itemAnims] = useState<Animated.Value[]>(() => []);
  const hasQuery = query.trim().length > 0;

  useEffect(() => {
    const id = setTimeout(() => setQuery(rawQuery), 300);
    return () => clearTimeout(id);
  }, [rawQuery]);

  const load = useCallback(async (input: string) => {
    const normalized = input.trim();
    if (normalized.length === 0) {
      setFoods([]);
      setErrorMessage(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await searchCatalogFoods(normalized);
      if (!result.ok) {
        setFoods([]);
        setErrorMessage(
          result.error === "api_not_configured"
            ? "Set EXPO_PUBLIC_API_BASE_URL to enable the connected catalog."
            : "Could not load foods from the catalog.",
        );
        return;
      }

      setFoods(result.data.items);
    } catch {
      setFoods([]);
      setErrorMessage("Could not load foods from the catalog.");
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
    <Screen
      title="Foods"
      subtitle="Search the live curated catalog used by the shared client"
    >
      <TextInput
        style={styles.search}
        placeholder="Search foods by name"
        value={rawQuery}
        onChangeText={setRawQuery}
        placeholderTextColor={colors.textMuted}
      />
      <Text style={styles.searchHelp}>
        The public catalog requires a search term. Start with a known food or
        use one of the quick searches below.
      </Text>

      {!hasQuery ? (
        <Card>
          <Text style={styles.searchHelp}>Quick searches</Text>
          <View style={styles.quickSearchRow}>
            {QUICK_SEARCHES.map((suggestion) => (
              <Pressable
                key={suggestion}
                onPress={() => setRawQuery(suggestion)}
                style={({ pressed }) => [
                  styles.quickSearchButton,
                  pressed ? { opacity: 0.72 } : undefined,
                ]}
              >
                <Text style={styles.quickSearchLabel}>{suggestion}</Text>
              </Pressable>
            ))}
          </View>
        </Card>
      ) : null}

      {loading ? <StateView loading message="Loading foods..." /> : null}
      {errorMessage ? (
        <StateView
          message={errorMessage}
          action={() => {
            void load(query);
          }}
        />
      ) : null}
      {!loading && !errorMessage && hasQuery && foods.length === 0 ? (
        <StateView
          message="No foods found for this search."
          action={() => setRawQuery("")}
          actionLabel="Clear search"
        />
      ) : null}

      {!loading && !errorMessage && foods.length > 0 ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {foods.map((food, index) => (
            <Animated.View
              key={food.slug}
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
                onPress={() =>
                  onSelectFood(food.slug, getFoodDisplayName(food))
                }
                style={({ pressed }) =>
                  pressed ? { opacity: 0.72 } : undefined
                }
              >
                <Card>
                  <View style={styles.headerRow}>
                    <Text style={styles.name}>{getFoodDisplayName(food)}</Text>
                    <Badge
                      label={formatFoodLevel(food.overallLevel)}
                      variant={getFoodLevelBadgeVariant(food.overallLevel)}
                    />
                  </View>
                  <Text style={styles.meta}>
                    Niveau global: {formatFoodLevel(food.overallLevel)}
                  </Text>
                  <Text style={styles.meta}>
                    {food.driverSubtype
                      ? `Sous-type conducteur: ${food.driverSubtype.toUpperCase()}`
                      : "Sous-type conducteur indisponible"}
                  </Text>
                  <Text style={styles.meta}>
                    {formatCoverageRatio(food.coverageRatio)}
                  </Text>
                </Card>
              </Pressable>
            </Animated.View>
          ))}
        </ScrollView>
      ) : null}
    </Screen>
  );
}
