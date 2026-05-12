import { loadPyodide, version as pyodideVersion, type PyodideInterface } from "pyodide";

const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${pyodideVersion}/full/`;
const STDIN_CONTROL_SLOTS = 2;
const STDIN_DATA_OFFSET = STDIN_CONTROL_SLOTS * Int32Array.BYTES_PER_ELEMENT;

const STDIN_STATE_EMPTY = 0;
const STDIN_STATE_READY = 1;
const STDIN_STATE_INTERRUPTED = 2;

type WorkerRequest =
  | {
      type: "run";
      code: string;
      stdinBuffer?: SharedArrayBuffer;
    };

type WorkerResponse =
  | {
      type: "stdout" | "stderr";
      text: string;
    }
  | {
      type: "stdin-request" | "complete";
    }
  | {
      type: "error";
      message: string;
    };

let pyodidePromise: Promise<PyodideInterface> | null = null;

function postWorkerMessage(message: WorkerResponse) {
  self.postMessage(message);
}

function getPyodide() {
  pyodidePromise ??= loadPyodide({
    indexURL: PYODIDE_INDEX_URL,
  });
  return pyodidePromise;
}

function formatPythonError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const lines = message
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const pythonErrorLine = [...lines]
    .reverse()
    .find((line) => /^[A-Za-z_][\w.]*(Error|Exception|Warning):\s/.test(line));

  if (pythonErrorLine) {
    return pythonErrorLine;
  }

  const meaningfulLine = [...lines]
    .reverse()
    .find((line) =>
      !line.startsWith("at ") &&
      !line.includes("pyodide.asm") &&
      !line.includes("pyodide.mjs")
    );

  return meaningfulLine ?? message;
}

function makeStdinReader(stdinBuffer: SharedArrayBuffer | undefined) {
  if (!stdinBuffer) {
    return () => {
      throw new Error(
        "Interactive console input requires browser shared memory support. Restart the dev server and reload the page.",
      );
    };
  }

  const control = new Int32Array(stdinBuffer, 0, STDIN_CONTROL_SLOTS);
  const inputBytes = new Uint8Array(stdinBuffer, STDIN_DATA_OFFSET);
  const decoder = new TextDecoder();

  return () => {
    Atomics.store(control, 0, STDIN_STATE_EMPTY);
    Atomics.store(control, 1, 0);
    postWorkerMessage({ type: "stdin-request" });

    while (true) {
      const state = Atomics.load(control, 0);

      if (state === STDIN_STATE_READY) {
        const byteLength = Atomics.load(control, 1);
        const value = decoder.decode(inputBytes.slice(0, byteLength));
        Atomics.store(control, 0, STDIN_STATE_EMPTY);
        Atomics.store(control, 1, 0);
        return value;
      }

      if (state === STDIN_STATE_INTERRUPTED) {
        throw new Error("Program input was interrupted.");
      }

      Atomics.wait(control, 0, STDIN_STATE_EMPTY, 100);
    }
  };
}

function flushDecoder(
  decoder: TextDecoder,
  type: Extract<WorkerResponse["type"], "stdout" | "stderr">,
) {
  const text = decoder.decode();
  if (text) {
    postWorkerMessage({ type, text });
  }
}

async function runPython(code: string, stdinBuffer: SharedArrayBuffer | undefined) {
  let pyodide: PyodideInterface | null = null;
  const stdoutDecoder = new TextDecoder();
  const stderrDecoder = new TextDecoder();

  try {
    pyodide = await getPyodide();
    pyodide.setStdout({
      write: (buffer) => {
        const text = stdoutDecoder.decode(buffer, { stream: true });
        if (text) {
          postWorkerMessage({ type: "stdout", text });
        }
        return buffer.length;
      },
    });
    pyodide.setStderr({
      write: (buffer) => {
        const text = stderrDecoder.decode(buffer, { stream: true });
        if (text) {
          postWorkerMessage({ type: "stderr", text });
        }
        return buffer.length;
      },
    });
    pyodide.setStdin({
      stdin: makeStdinReader(stdinBuffer),
      isatty: true,
    });

    await pyodide.runPythonAsync(code);
    flushDecoder(stdoutDecoder, "stdout");
    flushDecoder(stderrDecoder, "stderr");
    postWorkerMessage({ type: "complete" });
  } catch (error) {
    flushDecoder(stdoutDecoder, "stdout");
    flushDecoder(stderrDecoder, "stderr");
    postWorkerMessage({ type: "error", message: formatPythonError(error) });
  } finally {
    pyodide?.setStdout();
    pyodide?.setStderr();
    pyodide?.setStdin();
  }
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  if (event.data.type === "run") {
    void runPython(event.data.code, event.data.stdinBuffer);
  }
};
