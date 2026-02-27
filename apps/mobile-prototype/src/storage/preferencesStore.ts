import AsyncStorage from "@react-native-async-storage/async-storage";

import { getDefaultPreferences, type Preferences } from "../data/repository";
import {
  parseOnboardingCompleted,
  serializeOnboardingCompleted,
} from "./onboarding";

export const PREFERENCES_KEY = "@fodmap/prototype/preferences";
export const ONBOARDING_COMPLETED_KEY =
  "@fodmap/prototype/onboarding-completed";

export async function loadPreferences(): Promise<Preferences> {
  const raw = await AsyncStorage.getItem(PREFERENCES_KEY);
  if (!raw) {
    return getDefaultPreferences();
  }

  try {
    return { ...getDefaultPreferences(), ...JSON.parse(raw) } as Preferences;
  } catch {
    return getDefaultPreferences();
  }
}

export async function savePreferences(preferences: Preferences): Promise<void> {
  await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
}

export async function loadOnboardingCompleted(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
  return parseOnboardingCompleted(raw);
}

export async function saveOnboardingCompleted(
  completed: boolean,
): Promise<void> {
  await AsyncStorage.setItem(
    ONBOARDING_COMPLETED_KEY,
    serializeOnboardingCompleted(completed),
  );
}
