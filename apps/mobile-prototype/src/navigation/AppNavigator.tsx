import type { ReactNode } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FoodDetailScreen } from '../screens/FoodDetailScreen';
import { FoodsScreen } from '../screens/FoodsScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { theme } from '../theme/tokens';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

export type RootStackParamList = {
  MainTabs: undefined;
  FoodDetail: { foodId: string };
};

export type TabParamList = {
  HomeTab: undefined;
  FoodsTab: undefined;
  SettingsTab: undefined;
};

function TabIcon({ icon, active }: { icon: string; active: boolean }) {
  return <Text style={[styles.tabIcon, active ? styles.tabIconActive : null]}>{icon}</Text>;
}

function TabNavigator() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.color.accent,
        tabBarInactiveTintColor: '#818a97',
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar
      }}>
      <Tabs.Screen
        name="HomeTab"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" active={focused} />
        }}
        children={({ navigation }) => (
          <ScreenPad>
            <HomeScreen onBrowse={() => navigation.navigate('FoodsTab')} />
          </ScreenPad>
        )}
      />
      <Tabs.Screen
        name="FoodsTab"
        options={{
          title: 'Foods',
          tabBarIcon: ({ focused }) => <TabIcon icon="🥝" active={focused} />
        }}
        children={({ navigation }) => (
          <ScreenPad>
            <FoodsScreen onSelectFood={(foodId) => navigation.getParent()?.navigate('FoodDetail', { foodId })} />
          </ScreenPad>
        )}
      />
      <Tabs.Screen
        name="SettingsTab"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" active={focused} />
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
          primary: theme.color.accent
        }
      }}>
      <Stack.Navigator>
        <Stack.Screen name="MainTabs" component={TabNavigator} options={{ title: 'FODMAP Prototype', headerShown: false }} />
        <Stack.Screen
          name="FoodDetail"
          options={{
            title: 'Food detail',
            headerBackButtonDisplayMode: 'minimal',
            headerShadowVisible: false,
            headerStyle: { backgroundColor: theme.color.canvas }
          }}>
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
    <SafeAreaView edges={['top']} style={styles.screen}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.color.canvas,
    flex: 1,
    paddingHorizontal: theme.spacing.md
  },
  tabBar: {
    borderTopColor: theme.color.border,
    height: 78,
    paddingBottom: 10,
    paddingTop: 8
  },
  tabIcon: {
    fontSize: 18,
    opacity: 0.5
  },
  tabIconActive: {
    opacity: 1
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2
  }
});
