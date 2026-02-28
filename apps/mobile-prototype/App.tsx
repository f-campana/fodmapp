import { useEffect, useState } from "react";

import { StatusBar } from "expo-status-bar";

import { StateView } from "./src/components/ui";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import {
  loadColorScheme,
  loadOnboardingCompleted,
  saveColorScheme,
  saveOnboardingCompleted,
} from "./src/storage/preferencesStore";
import {
  type ColorSchemePreference,
  ThemeProvider,
  useTheme,
} from "./src/theme/ThemeContext";

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? "light" : "dark"} />;
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [colorScheme, setColorScheme] =
    useState<ColorSchemePreference>("system");

  useEffect(() => {
    void Promise.all([loadOnboardingCompleted(), loadColorScheme()])
      .then(([completed, scheme]) => {
        setOnboardingCompleted(completed);
        setColorScheme(scheme);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <StateView loading message="Preparing your experience..." />;
  }

  return (
    <ThemeProvider
      initialPreference={colorScheme}
      onPreferenceChange={(p) => {
        void saveColorScheme(p);
      }}
    >
      <ThemedStatusBar />
      {onboardingCompleted ? (
        <AppNavigator />
      ) : (
        <OnboardingScreen
          onComplete={() => {
            setOnboardingCompleted(true);
            void saveOnboardingCompleted(true);
          }}
        />
      )}
    </ThemeProvider>
  );
}
