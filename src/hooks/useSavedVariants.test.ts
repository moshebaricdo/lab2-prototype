import { describe, expect, it } from "vitest";
import { buildVariantUrl } from "./useSavedVariants";

function decodeOverrides(encoded: string) {
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

describe("buildVariantUrl", () => {
  it("encodes saved variant overrides that contain Unicode text", () => {
    const url = buildVariantUrl("/levels/weblab2", {
      instructions: "Add a café card with 🚀",
    });
    const params = new URLSearchParams(url.split("?")[1]);

    expect(decodeOverrides(params.get("o") ?? "")).toEqual({
      instructions: "Add a café card with 🚀",
    });
  });
});
