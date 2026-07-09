import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { initColorSandboxRuntime } from "../lib/colorSandbox/colorSandboxRuntime";

export type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

interface ThemeProviderProps {
  children: ReactNode;
}

const THEME_STORAGE_KEY = "lab2:theme";
const DEFAULT_THEME: ThemeMode = "light";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function normalizeTheme(value: string | null): ThemeMode {
  return value === "dark" || value === "light" ? value : DEFAULT_THEME;
}

function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }

  return normalizeTheme(window.sessionStorage.getItem(THEME_STORAGE_KEY));
}

function applyThemeMode(theme: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.dataset.theme = theme;
  delete root.dataset.brandTheme;
  delete root.dataset.codeaiActiveChrome;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme());

  useLayoutEffect(() => {
    applyThemeMode(theme);
    window.sessionStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useLayoutEffect(() => initColorSandboxRuntime(), []);

  const value = useMemo(
    () => ({
      theme,
      setTheme: setThemeState,
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
