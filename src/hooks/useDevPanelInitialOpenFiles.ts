import { useEffect, useMemo, useRef } from "react";
import type { FileItem } from "../types/file";
import {
  parseInitialOpenFilesConfig,
  resolveInitialOpenFiles,
} from "../lib/editor/initialOpenFiles";

/**
 * Applies URL-backed dev panel "initial open files" config when the value
 * changes after mount. Initial mount state should already be seeded via
 * `useFileWorkspaceState({ initialOpenFilePaths })`.
 */
export function useDevPanelInitialOpenFiles(
  fileTree: FileItem[],
  configValue: unknown,
  setOpenFiles: (files: FileItem[]) => void,
  setSelectedFile: (file: FileItem | null) => void,
): string[] {
  const parsedPaths = useMemo(
    () => parseInitialOpenFilesConfig(configValue),
    [configValue],
  );
  const configSignature = parsedPaths.join("\n");
  const lastAppliedRef = useRef<string | null>(null);

  useEffect(() => {
    if (configSignature === lastAppliedRef.current) return;
    if (parsedPaths.length === 0) {
      lastAppliedRef.current = configSignature;
      return;
    }

    const { openFiles, selectedFile } = resolveInitialOpenFiles(fileTree, parsedPaths);
    lastAppliedRef.current = configSignature;

    if (openFiles.length === 0) return;

    setOpenFiles(openFiles);
    setSelectedFile(selectedFile);
  }, [configSignature, fileTree, parsedPaths, setOpenFiles, setSelectedFile]);

  return parsedPaths;
}
