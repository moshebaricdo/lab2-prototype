import { useEffect } from "react";
import { useBackpack } from "../../hooks/BackpackContext";
import type { BackpackItem } from "../../types/backpack";

export function BackpackSeedEffect({
  items,
}: {
  items?: BackpackItem[];
}) {
  const { seedItemsIfEmpty } = useBackpack();

  useEffect(() => {
    if (items?.length) {
      seedItemsIfEmpty(items);
    }
  }, [items, seedItemsIfEmpty]);

  return null;
}
