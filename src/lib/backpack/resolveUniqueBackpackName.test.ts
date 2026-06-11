import { describe, expect, it } from "vitest";
import { resolveUniqueBackpackName } from "./resolveUniqueBackpackName";

describe("resolveUniqueBackpackName", () => {
  it("returns the desired name when it is unused", () => {
    expect(resolveUniqueBackpackName("sketch.jpg", [])).toBe("sketch.jpg");
  });

  it("appends _01 before the extension on the first collision", () => {
    expect(resolveUniqueBackpackName("sketch.jpg", ["sketch.jpg"])).toBe(
      "sketch_01.jpg",
    );
  });

  it("increments the suffix until a free name is found", () => {
    expect(
      resolveUniqueBackpackName("sketch.jpg", [
        "sketch.jpg",
        "sketch_01.jpg",
        "sketch_02.jpg",
      ]),
    ).toBe("sketch_03.jpg");
  });

  it("suffixes names without an extension", () => {
    expect(resolveUniqueBackpackName("README", ["README"])).toBe("README_01");
  });

  it("preserves dots in the base name", () => {
    expect(resolveUniqueBackpackName("my.file.txt", ["my.file.txt"])).toBe(
      "my.file_01.txt",
    );
  });
});
