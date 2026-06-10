import { createContext, useContext, type ReactNode } from "react";
import { useBackpackState, type BackpackState } from "./useBackpackState";

const BackpackContext = createContext<BackpackState | null>(null);

export function BackpackProvider({ children }: { children: ReactNode }) {
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
