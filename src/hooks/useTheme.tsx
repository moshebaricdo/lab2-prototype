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
export type BrandTheme = "codeOrg" | "codeAi";

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  brandTheme: BrandTheme;
  setBrandTheme: (brandTheme: BrandTheme) => void;
}

interface ThemeProviderProps {
  children: ReactNode;
}

const THEME_STORAGE_KEY = "lab2:theme";
const BRAND_THEME_STORAGE_KEY = "lab2:brand-theme";
const DEFAULT_THEME: ThemeMode = "light";
const DEFAULT_BRAND_THEME: BrandTheme = "codeAi";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function normalizeTheme(value: string | null): ThemeMode {
  return value === "dark" || value === "light" ? value : DEFAULT_THEME;
}

function normalizeBrandTheme(value: string | null): BrandTheme {
  return value === "codeAi" || value === "codeOrg"
    ? value
    : DEFAULT_BRAND_THEME;
}

function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }

  return normalizeTheme(window.sessionStorage.getItem(THEME_STORAGE_KEY));
}

function getStoredBrandTheme(): BrandTheme {
  if (typeof window === "undefined") {
    return DEFAULT_BRAND_THEME;
  }

  return normalizeBrandTheme(
    window.sessionStorage.getItem(BRAND_THEME_STORAGE_KEY),
  );
}

function applyBrandTheme(brandTheme: BrandTheme) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.dataset.brandTheme = brandTheme;
}

function applyThemeMode(theme: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.dataset.theme = theme;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme());
  const [brandTheme, setBrandThemeState] = useState<BrandTheme>(() =>
    getStoredBrandTheme(),
  );

  useLayoutEffect(() => {
    applyBrandTheme(brandTheme);
    applyThemeMode(theme);
    window.sessionStorage.setItem(THEME_STORAGE_KEY, theme);
    window.sessionStorage.setItem(BRAND_THEME_STORAGE_KEY, brandTheme);
  }, [brandTheme, theme]);

  useLayoutEffect(() => initColorSandboxRuntime(), []);

  const value = useMemo(
    () => ({
      theme,
      setTheme: setThemeState,
      brandTheme,
      setBrandTheme: setBrandThemeState,
    }),
    [brandTheme, theme],
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
