import { describe, expect, it } from "vitest";
import {
  AGENT_BACKPACK_FILE_KIND,
  createAgentBackpackItem,
  deserializeAgentBackpackItem,
  isAgentBackpackItem,
} from "./agentBackpack";
import { designerSpecialist } from "../../data/agentic/specialists";
import type { BackpackItem } from "../../types/backpack";

describe("agent backpack serialization (spec V4 Decision D/E)", () => {
  it("round-trips a specialist through a backpack item", () => {
    const edited = {
      ...designerSpecialist,
      role: "Style helper",
      contract: "Only touch typography.",
    };
    const item = createAgentBackpackItem(edited);

    expect(item.fileKind).toBe(AGENT_BACKPACK_FILE_KIND);
    expect(item.name).toBe("Style helper");
    expect(isAgentBackpackItem(item)).toBe(true);

    const recovered = deserializeAgentBackpackItem(item);
    expect(recovered?.role).toBe("Style helper");
    expect(recovered?.contract).toBe("Only touch typography.");
    expect(recovered?.writablePaths).toEqual(designerSpecialist.writablePaths);
    // Recalled agents always land unlocked.
    expect(recovered?.unlocked).toBe(true);
  });

  it("ignores non-agent items", () => {
    const fileItem: BackpackItem = {
      id: "1",
      name: "styles.css",
      savedAt: new Date().toISOString(),
      content: "body{}",
      fileKind: "css",
    };
    expect(isAgentBackpackItem(fileItem)).toBe(false);
    expect(deserializeAgentBackpackItem(fileItem)).toBeNull();
  });

  it("returns null for a corrupt or unknown payload", () => {
    const corrupt: BackpackItem = {
      id: "2",
      name: "Mystery",
      savedAt: new Date().toISOString(),
      content: "{not json",
      fileKind: AGENT_BACKPACK_FILE_KIND,
    };
    expect(deserializeAgentBackpackItem(corrupt)).toBeNull();

    const wrongSchema: BackpackItem = {
      ...corrupt,
      content: JSON.stringify({ schema: "something-else", specialist: {} }),
    };
    expect(deserializeAgentBackpackItem(wrongSchema)).toBeNull();
  });
});
