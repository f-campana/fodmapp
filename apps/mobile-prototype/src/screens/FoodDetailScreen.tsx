import { useCallback, useEffect, useMemo, useState } from "react";

import { useNavigation } from "@react-navigation/native";

import { StyleSheet, Text, View } from "react-native";

import { Badge, Card, Screen, SectionTitle, StateView } from "../components/ui";
import { getCatalogFoodDetailPage } from "../data/catalogRepository";
import {
  formatCoverageRatio,
  formatFoodLevel,
  getFoodDisplayName,
  getFoodLevelBadgeVariant,
  getSwapDisplayName,
} from "../lib/catalog";
import { useTheme } from "../theme/ThemeContext";
import type { RNColors } from "../theme/tokens";

function createStyles(colors: RNColors) {
  return StyleSheet.create({
    inlineRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
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
  const [foodState, setFoodState] = useState<Awaited<
    ReturnType<typeof getCatalogFoodDetailPage>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await getCatalogFoodDetailPage(foodId);
      setFoodState(result);
      if (result.foodResult.ok) {
        navigation.setOptions({
          title: getFoodDisplayName(result.foodResult.data),
        });
      }
    } catch {
      setFoodState(null);
      setErrorMessage("Could not load food detail.");
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
  if (errorMessage) {
    return (
      <StateView
        message={errorMessage}
        action={() => {
          void load();
        }}
      />
    );
  }
  if (!foodState) {
    return <StateView message="Food detail is unavailable." />;
  }
  if (!foodState.foodResult.ok) {
    if (foodState.foodResult.status === 404) {
      return <StateView message="Food not found." />;
    }

    return (
      <StateView
        message={
          foodState.foodResult.error === "api_not_configured"
            ? "Set EXPO_PUBLIC_API_BASE_URL to load food detail."
            : "Could not load food detail."
        }
        action={() => {
          void load();
        }}
      />
    );
  }

  const food = foodState.foodResult.data;

  if (!food) {
    return <StateView message="Food not found." />;
  }

  return (
    <Screen title={getFoodDisplayName(food)} subtitle={food.slug} scroll>
      <Card style={styles.sourceCard}>
        <View style={styles.inlineRow}>
          <Badge label="Curated catalog" />
          {food.profile ? (
            <Badge
              label={formatFoodLevel(food.profile.overallLevel)}
              variant={getFoodLevelBadgeVariant(food.profile.overallLevel)}
            />
          ) : null}
        </View>
        {food.preparationState ? (
          <Text style={styles.meta}>Preparation: {food.preparationState}</Text>
        ) : null}
        {food.status ? (
          <Text style={styles.meta}>Status: {food.status}</Text>
        ) : null}
        {food.sourceSlug ? (
          <Text style={styles.meta}>Source: {food.sourceSlug}</Text>
        ) : null}
      </Card>

      {foodState.rollupResult.ok ? (
        <Card>
          <Text style={styles.note}>
            Niveau global:{" "}
            {formatFoodLevel(foodState.rollupResult.data.overallLevel)}
          </Text>
          <Text style={styles.meta}>
            {formatCoverageRatio(foodState.rollupResult.data.coverageRatio)}
          </Text>
          <Text style={styles.meta}>
            Sub-types connus: {foodState.rollupResult.data.knownSubtypesCount}
          </Text>
          {foodState.rollupResult.data.driverSubtype ? (
            <Text style={styles.meta}>
              Sous-type conducteur:{" "}
              {foodState.rollupResult.data.driverSubtype.toUpperCase()}
            </Text>
          ) : null}
          {foodState.rollupResult.data.rollupServingGrams !== null ? (
            <Text style={styles.meta}>
              Portion de reference:{" "}
              {foodState.rollupResult.data.rollupServingGrams} g
            </Text>
          ) : null}
        </Card>
      ) : (
        <Card>
          <Text style={styles.note}>Rollup unavailable</Text>
          <Text style={styles.meta}>
            The identity card remains available even when the computed rollup
            cannot be loaded.
          </Text>
        </Card>
      )}

      <SectionTitle>Suggested swaps</SectionTitle>
      {!foodState.swapsResult.ok ? (
        <Card>
          <Text style={styles.note}>Swaps unavailable</Text>
          <Text style={styles.meta}>
            {foodState.swapsResult.error === "api_not_configured"
              ? "Set EXPO_PUBLIC_API_BASE_URL to load swap suggestions."
              : "The shared client could not load active swaps for this food."}
          </Text>
        </Card>
      ) : foodState.swapsResult.data.total === 0 ? (
        <Card>
          <Text style={styles.note}>No active swaps documented yet</Text>
          <Text style={styles.meta}>
            This food does not currently have an active substitution rule.
          </Text>
        </Card>
      ) : (
        foodState.swapsResult.data.items.map((swap) => (
          <Card key={swap.id} style={styles.swapCard}>
            <View style={styles.swapHeader}>
              <Text style={styles.swap}>{getSwapDisplayName(swap)}</Text>
              <Badge
                label={formatFoodLevel(swap.to.overallLevel)}
                variant={getFoodLevelBadgeVariant(swap.to.overallLevel)}
              />
            </View>
            <Text style={styles.meta}>{swap.instruction.fr}</Text>
            <Text style={styles.meta}>
              Score securite: {Math.round(swap.fodmapSafetyScore * 100)}%
            </Text>
            <Text style={styles.meta}>
              {formatCoverageRatio(swap.coverageRatio)}
            </Text>
            {swap.driverSubtype ? (
              <Text style={styles.meta}>
                Sous-type conducteur: {swap.driverSubtype.toUpperCase()}
              </Text>
            ) : null}
            {swap.fromBurdenRatio !== null && swap.toBurdenRatio !== null ? (
              <Text style={styles.note}>
                Charge relative: {swap.fromBurdenRatio.toFixed(2)} to{" "}
                {swap.toBurdenRatio.toFixed(2)}
              </Text>
            ) : null}
          </Card>
        ))
      )}
    </Screen>
  );
}
