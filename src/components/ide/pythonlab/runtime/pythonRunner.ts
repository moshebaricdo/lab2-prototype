const STDIN_CONTROL_SLOTS = 2;
const STDIN_DATA_OFFSET = STDIN_CONTROL_SLOTS * Int32Array.BYTES_PER_ELEMENT;
const STDIN_BUFFER_BYTES = 64 * 1024;
const STDIN_STATE_READY = 1;
const STDIN_STATE_INTERRUPTED = 2;

export interface PythonRunResult {
  stdout: string[];
  stderr: string[];
  error?: string;
}

interface PythonRunCallbacks {
  onStdout?: (text: string) => void;
  onStderr?: (text: string) => void;
  onStdinRequest?: () => void;
}

export interface PythonRunSession {
  result: Promise<PythonRunResult>;
  submitInput: (value: string) => void;
  dispose: () => void;
}

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

function createStdinBuffer() {
  if (typeof SharedArrayBuffer === "undefined" || typeof Atomics === "undefined") {
    return undefined;
  }

  return new SharedArrayBuffer(STDIN_DATA_OFFSET + STDIN_BUFFER_BYTES);
}

function writeInputToBuffer(stdinBuffer: SharedArrayBuffer, value: string) {
  const control = new Int32Array(stdinBuffer, 0, STDIN_CONTROL_SLOTS);
  const inputBytes = new Uint8Array(stdinBuffer, STDIN_DATA_OFFSET);
  const encoded = new TextEncoder().encode(value);
  const byteLength = Math.min(encoded.byteLength, inputBytes.byteLength);
  inputBytes.fill(0);
  inputBytes.set(encoded.slice(0, byteLength));
  Atomics.store(control, 1, byteLength);
  Atomics.store(control, 0, STDIN_STATE_READY);
  Atomics.notify(control, 0);
}

function interruptStdin(stdinBuffer: SharedArrayBuffer | undefined) {
  if (!stdinBuffer) return;
  const control = new Int32Array(stdinBuffer, 0, STDIN_CONTROL_SLOTS);
  Atomics.store(control, 0, STDIN_STATE_INTERRUPTED);
  Atomics.notify(control, 0);
}

export function startPythonRun(
  code: string,
  callbacks: PythonRunCallbacks = {},
): PythonRunSession {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const stdinBuffer = createStdinBuffer();
  const worker = new Worker(new URL("./pythonRunner.worker.ts", import.meta.url), {
    type: "module",
  });

  const result = new Promise<PythonRunResult>((resolve) => {
    let settled = false;

    const finish = (runResult: PythonRunResult) => {
      if (settled) return;
      settled = true;
      worker.terminate();
      resolve(runResult);
    };

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;

      if (message.type === "stdout") {
        stdout.push(message.text);
        callbacks.onStdout?.(message.text);
        return;
      }

      if (message.type === "stderr") {
        stderr.push(message.text);
        callbacks.onStderr?.(message.text);
        return;
      }

      if (message.type === "stdin-request") {
        callbacks.onStdinRequest?.();
        return;
      }

      if (message.type === "complete") {
        finish({ stdout, stderr });
        return;
      }

      if (message.type === "error") {
        finish({ stdout, stderr, error: message.message });
      }
    };

    worker.onerror = (event) => {
      finish({
        stdout,
        stderr,
        error: event.message || "Unable to run Python code.",
      });
    };

    try {
      worker.postMessage({
        type: "run",
        code,
        stdinBuffer,
      });
    } catch {
      finish({
        stdout,
        stderr,
        error:
          "Interactive console input requires browser shared memory support. Restart the dev server and reload the page.",
      });
    }
  });

  return {
    result,
    submitInput: (value: string) => {
      if (!stdinBuffer) return;
      writeInputToBuffer(stdinBuffer, value);
    },
    dispose: () => {
      interruptStdin(stdinBuffer);
      worker.terminate();
    },
  };
}
