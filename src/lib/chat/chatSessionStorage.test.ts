import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatMessage } from "../../types/chat";
import {
  hydrateChatMessageUploadImages,
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

  it("strips heavy upload payloads before persisting", () => {
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
            content: "small preview context",
            source: "preview-element",
          },
          {
            fileName: "photo.png",
            path: "uploads/photo.png",
            imageDataUrl: "data:image/png;base64,large",
            imageSrc: "data:image/png;base64,large",
            content: "Uploaded image file: photo.png",
            source: "upload",
          },
        ],
      },
    ];

    writeStoredChatState(STORAGE_KEY, { messages, input: "" });
    const storedRaw = window.sessionStorage.getItem(STORAGE_KEY);
    expect(storedRaw).not.toContain("imageDataUrl");
    expect(storedRaw).not.toContain("data:image/png;base64,large");
    expect(storedRaw).not.toContain("Uploaded image file: photo.png");
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
              content: "small preview context",
              source: "preview-element",
            },
            {
              fileName: "photo.png",
              path: "uploads/photo.png",
              source: "upload",
            },
          ],
        },
      ],
      input: "",
    });
  });

  it("removes pending edit option cards when restoring", () => {
    const messages: ChatMessage[] = [
      {
        role: "assistant",
        content: "Pick a direction first:",
        editOptions: {
          status: "pending",
          originalMessage: "make the buttons more exciting",
          options: [
            {
              id: "motion",
              label: "More playful motion",
              enrichPrompt: "Use playful motion.",
            },
          ],
        },
      },
    ];

    expect(sanitizeChatMessagesFromStorage(messages)).toEqual([
      {
        role: "assistant",
        content: "Pick a direction first:",
      },
    ]);
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

  it("hydrates upload attachment thumbnails from project image paths", () => {
    const imageContentByPath = new Map<string, string>([
      ["uploads/monstera.jpg", "data:image/jpeg;base64,abc"],
      ["monstera.jpg", "data:image/jpeg;base64,abc"],
    ]);
    const messages: ChatMessage[] = [
      {
        role: "user",
        content: "Please use these photos",
        attachments: [
          {
            fileName: "monstera.jpg",
            path: "uploads/monstera.jpg",
            source: "upload",
            timestamp: "1:17 PM",
          },
        ],
      },
    ];

    expect(hydrateChatMessageUploadImages(messages, imageContentByPath)).toEqual([
      {
        role: "user",
        content: "Please use these photos",
        attachments: [
          {
            fileName: "monstera.jpg",
            path: "uploads/monstera.jpg",
            source: "upload",
            timestamp: "1:17 PM",
            imageSrc: "data:image/jpeg;base64,abc",
          },
        ],
      },
    ]);
  });

  it("hydrateChatMessageUploadImages returns the same array when nothing changes", () => {
    const messages: ChatMessage[] = [{ role: "user", content: "Hello" }];
    expect(hydrateChatMessageUploadImages(messages, new Map())).toBe(messages);
  });
});
