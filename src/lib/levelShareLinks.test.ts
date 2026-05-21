import { describe, expect, it } from "vitest";
import {
  findLevelLinkIndex,
  includesLevelPath,
  isProgressionLevelLinks,
  isProgressionLevelPath,
  mapLevelLinksWithShareMode,
  resolveShareAwareNavigationPath,
  withLevelShareModePath,
} from "./levelShareLinks";
import { sampleProgressionLinks, webLab2LevelLinks } from "../pages/levelTypeLinks";

describe("isProgressionLevelPath", () => {
  it("matches progression routes", () => {
    expect(isProgressionLevelPath("/levels/progression-weblab")).toBe(true);
    expect(isProgressionLevelPath("/levels/progression-weblab2-validation-fix")).toBe(
      true,
    );
  });

  it("ignores demo and type-variant routes", () => {
    expect(isProgressionLevelPath("/levels/weblab2")).toBe(false);
    expect(isProgressionLevelPath("/levels/multi-authoring")).toBe(false);
  });
});

describe("isProgressionLevelLinks", () => {
  it("returns true for sample progression links", () => {
    expect(isProgressionLevelLinks(sampleProgressionLinks)).toBe(true);
  });

  it("returns false for demo level link sets", () => {
    expect(isProgressionLevelLinks(webLab2LevelLinks)).toBe(false);
  });
});

describe("withLevelShareModePath", () => {
  it("adds locked share mode to a path", () => {
    expect(withLevelShareModePath("/levels/progression-weblab", "locked")).toBe(
      "/levels/progression-weblab?share=locked",
    );
  });

  it("preserves existing search params while setting share mode", () => {
    expect(
      withLevelShareModePath("/levels/progression-weblab?foo=bar", "locked"),
    ).toBe("/levels/progression-weblab?foo=bar&share=locked");
  });
});

describe("mapLevelLinksWithShareMode", () => {
  it("maps every progression link", () => {
    const [first] = mapLevelLinksWithShareMode(sampleProgressionLinks, "locked");
    expect(first.path).toBe("/levels/progression-weblab?share=locked");
  });
});

describe("findLevelLinkIndex", () => {
  it("matches level links that include share search params", () => {
    const links = mapLevelLinksWithShareMode(sampleProgressionLinks, "locked");
    expect(
      findLevelLinkIndex(links, "/levels/progression-free-response"),
    ).toBe(1);
  });
});

describe("includesLevelPath", () => {
  it("matches completed paths regardless of search params", () => {
    expect(
      includesLevelPath(
        ["/levels/progression-weblab?share=locked"],
        "/levels/progression-weblab",
      ),
    ).toBe(true);
  });
});

describe("resolveShareAwareNavigationPath", () => {
  it("preserves locked share mode for progression navigation", () => {
    expect(
      resolveShareAwareNavigationPath(
        "/levels/progression-free-response",
        "locked",
      ),
    ).toBe("/levels/progression-free-response?share=locked");
  });

  it("leaves demo routes unchanged in locked share mode", () => {
    expect(resolveShareAwareNavigationPath("/levels/weblab2", "locked")).toBe(
      "/levels/weblab2",
    );
  });
});
