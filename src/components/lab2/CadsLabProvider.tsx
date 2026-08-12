import type { ReactNode } from "react";
import { CadsProvider } from "@moshebaricdo/cads-react";
import "@moshebaricdo/cads-variables/variables.css";
import "@moshebaricdo/cads-react/icons/fonts.css";

/**
 * Lab2-scoped CADS bootstrap.
 * Loads CADS variables + icon fonts and provides the MUI theme without
 * CssBaseline (Lab2 globals stay in charge of document baseline).
 */
export function CadsLabProvider({ children }: { children: ReactNode }) {
  return <CadsProvider baseline={false}>{children}</CadsProvider>;
}
