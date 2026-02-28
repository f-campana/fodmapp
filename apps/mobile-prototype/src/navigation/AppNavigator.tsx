import { type ReactNode, useMemo } from "react";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FoodDetailScreen } from "../screens/FoodDetailScreen";
import { FoodsScreen } from "../screens/FoodsScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { useTheme } from "../theme/ThemeContext";
import { type RNColors, theme } from "../theme/tokens";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

export type RootStackParamList = {
  MainTabs: undefined;
  FoodDetail: { foodId: string; foodName?: string };
};

export type TabParamList = {
  HomeTab: undefined;
  FoodsTab: undefined;
  SettingsTab: undefined;
};

function createStyles(colors: RNColors) {
  return StyleSheet.create({
    screen: {
      backgroundColor: colors.canvas,
      flex: 1,
      paddingHorizontal: theme.spacing.md,
    },
    tabBar: {
      borderTopColor: colors.border,
      height: 78,
      paddingBottom: 10,
      paddingTop: 8,
    },
  });
}

const staticStyles = StyleSheet.create({
  tabIcon: { fontSize: 18 },
  tabLabel: { fontSize: 12, fontWeight: "600", marginBottom: 2 },
});

function TabIcon({ icon, color }: { icon: string; color: string }) {
  return <Text style={[staticStyles.tabIcon, { color }]}>{icon}</Text>;
}

function TabNavigator() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: staticStyles.tabLabel,
        tabBarStyle: [styles.tabBar, { backgroundColor: colors.surface }],
      }}
    >
      <Tabs.Screen
        name="HomeTab"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} />,
        }}
        children={({ navigation }) => (
          <ScreenPad>
            <HomeScreen onBrowse={() => navigation.navigate("FoodsTab")} />
          </ScreenPad>
        )}
      />
      <Tabs.Screen
        name="FoodsTab"
        options={{
          title: "Foods",
          tabBarIcon: ({ color }) => <TabIcon icon="🥝" color={color} />,
        }}
        children={({ navigation }) => (
          <ScreenPad>
            <FoodsScreen
              onSelectFood={(foodId, foodName) =>
                navigation
                  .getParent()
                  ?.navigate("FoodDetail", { foodId, foodName })
              }
            />
          </ScreenPad>
        )}
      />
      <Tabs.Screen
        name="SettingsTab"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <TabIcon icon="⚙️" color={color} />,
        }}
        children={() => (
          <ScreenPad>
            <SettingsScreen />
          </ScreenPad>
        )}
      />
    </Tabs.Navigator>
  );
}

export function AppNavigator() {
  const { colors } = useTheme();

  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.canvas,
          text: colors.text,
          card: colors.surface,
          border: colors.border,
          primary: colors.accent,
        },
      }}
    >
      <Stack.Navigator>
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{ title: "FODMAP Prototype", headerShown: false }}
        />
        <Stack.Screen
          name="FoodDetail"
          options={({ route }) => ({
            title: route.params.foodName ?? "Food",
            headerBackButtonDisplayMode: "minimal",
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.canvas },
          })}
        >
          {({ route }) => (
            <ScreenPad>
              <FoodDetailScreen foodId={route.params.foodId} />
            </ScreenPad>
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function ScreenPad({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      {children}
    </SafeAreaView>
  );
}
