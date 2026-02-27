import { useEffect, useState } from "react";

import { StatusBar } from "expo-status-bar";

import { StateView } from "./src/components/ui";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import {
  loadOnboardingCompleted,
  saveOnboardingCompleted,
} from "./src/storage/preferencesStore";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  useEffect(() => {
    void loadOnboardingCompleted()
      .then((completed) => setOnboardingCompleted(completed))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <StateView loading message="Preparing your experience..." />;
  }

  return (
    <>
      <StatusBar style="dark" />
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
    </>
  );
}
