import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import type { DevPanelUploadedFile } from "../components/lab2/dev";

export const STARTER_SHARE_PARAM = "starter";

const STARTER_SHARE_VERSION = 1;
const MAX_STARTER_FILES = 12;
const MAX_STARTER_RAW_BYTES = 100_000;
const MAX_STARTER_PARAM_CHARS = 18_000;
const SUPPORTED_STARTER_EXTENSIONS = new Set([
  "css",
  "htm",
  "html",
  "js",
  "json",
  "md",
  "txt",
]);

export interface StarterSharePayload {
  v: typeof STARTER_SHARE_VERSION;
  files: Array<Pick<DevPanelUploadedFile, "content" | "path">>;
}

type EncodeStarterShareResult =
  | { ok: true; encoded: string }
  | { ok: false; reason: string };

function getPathExtension(path: string) {
  return path.split(".").pop()?.toLowerCase() ?? "";
}

function getUtf8ByteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

function normalizeShareFiles(files: DevPanelUploadedFile[]) {
  return files.map((file) => ({
    path: file.path || file.name,
    content: file.content,
  }));
}

export function encodeStarterSharePayload(
  upload: { files?: DevPanelUploadedFile[] } | null | undefined,
): EncodeStarterShareResult {
  const files = upload?.files ?? [];
  if (files.length === 0) return { ok: true, encoded: "" };

  if (files.length > MAX_STARTER_FILES) {
    return {
      ok: false,
      reason: `Starter projects can include up to ${MAX_STARTER_FILES} files in a share link.`,
    };
  }

  const unsupportedFile = files.find(
    (file) => !SUPPORTED_STARTER_EXTENSIONS.has(getPathExtension(file.path || file.name)),
  );
  if (unsupportedFile) {
    return {
      ok: false,
      reason: `Starter share links only support text files (${Array.from(SUPPORTED_STARTER_EXTENSIONS).sort().join(", ")}). Unsupported file: ${unsupportedFile.path || unsupportedFile.name}.`,
    };
  }

  const payload: StarterSharePayload = {
    v: STARTER_SHARE_VERSION,
    files: normalizeShareFiles(files),
  };
  const json = JSON.stringify(payload);

  if (getUtf8ByteLength(json) > MAX_STARTER_RAW_BYTES) {
    return {
      ok: false,
      reason: "This starter project is too large for URL sharing. Codify it as an example project instead.",
    };
  }

  const encoded = compressToEncodedURIComponent(json);
  if (encoded.length > MAX_STARTER_PARAM_CHARS) {
    return {
      ok: false,
      reason: "This starter project makes the share URL too long. Codify it as an example project instead.",
    };
  }

  return { ok: true, encoded };
}

export function decodeStarterSharePayload(
  encoded: string | null | undefined,
): StarterSharePayload | null {
  if (!encoded) return null;

  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const payload = JSON.parse(json) as Partial<StarterSharePayload>;

    if (payload.v !== STARTER_SHARE_VERSION || !Array.isArray(payload.files)) {
      return null;
    }

    const files = payload.files.filter(
      (file): file is StarterSharePayload["files"][number] =>
        Boolean(
          file &&
            typeof file.path === "string" &&
            typeof file.content === "string" &&
            SUPPORTED_STARTER_EXTENSIONS.has(getPathExtension(file.path)),
        ),
    );

    if (files.length === 0 || files.length > MAX_STARTER_FILES) return null;

    return {
      v: STARTER_SHARE_VERSION,
      files,
    };
  } catch {
    return null;
  }
}

export function starterSharePayloadToUpload(
  payload: StarterSharePayload,
): { files: DevPanelUploadedFile[]; uploadedAt: string } {
  return {
    files: payload.files.map((file) => ({
      name: file.path.split("/").pop() ?? file.path,
      path: file.path,
      type: "text/plain",
      size: getUtf8ByteLength(file.content),
      content: file.content,
    })),
    uploadedAt: new Date().toISOString(),
  };
}
