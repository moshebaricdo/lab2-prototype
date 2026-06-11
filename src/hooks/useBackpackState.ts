import { useCallback, useEffect, useState } from "react";
import {
  createBackpackItemFromFile,
} from "../lib/backpack/backpackItemFromFile";
import {
  loadBackpackItems,
  persistBackpackItems,
} from "../lib/backpack/backpackStorage";
import { resolveUniqueBackpackName } from "../lib/backpack/resolveUniqueBackpackName";
import type { BackpackItem, BackpackSourceLab } from "../types/backpack";
import type { FileItem } from "../types/file";

export function useBackpackState() {
  const [items, setItems] = useState<BackpackItem[]>(() => loadBackpackItems());
  const [showSaveSuccessAlert, setShowSaveSuccessAlert] = useState(false);
  const [showSaveErrorAlert, setShowSaveErrorAlert] = useState(false);
  const [showImportErrorAlert, setShowImportErrorAlert] = useState(false);

  useEffect(() => {
    const persisted = persistBackpackItems(items);
    if (!persisted) {
      setShowSaveSuccessAlert(false);
      setShowSaveErrorAlert(true);
    }
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
      const existingNames = new Set(current.map((item) => item.name));
      const uniqueName = resolveUniqueBackpackName(nextItem.name, existingNames);
      const itemToAdd =
        uniqueName === nextItem.name ? nextItem : { ...nextItem, name: uniqueName };

      const duplicate = current.some(
        (item) => item.name === itemToAdd.name && item.content === itemToAdd.content,
      );
      if (duplicate) return current;
      return [itemToAdd, ...current];
    });
    setShowSaveSuccessAlert(true);
    setShowSaveErrorAlert(false);
    return true;
  }, []);

  const addBackpackItem = useCallback((item: BackpackItem): true | string => {
    if (!item.content.trim()) {
      setShowSaveErrorAlert(true);
      return "This item has no content to save.";
    }
    setItems((current) => {
      const existingNames = new Set(current.map((entry) => entry.name));
      const uniqueName = resolveUniqueBackpackName(item.name, existingNames);
      const itemToAdd =
        uniqueName === item.name ? item : { ...item, name: uniqueName };

      const duplicate = current.some(
        (existing) =>
          existing.name === itemToAdd.name && existing.content === itemToAdd.content,
      );
      if (duplicate) return current;
      return [itemToAdd, ...current];
    });
    setShowSaveSuccessAlert(true);
    setShowSaveErrorAlert(false);
    return true;
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((current) => current.filter((item) => item.id !== itemId));
  }, []);

  const replaceBackpackItem = useCallback((itemId: string, nextItem: BackpackItem) => {
    setItems((current) =>
      current.map((entry) => (entry.id === itemId ? nextItem : entry)),
    );
  }, []);

  const renameItem = useCallback((itemId: string, newName: string): true | string => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      return "Please enter a file name.";
    }
    if (trimmedName.includes("/") || trimmedName.includes("\\")) {
      return "File names cannot include slashes.";
    }

    const item = items.find((entry) => entry.id === itemId);
    if (!item) {
      return "That file could not be found.";
    }
    if (item.name === trimmedName) {
      return true;
    }
    if (items.some((entry) => entry.id !== itemId && entry.name === trimmedName)) {
      return `A file named ${trimmedName} is already in your backpack.`;
    }

    setItems((current) =>
      current.map((entry) =>
        entry.id === itemId ? { ...entry, name: trimmedName } : entry,
      ),
    );
    return true;
  }, [items]);

  const reportImportError = useCallback(() => {
    setShowImportErrorAlert(true);
  }, []);

  const clearImportError = useCallback(() => {
    setShowImportErrorAlert(false);
  }, []);

  const seedItemsIfEmpty = useCallback((seedItems: BackpackItem[]) => {
    setItems((current) => (current.length > 0 ? current : seedItems));
  }, []);

  const refreshBackpack = useCallback(() => {
    setItems(loadBackpackItems());
  }, []);

  return {
    items,
    saveFileToBackpack,
    addBackpackItem,
    removeItem,
    replaceBackpackItem,
    renameItem,
    seedItemsIfEmpty,
    refreshBackpack,
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
