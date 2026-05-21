import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatMessage } from "../../types/chat";
import {
  prepareChatMessagesForStorage,
  readStoredChatState,
  sanitizeChatMessagesFromStorage,
  writeStoredChatState,
} from "./chatSessionStorage";

const STORAGE_KEY = "test:chat";

function createSessionStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

describe("chatSessionStorage", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { sessionStorage: createSessionStorageMock() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("round-trips chat messages and draft input", () => {
    const messages: ChatMessage[] = [
      { role: "user", content: "How do I center a div?" },
      { role: "assistant", content: "Use flexbox or margin auto." },
    ];

    writeStoredChatState(STORAGE_KEY, { messages, input: "What about grid?" });

    expect(readStoredChatState(STORAGE_KEY)).toEqual({
      messages,
      input: "What about grid?",
    });
  });

  it("strips imageDataUrl from attachments before persisting", () => {
    const messages: ChatMessage[] = [
      {
        role: "user",
        content: "Fix this button",
        attachments: [
          {
            fileName: "preview.png",
            path: "preview-elements/index.html#btn",
            imageDataUrl: "data:image/png;base64,abc",
            imageSrc: "blob:preview",
          },
        ],
      },
    ];

    writeStoredChatState(STORAGE_KEY, { messages, input: "" });
    const storedRaw = window.sessionStorage.getItem(STORAGE_KEY);
    expect(storedRaw).not.toContain("imageDataUrl");
    expect(readStoredChatState(STORAGE_KEY)).toEqual({
      messages: [
        {
          role: "user",
          content: "Fix this button",
          attachments: [
            {
              fileName: "preview.png",
              path: "preview-elements/index.html#btn",
              imageSrc: "blob:preview",
            },
          ],
        },
      ],
      input: "",
    });
  });

  it("marks pending code changes as rejected when restoring", () => {
    const messages: ChatMessage[] = [
      {
        role: "assistant",
        content: "I updated styles.css.",
        codeChangeStatus: "pending",
        fileChanges: [{ fileName: "styles.css", status: "modified" }],
      },
    ];

    expect(sanitizeChatMessagesFromStorage(messages)).toEqual([
      {
        role: "assistant",
        content: "I updated styles.css.",
        codeChangeStatus: "rejected",
        fileChanges: [{ fileName: "styles.css", status: "modified" }],
      },
    ]);
  });

  it("returns null for invalid stored payloads", () => {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ messages: [{ role: "system" }] }));
    expect(readStoredChatState(STORAGE_KEY)).toBeNull();
  });

  it("prepareChatMessagesForStorage leaves messages without attachments unchanged", () => {
    const messages: ChatMessage[] = [{ role: "user", content: "Hello" }];
    expect(prepareChatMessagesForStorage(messages)).toEqual(messages);
  });
});
