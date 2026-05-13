/**
 * Vite `?raw` imports — load file contents as a string at build time.
 * Used by the per-file mock project layout under `src/data/<lab>/projects/`.
 */
declare module "*?raw" {
  const content: string;
  export default content;
}

/**
 * Vite `?inline` imports — force assets such as sample images into data URLs.
 * This keeps Web Lab file-preview images from making sandboxed iframe requests.
 */
declare module "*?inline" {
  const content: string;
  export default content;
}
