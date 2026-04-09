import { defaultPreferences, type Preferences } from "./mockData";

export type { Preferences };

export function getDefaultPreferences(): Preferences {
  return defaultPreferences;
}
