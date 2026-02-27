import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import type { ReactNode } from "react";
import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FoodDetailScreen } from "../screens/FoodDetailScreen";
import { FoodsScreen } from "../screens/FoodsScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { theme } from "../theme/tokens";

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

function TabIcon({ icon, color }: { icon: string; color: string }) {
  return <Text style={[styles.tabIcon, { color }]}>{icon}</Text>;
}

function TabNavigator() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.color.accent,
        tabBarInactiveTintColor: theme.color.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: [styles.tabBar, { backgroundColor: theme.color.surface }],
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
  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: theme.color.canvas,
          text: theme.color.text,
          card: theme.color.surface,
          border: theme.color.border,
          primary: theme.color.accent,
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
            headerStyle: { backgroundColor: theme.color.canvas },
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
  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.color.canvas,
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  tabBar: {
    borderTopColor: theme.color.border,
    height: 78,
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabIcon: {
    fontSize: 18,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
});
