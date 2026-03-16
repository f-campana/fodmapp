import AsyncStorage from "@react-native-async-storage/async-storage";

import { getDefaultPreferences, type Preferences } from "../data/repository";
import type { ColorSchemePreference } from "../theme/ThemeContext";
import {
  parseOnboardingCompleted,
  serializeOnboardingCompleted,
} from "./onboarding";

export const PREFERENCES_KEY = "@fodmapp/prototype/preferences";
export const ONBOARDING_COMPLETED_KEY =
  "@fodmapp/prototype/onboarding-completed";

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

export const COLOR_SCHEME_KEY = "@fodmapp/prototype/color-scheme";

export async function loadColorScheme(): Promise<ColorSchemePreference> {
  const raw = await AsyncStorage.getItem(COLOR_SCHEME_KEY);
  if (raw === "light" || raw === "dark" || raw === "system") {
    return raw;
  }
  return "system";
}

export async function saveColorScheme(
  scheme: ColorSchemePreference,
): Promise<void> {
  await AsyncStorage.setItem(COLOR_SCHEME_KEY, scheme);
}
