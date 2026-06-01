import { describe, expect, it } from "vitest";
import {
  getFileTypeIconConfigForCreateFileType,
  getFileTypeIconConfigForExtension,
  getFileTypeIconConfigForFileItem,
  getFileTypeIconConfigForPath,
} from "./fileTypeIcons";

describe("getFileTypeIconConfigForExtension", () => {
  it("maps common extensions to solid and brand icons", () => {
    expect(getFileTypeIconConfigForExtension("html")).toEqual({
      family: "solid",
      name: "file-code",
    });
    expect(getFileTypeIconConfigForExtension("css")).toEqual({
      family: "brands",
      name: "css",
    });
    expect(getFileTypeIconConfigForExtension("js")).toEqual({
      family: "brands",
      name: "js",
    });
    expect(getFileTypeIconConfigForExtension("py")).toEqual({
      family: "brands",
      name: "python",
    });
    expect(getFileTypeIconConfigForExtension("tsx")).toEqual({
      family: "brands",
      name: "react",
    });
    expect(getFileTypeIconConfigForExtension("svg")).toEqual({
      family: "solid",
      name: "file-svg",
    });
    expect(getFileTypeIconConfigForExtension("png")).toEqual({
      family: "solid",
      name: "image",
    });
  });
});

describe("getFileTypeIconConfigForFileItem", () => {
  it("uses svg icon for svg image files", () => {
    expect(
      getFileTypeIconConfigForFileItem({
        name: "logo.svg",
        type: "image",
      }),
    ).toEqual({ family: "solid", name: "file-svg" });
  });
});

describe("getFileTypeIconConfigForPath", () => {
  it("derives icon config from a file path", () => {
    expect(getFileTypeIconConfigForPath("uploads/readme.md")).toEqual({
      family: "brands",
      name: "markdown",
    });
  });
});

describe("getFileTypeIconConfigForCreateFileType", () => {
  it("maps create-file modal types", () => {
    expect(getFileTypeIconConfigForCreateFileType("PY")).toEqual({
      family: "brands",
      name: "python",
    });
  });
});
