import { useCallback, useEffect, useState } from "react";
import {
  createBackpackItemFromFile,
} from "../lib/backpack/backpackItemFromFile";
import {
  loadBackpackItems,
  persistBackpackItems,
} from "../lib/backpack/backpackStorage";
import type { BackpackItem, BackpackSourceLab } from "../types/backpack";
import type { FileItem } from "../types/file";

export function useBackpackState() {
  const [items, setItems] = useState<BackpackItem[]>(() => loadBackpackItems());
  const [showSaveSuccessAlert, setShowSaveSuccessAlert] = useState(false);
  const [showSaveErrorAlert, setShowSaveErrorAlert] = useState(false);
  const [showImportErrorAlert, setShowImportErrorAlert] = useState(false);

  useEffect(() => {
    persistBackpackItems(items);
  }, [items]);

  const saveFileToBackpack = useCallback((
    file: FileItem,
    options?: { sourceLab?: BackpackSourceLab; contentOverride?: string },
  ): true | string => {
    const nextItem = createBackpackItemFromFile(file, options);
    if (typeof nextItem === "string") {
      setShowSaveErrorAlert(true);
      return nextItem;
    }

    setItems((current) => {
      const duplicate = current.some(
        (item) => item.name === nextItem.name && item.content === nextItem.content,
      );
      if (duplicate) return current;
      return [nextItem, ...current];
    });
    setShowSaveSuccessAlert(true);
    setShowSaveErrorAlert(false);
    return true;
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((current) => current.filter((item) => item.id !== itemId));
  }, []);

  const reportImportError = useCallback(() => {
    setShowImportErrorAlert(true);
  }, []);

  const clearImportError = useCallback(() => {
    setShowImportErrorAlert(false);
  }, []);

  const seedItemsIfEmpty = useCallback((seedItems: BackpackItem[]) => {
    setItems((current) => (current.length > 0 ? current : seedItems));
  }, []);

  return {
    items,
    saveFileToBackpack,
    removeItem,
    seedItemsIfEmpty,
    showSaveSuccessAlert,
    setShowSaveSuccessAlert,
    showSaveErrorAlert,
    setShowSaveErrorAlert,
    showImportErrorAlert,
    setShowImportErrorAlert,
    reportImportError,
    clearImportError,
  };
}

export type BackpackState = ReturnType<typeof useBackpackState>;
