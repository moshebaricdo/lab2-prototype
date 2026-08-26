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

function prepareBackpackItemToAdd(
  item: BackpackItem,
  current: BackpackItem[],
): BackpackItem | null {
  const existingNames = new Set(current.map((entry) => entry.name));
  const uniqueName = resolveUniqueBackpackName(item.name, existingNames);
  const itemToAdd =
    uniqueName === item.name ? item : { ...item, name: uniqueName };
  const duplicate = current.some(
    (entry) => entry.name === itemToAdd.name && entry.content === itemToAdd.content,
  );
  return duplicate ? null : itemToAdd;
}

export function useBackpackState() {
  const [items, setItems] = useState<BackpackItem[]>(() => loadBackpackItems());
  const [showSaveSuccessAlert, setShowSaveSuccessAlert] = useState(false);
  const [showSaveErrorAlert, setShowSaveErrorAlert] = useState(false);
  const [showImportErrorAlert, setShowImportErrorAlert] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null);
  const [deletedSnapshot, setDeletedSnapshot] = useState<{
    item: BackpackItem;
    index: number;
  } | null>(null);

  useEffect(() => {
    const persisted = persistBackpackItems(items);
    if (!persisted) {
      setShowSaveSuccessAlert(false);
      setShowSaveErrorAlert(true);
      setShowDeleteAlert(false);
    }
  }, [items]);

  const markSaveSuccess = useCallback((itemId: string) => {
    setLastAddedItemId(itemId);
    setShowSaveSuccessAlert(true);
    setShowSaveErrorAlert(false);
    setShowDeleteAlert(false);
  }, []);

  const saveFileToBackpack = useCallback((
    file: FileItem,
    options?: { sourceLab?: BackpackSourceLab; contentOverride?: string },
  ): true | string => {
    const nextItem = createBackpackItemFromFile(file, options);
    if (typeof nextItem === "string") {
      setShowSaveErrorAlert(true);
      return nextItem;
    }

    let added: BackpackItem | null = null;
    setItems((current) => {
      added = prepareBackpackItemToAdd(nextItem, current);
      return added ? [added, ...current] : current;
    });
    if (added) markSaveSuccess(added.id);
    return true;
  }, [markSaveSuccess]);

  const addBackpackItem = useCallback((item: BackpackItem): true | string => {
    if (!item.content.trim()) {
      setShowSaveErrorAlert(true);
      return "This item has no content to save.";
    }
    let added: BackpackItem | null = null;
    setItems((current) => {
      added = prepareBackpackItemToAdd(item, current);
      return added ? [added, ...current] : current;
    });
    if (added) markSaveSuccess(added.id);
    return true;
  }, [markSaveSuccess]);

  const removeItem = useCallback((itemId: string) => {
    let snapshot: { item: BackpackItem; index: number } | null = null;
    setItems((current) => {
      const index = current.findIndex((entry) => entry.id === itemId);
      if (index === -1) return current;
      snapshot = { item: current[index], index };
      return current.filter((entry) => entry.id !== itemId);
    });
    if (!snapshot) return;
    setDeletedSnapshot(snapshot);
    setShowDeleteAlert(true);
    setShowSaveSuccessAlert(false);
    setShowSaveErrorAlert(false);
  }, []);

  const undoLastSave = useCallback(() => {
    if (!lastAddedItemId) return;
    const itemId = lastAddedItemId;
    setLastAddedItemId(null);
    setShowSaveSuccessAlert(false);
    setItems((current) => current.filter((entry) => entry.id !== itemId));
  }, [lastAddedItemId]);

  const undoLastDelete = useCallback(() => {
    if (!deletedSnapshot) return;
    const { item, index } = deletedSnapshot;
    setDeletedSnapshot(null);
    setShowDeleteAlert(false);
    setItems((current) => {
      if (current.some((entry) => entry.id === item.id)) return current;
      const next = [...current];
      next.splice(Math.min(index, next.length), 0, item);
      return next;
    });
  }, [deletedSnapshot]);

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

  /** Adds any seed items whose ids are not already in the store; leaves existing items alone. */
  const ensureSeedItems = useCallback((
    seedItems: BackpackItem[],
    options?: { removeIds?: string[] },
  ) => {
    setItems((current) => {
      const removeIds = new Set(options?.removeIds ?? []);
      const kept = removeIds.size
        ? current.filter((item) => !removeIds.has(item.id))
        : current;
      const existingIds = new Set(kept.map((item) => item.id));
      const missing = seedItems.filter((item) => !existingIds.has(item.id));
      if (missing.length === 0 && kept.length === current.length) return current;
      return [...missing, ...kept];
    });
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
    ensureSeedItems,
    refreshBackpack,
    showSaveSuccessAlert,
    setShowSaveSuccessAlert,
    showSaveErrorAlert,
    setShowSaveErrorAlert,
    showDeleteAlert,
    setShowDeleteAlert,
    deletedItemName: deletedSnapshot?.item.name ?? null,
    undoLastSave,
    undoLastDelete,
    showImportErrorAlert,
    setShowImportErrorAlert,
    reportImportError,
    clearImportError,
  };
}

export type BackpackState = ReturnType<typeof useBackpackState>;
