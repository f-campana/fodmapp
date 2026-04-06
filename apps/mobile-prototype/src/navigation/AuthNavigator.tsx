import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { SignInScreen } from "../screens/SignInScreen";
import { SignUpScreen } from "../screens/SignUpScreen";
import { useTheme } from "../theme/ThemeContext";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
};

export function AuthNavigator() {
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
        <Stack.Screen name="SignIn" options={{ headerShown: false }}>
          {({ navigation }) => (
            <SignInScreen onOpenSignUp={() => navigation.navigate("SignUp")} />
          )}
        </Stack.Screen>
        <Stack.Screen
          name="SignUp"
          options={{
            title: "Sign up",
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.canvas },
          }}
        >
          {({ navigation }) => (
            <SignUpScreen onOpenSignIn={() => navigation.navigate("SignIn")} />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
