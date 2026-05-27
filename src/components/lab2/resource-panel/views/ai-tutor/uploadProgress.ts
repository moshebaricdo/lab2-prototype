const UPLOAD_PROGRESS_CAP = 92;
const UPLOAD_PROGRESS_DURATION_MS = 1100;
/** Keep the indicator visible long enough to perceive on fast local FileReader. */
export const MIN_UPLOAD_INDICATOR_MS = 700;

export function waitForMinimumUploadIndicator(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, MIN_UPLOAD_INDICATOR_MS);
  });
}

export function runSimulatedUploadProgress(
  onProgress: (progress: number) => void,
): () => void {
  const start = performance.now();
  let frameId = 0;

  const tick = (now: number) => {
    const elapsed = now - start;
    const t = Math.min(elapsed / UPLOAD_PROGRESS_DURATION_MS, 1);
    const eased = 1 - (1 - t) ** 2;
    onProgress(Math.round(eased * UPLOAD_PROGRESS_CAP));
    if (t < 1) {
      frameId = requestAnimationFrame(tick);
    }
  };

  onProgress(0);
  frameId = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(frameId);
  };
}

export async function finishUploadProgress(
  onProgress: (progress: number) => void,
): Promise<void> {
  onProgress(100);
  await new Promise((resolve) => {
    window.setTimeout(resolve, 120);
  });
}
