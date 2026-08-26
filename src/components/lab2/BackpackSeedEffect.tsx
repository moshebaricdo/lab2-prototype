import { useEffect } from "react";
import { useBackpack } from "../../hooks/BackpackContext";
import { CROSS_LAB_BACKPACK_RETIRED_SEED_IDS } from "../../data/backpack/crossLabBackpackSeed";
import type { BackpackItem } from "../../types/backpack";

export function BackpackSeedEffect({
  items,
  ensureItems,
}: {
  items?: BackpackItem[];
  ensureItems?: BackpackItem[];
}) {
  const { seedItemsIfEmpty, ensureSeedItems } = useBackpack();

  useEffect(() => {
    if (ensureItems?.length) {
      ensureSeedItems(ensureItems, {
        removeIds: CROSS_LAB_BACKPACK_RETIRED_SEED_IDS,
      });
      return;
    }
    if (items?.length) {
      seedItemsIfEmpty(items);
    }
  }, [items, ensureItems, seedItemsIfEmpty, ensureSeedItems]);

  return null;
}
