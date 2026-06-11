import { describe, expect, it } from "vitest";
import type { BackpackItem } from "../../types/backpack";
import {
  BACKPACK_TYPE_FILTER_MEDIA,
  backpackItemTypeId,
  filterBackpackItemsByType,
  getBackpackFilterOptions,
  getBackpackTypeFilterOptions,
} from "./backpackFilters";

function item(name: string, overrides: Partial<BackpackItem> = {}): BackpackItem {
  return {
    id: `id-${name}`,
    name,
    savedAt: "2026-01-01T00:00:00.000Z",
    content: "content",
    fileKind: "file",
    ...overrides,
  };
}

describe("getBackpackTypeFilterOptions", () => {
  it("groups image extensions under Media and always lists it after All types", () => {
    const items = [
      item("sketch.jpg", { fileKind: "image", thumbnailSrc: "data:image/jpeg;base64,abc" }),
      item("photo.png", { fileKind: "image" }),
      item("index.html", { fileKind: "html" }),
    ];

    expect(getBackpackTypeFilterOptions(items)).toEqual([
      { id: "all", label: "All types", count: 3 },
      { id: BACKPACK_TYPE_FILTER_MEDIA, label: "Media", count: 2 },
      { id: "html", label: ".html", count: 1 },
    ]);
  });

  it("always includes Media even when there are no image files", () => {
    expect(getBackpackTypeFilterOptions([item("index.html", { fileKind: "html" })])).toEqual([
      { id: "all", label: "All types", count: 1 },
      { id: BACKPACK_TYPE_FILTER_MEDIA, label: "Media", count: 0 },
      { id: "html", label: ".html", count: 1 },
    ]);
  });
});

describe("backpackItemTypeId", () => {
  it("maps image files to media", () => {
    expect(backpackItemTypeId(item("sketch.jpg", { fileKind: "image" }))).toBe(
      BACKPACK_TYPE_FILTER_MEDIA,
    );
  });
});

describe("filterBackpackItemsByType", () => {
  it("filters by the media group", () => {
    const items = [
      item("sketch.jpg", { fileKind: "image" }),
      item("index.html", { fileKind: "html" }),
    ];

    expect(filterBackpackItemsByType(items, BACKPACK_TYPE_FILTER_MEDIA)).toEqual([
      items[0],
    ]);
  });
});

describe("getBackpackFilterOptions", () => {
  it("always lists Media directly under All files", () => {
    const options = getBackpackFilterOptions([
      item("index.html", { fileKind: "html" }),
    ]);

    expect(options[0]).toEqual({ id: "all", label: "All files", count: 1 });
    expect(options[1]).toEqual({ id: "images", label: "Media", count: 0 });
  });
});
