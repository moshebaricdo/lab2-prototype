import { describe, expect, it } from "vitest";
import { groupLabSettings, labSettingsProfileFromPath } from "./labSettings";

describe("labSettingsProfileFromPath", () => {
  it("maps each lab route to its settings profile", () => {
    expect(labSettingsProfileFromPath("/levels/pythonlab")).toBe("python");
    expect(labSettingsProfileFromPath("/levels/pythonlab-blank")).toBe("python");
    expect(labSettingsProfileFromPath("/levels/weblab2-demo-project")).toBe("web");
    expect(labSettingsProfileFromPath("/levels/sketchlab")).toBe("sketch");
    expect(labSettingsProfileFromPath("/levels/aichatlab-setup")).toBe("chat");
    expect(labSettingsProfileFromPath("/levels/musiclab")).toBe("music");
    expect(labSettingsProfileFromPath("/levels/sprite-lab")).toBe("sprite");
    expect(labSettingsProfileFromPath("/levels/ailab")).toBe("simple");
    expect(labSettingsProfileFromPath("/levels/multi")).toBe("simple");
  });
});

describe("groupLabSettings", () => {
  it("orders groups as general, appearance, editor, then workspace", () => {
    expect(groupLabSettings("chat").map((group) => group.id)).toEqual(["general", "appearance"]);
    expect(groupLabSettings("sketch").map((group) => group.id)).toEqual(["general", "appearance"]);
    expect(groupLabSettings("simple").map((group) => group.id)).toEqual(["general", "appearance"]);

    const music = groupLabSettings("music");
    expect(music.map((group) => group.id)).toEqual(["general", "appearance"]);
    expect(music.find((group) => group.id === "appearance")?.fields.map((field) => field.key)).toEqual([
      "theme",
      "blockColorTheme",
    ]);

    expect(groupLabSettings("web").map((group) => group.id)).toEqual(["general", "appearance", "editor"]);
    expect(groupLabSettings("python").map((group) => group.id)).toEqual([
      "general",
      "appearance",
      "editor",
      "workspace",
    ]);
    expect(groupLabSettings("sprite").map((group) => group.id)).toEqual(["general", "appearance"]);
  });

  it("uses a toggle for autocomplete and drops the theme helper", () => {
    const editor = groupLabSettings("python").find((group) => group.id === "editor");
    const autocomplete = editor?.fields.find((field) => field.key === "autocomplete");
    expect(autocomplete?.control).toBe("toggle");
    expect(autocomplete?.defaultValue).toBe("Off");
    expect(autocomplete?.helperText).toMatch(/Predicts and suggests/);

    const theme = groupLabSettings("chat")
      .find((group) => group.id === "appearance")
      ?.fields.find((field) => field.key === "theme");
    expect(theme?.helperText).toBeUndefined();
  });
});
