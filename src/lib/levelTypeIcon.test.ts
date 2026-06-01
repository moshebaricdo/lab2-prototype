import { describe, expect, it } from "vitest";
import { getLevelTypeIconConfig } from "./levelTypeIcon";

describe("getLevelTypeIconConfig", () => {
  it("maps lab and assessment routes to the expected icons", () => {
    expect(getLevelTypeIconConfig("/levels/weblab2-level")).toEqual({
      family: "solid",
      name: "display-code",
    });
    expect(getLevelTypeIconConfig("/levels/pythonlab")).toEqual({
      family: "brands",
      name: "python",
    });
    expect(getLevelTypeIconConfig("/levels/aichatlab-setup")).toEqual({
      family: "solid",
      name: "messages",
    });
    expect(getLevelTypeIconConfig("/levels/progression-free-response")).toEqual({
      family: "solid",
      name: "rectangle-list",
    });
  });
});
