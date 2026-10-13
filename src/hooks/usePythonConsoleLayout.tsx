import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

/** Matches the console header toggle: below the editor, or to its right. */
export type PythonConsoleLayout = "horizontal" | "vertical";

interface PythonConsoleLayoutValue {
  layout: PythonConsoleLayout;
  setLayout: Dispatch<SetStateAction<PythonConsoleLayout>>;
}

const PythonConsoleLayoutContext = createContext<PythonConsoleLayoutValue | null>(null);

export function PythonConsoleLayoutProvider({ children }: { children: ReactNode }) {
  const [layout, setLayout] = useState<PythonConsoleLayout>("horizontal");
  const value = useMemo(() => ({ layout, setLayout }), [layout]);
  return (
    <PythonConsoleLayoutContext.Provider value={value}>
      {children}
    </PythonConsoleLayoutContext.Provider>
  );
}

export function usePythonConsoleLayout() {
  return useContext(PythonConsoleLayoutContext);
}
