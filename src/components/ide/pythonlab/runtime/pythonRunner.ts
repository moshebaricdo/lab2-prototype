import { loadPyodide, version as pyodideVersion, type PyodideInterface } from "pyodide";

const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${pyodideVersion}/full/`;
const DEFAULT_STDIN_VALUES = ["Ada"];

let pyodidePromise: Promise<PyodideInterface> | null = null;

export interface PythonRunResult {
  stdout: string[];
  stderr: string[];
  error?: string;
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

export async function runPythonCode(
  code: string,
  options: { stdin?: string[] } = {},
): Promise<PythonRunResult> {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const stdinValues = [...(options.stdin ?? DEFAULT_STDIN_VALUES)];
  let pyodide: PyodideInterface | null = null;

  try {
    pyodide = await getPyodide();
    pyodide.setStdout({
      batched: (output) => {
        if (output) stdout.push(output);
      },
    });
    pyodide.setStderr({
      batched: (output) => {
        if (output) stderr.push(output);
      },
    });
    pyodide.setStdin({
      stdin: () => {
        if (stdinValues.length === 0) {
          throw new Error("Program requested input, but no more input values are configured.");
        }
        return stdinValues.shift() ?? "";
      },
    });

    await pyodide.runPythonAsync(code);
    return { stdout, stderr };
  } catch (error) {
    return {
      stdout,
      stderr,
      error: formatPythonError(error),
    };
  } finally {
    pyodide?.setStdout();
    pyodide?.setStderr();
    pyodide?.setStdin();
  }
}
