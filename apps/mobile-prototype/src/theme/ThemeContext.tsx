import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { useColorScheme as useDeviceScheme } from "react-native";

import {
  darkColors,
  darkSeverityColors,
  lightColors,
  lightSeverityColors,
  type RNColors,
  type SeverityColors,
} from "./rn-adapter";

export type ColorSchemePreference = "light" | "dark" | "system";

interface ThemeContextValue {
  preference: ColorSchemePreference;
  colors: RNColors;
  severityColors: SeverityColors;
  isDark: boolean;
  setPreference: (p: ColorSchemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  preference: "system",
  colors: lightColors,
  severityColors: lightSeverityColors,
  isDark: false,
  setPreference: () => {},
});

export function ThemeProvider({
  children,
  initialPreference = "system",
  onPreferenceChange,
}: {
  children: ReactNode;
  initialPreference?: ColorSchemePreference;
  onPreferenceChange?: (p: ColorSchemePreference) => void;
}) {
  const deviceScheme = useDeviceScheme(); // "light" | "dark" | null
  const [preference, setPreferenceState] = useState(initialPreference);

  const resolved =
    preference === "system" ? (deviceScheme ?? "light") : preference;
  const isDark = resolved === "dark";
  const colors = isDark ? darkColors : lightColors;
  const severityColors = isDark ? darkSeverityColors : lightSeverityColors;

  const setPreference = useCallback(
    (p: ColorSchemePreference) => {
      setPreferenceState(p);
      onPreferenceChange?.(p);
    },
    [onPreferenceChange],
  );

  const value = useMemo(
    () => ({ preference, colors, severityColors, isDark, setPreference }),
    [preference, colors, severityColors, isDark, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
