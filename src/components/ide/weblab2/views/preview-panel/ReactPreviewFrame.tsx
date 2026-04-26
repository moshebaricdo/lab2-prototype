import type { ReactNode } from "react";

interface ReactPreviewFrameProps {
  children: ReactNode;
}

export function ReactPreviewFrame({ children }: ReactPreviewFrameProps) {
  return <>{children}</>;
}

