import { createContext, useContext, type ReactNode } from "react";
import { useBackpackState, type BackpackState } from "./useBackpackState";

const BackpackContext = createContext<BackpackState | null>(null);

/**
 * Idempotent: if a provider already sits above (e.g. a page hoists the store so
 * page-level dialogs can reach it), this is a passthrough that reuses the same
 * store rather than spinning up a second one. That keeps `Lab2Shell`'s own
 * provider working as a no-op when the page already owns the backpack.
 */
export function BackpackProvider({ children }: { children: ReactNode }) {
  const existing = useContext(BackpackContext);
  if (existing) {
    return <>{children}</>;
  }
  return <BackpackProviderRoot>{children}</BackpackProviderRoot>;
}

function BackpackProviderRoot({ children }: { children: ReactNode }) {
  const value = useBackpackState();
  return (
    <BackpackContext.Provider value={value}>{children}</BackpackContext.Provider>
  );
}

export function useBackpack() {
  const context = useContext(BackpackContext);
  if (!context) {
    throw new Error("useBackpack must be used within a BackpackProvider.");
  }
  return context;
}

export function useOptionalBackpack() {
  return useContext(BackpackContext);
}
