/**
 * Vite `?raw` imports — load file contents as a string at build time.
 * Used by the per-file mock project layout under `src/data/<lab>/projects/`.
 */
declare module "*?raw" {
  const content: string;
  export default content;
}
