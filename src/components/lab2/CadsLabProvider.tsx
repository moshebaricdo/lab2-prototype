import type { ReactNode } from "react";
import { CadsProvider } from "@moshebari/cads-react";
import "@moshebari/cads-variables/variables.css";
import "@moshebari/cads-react/icons/fonts.css";
import "./cadsOverlay.css";

/**
 * Lab2-scoped CADS bootstrap.
 * Loads CADS variables + icon fonts + overlay width patch and provides
 * the MUI theme without CssBaseline (Lab2 globals stay in charge of
 * document baseline).
 */
export function CadsLabProvider({ children }: { children: ReactNode }) {
  return <CadsProvider baseline={false}>{children}</CadsProvider>;
}
