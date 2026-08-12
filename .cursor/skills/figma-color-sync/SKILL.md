---
name: figma-color-sync
description: Sync CodeAI color variables from the CADS Figma file into the color sandbox. Compares Figma primitive/semantic variable definitions against the committed sandbox baseline — values, mode mappings, AND naming/structure — applies updates including renames, and prepares a targeted commit. Use when the user asks to sync colors/tokens/variables with Figma, review Figma-vs-sandbox differences, or update the CodeAI palette from design.
---

# Figma → Color Sandbox Sync (CodeAI)

Sync the CodeAI theme in the color sandbox with the variable definitions in the CADS Figma file, then prepare a targeted commit.

The sync tracks **four kinds of drift**, all first-class:

1. **Values** — primitive hexes, per-mode resolved values.
2. **Mappings** — semantic → primitive refs and semantic → semantic aliases, per mode (Light *and* Dark).
3. **Naming** — renamed variables, groups, roles (e.g. `state/selected/hover` → `state/selected/strong`). Continuity between Figma and code names is a goal of this workflow, not an optional nicety.
4. **Structure** — added/removed collections, families, steps, tokens; regrouped subgroups.

**Canonical Figma file:** `https://www.figma.com/design/DGekOeToRVifvFAhfqpeC1/CodeAI-Design-System--CADS-` → `fileKey: DGekOeToRVifvFAhfqpeC1`. If the user supplies a different file/branch URL, use that instead.

**Sandbox source of truth (CodeAI):** `src/pages/design-system/tokens/codeAiColorSystem.json` — a serialized `ColorSystem` (see `src/pages/design-system/colorSystemData.ts` for the shape: `families[].steps[].hex` primitives; `semantics[]` with per-theme `ref` (primitive step id), `semanticRef` (semantic alias), `fallbackHex`, and `comments`).

**Platform SoT (standalone CADS):** sibling repo `../cads` → `packages/variables/src/data/codeAiColorSystem.json`. After a sandbox sync that should ship to the packaged system, also update that file and run `pnpm generate:variables` (or `pnpm figma:sync`) in `../cads`. Repeatable sync tooling: `../cads/tooling/figma-sync`. Parity UI: `/design-system/cads`.

Read `src/guidelines/color-theming.md` before making changes — it documents the token pipeline, baseline versioning, and known pitfalls.

## Tooling: which Figma MCP to use

### Primary: `figma-console` (southleft/figma-console-mcp)

Configured in `.cursor/mcp.json` (`npx figma-console-mcp@latest`, requires `FIGMA_ACCESS_TOKEN`). This server extracts **all variables in the file, across all collections and modes**, regardless of selection — which is what this workflow needs. Read the tool descriptors under the MCP folder before calling.

Preferred call: **`figma_export_tokens`** with DTCG output (default legacy dialect is fine). It returns:

- every collection with its **full mode list** (Light + Dark values — no mode guessing),
- alias references preserved as DTCG braces (`{...}`) rather than pre-resolved hexes,
- **Figma variable IDs** in `$extensions["figma-console-mcp"]` — the stable identity that makes **rename detection** reliable (same ID + different path = rename, not delete+create).

Fallback read: `figma_get_variables` (use `format` per its schema; summary by default).

Notes:
- REST-token access works for reads on this file. Some tools route through the Desktop Bridge plugin; if a call reports the bridge is not connected, ask the user to open the Figma Desktop Bridge plugin in Figma Desktop (or fall back to REST-path tools).
- If the server is missing or the token env is a placeholder, tell the user what to configure (PAT scopes: File content Read, Variables Read) rather than silently degrading.

### Fallback only: official Figma MCP (`plugin-figma-figma` / `user-Figma Desktop`)

`get_variable_defs` requires a node id and returns a **flat map of resolved values for that node's current mode context** — no per-mode definitions, no alias structure, no variable IDs, and (Desktop variant) depends on the user's selection. Use it only for a quick spot-check of light-mode values, never as the sync source. If forced to use it, state the limitations in the report (dark mode unverified, renames undetectable).

## Persisted Figma snapshot (rename continuity)

Keep the previous Figma export at `src/pages/design-system/tokens/figmaVariablesSnapshot.json` (DTCG output of `figma_export_tokens`, committed alongside the sync). Diffing the new export against this snapshot — matching on Figma variable IDs from `$extensions` — is how renames are distinguished from add+remove even across multiple syncs. Create it on first run if absent.

## Workflow

```
Progress:
- [ ] 1. Export all variables (all modes) from Figma
- [ ] 2. Diff: values, mappings, naming, structure
- [ ] 3. Report differences (renames called out explicitly)
- [ ] 4. Apply value/mapping updates to codeAiColorSystem.json
- [ ] 5. Apply renames end-to-end (sandbox ids/roles + generated CSS consumers)
- [ ] 6. Update exporter if naming/structure rules changed
- [ ] 7. Regenerate + bump baseline version + refresh Figma snapshot
- [ ] 8. Verify and commit
```

### 1. Export from Figma

Call `figma_export_tokens` (server `figma-console`) for the CADS file. Confirm the export covers all color collections (primitives + semantics) and both Light and Dark modes. If a collection is missing, investigate (library vs local variables — see `figma_get_library_variables`) before proceeding.

### 2. Diff against the sandbox baseline

Write a small throwaway Node script (do not eyeball the JSON — it is large) comparing three sources: the new Figma export, the committed `figmaVariablesSnapshot.json`, and `codeAiColorSystem.json`. Check:

- **Primitive hex values** — per step, case-insensitive (`#00000000` in the sandbox means unset).
- **Primitive structure** — added/removed families or steps.
- **Semantic → primitive mappings** — per mode (Light → sandbox `light`, Dark → sandbox `dark`), from the DTCG alias targets. With figma-console data, dark mappings come from Figma — do not infer them from light values.
- **Semantic → semantic aliases** — DTCG brace aliases → sandbox `semanticRef`.
- **Renames** — match old→new by Figma variable ID (`$extensions`) between snapshot and new export. A path change with a stable ID is a rename; flag which sandbox token id/role/family it corresponds to. Without a snapshot (first run), detect likely renames heuristically (same collection + same values across modes + one removed/one added) and confirm with the user.

Name translation between Figma paths and sandbox ids: Figma `brand/purple/50` ↔ step id `<collectionId>::<family>::50`; sandbox family ids are **stable and may differ from display names** (e.g. `brand::teal` displays as "purple"); exported CSS names come from `semanticExportVarName()` in `src/pages/design-system/colorSystemCssExport.ts` (`borders` exports as `border`, `sentiment`/`state` subgroups are flat, `brand` collapses its single family name).

### 3. Report differences

Before editing, summarize for the user: changed hexes (old → new), remapped semantics per mode, **renames (old name → new name, with the affected sandbox ids and `--ds-*` CSS variable names)**, added/removed tokens. If a difference looks like an intentional sandbox-side experiment, call it out instead of silently overwriting.

### 4. Apply value/mapping updates

Edit `src/pages/design-system/tokens/codeAiColorSystem.json` only:

- Update `hex` on primitive steps; add new steps/families following existing id conventions (`${collectionId}::${name}`, step id `${familyId}::${step}`).
- Update `ref`/`semanticRef`/`fallbackHex` **per mode** on semantic tokens — dark values come from the Figma Dark mode, not recomputation. Keep `fallbackHex` in sync with the resolved value.
- **Preserve existing `comments`** — they are codified rationale, not Figma data.
- Do not hand-edit `src/styles/tokens.css` or the exported `colors.css`/`primitiveColors.css` samples.

### 5. Apply renames end-to-end

Renames are not value edits — they propagate. For each confirmed rename:

- **Sandbox JSON**: update the token `role` (drives UI labels and exported names). For **display-name** renames of families/subgroups, update `name` and keep the stable `id`. For **role/path** renames (e.g. `hover` → `strong`), also update the token `id` to the new path so future Figma diffs match cleanly, and update any `semanticTokenOrders` / `semanticFamilyOrders` entries referencing it.
- **Generated CSS consumers**: grep the repo for the old `--ds-*` name (e.g. `--ds-background-selected-hover`) and update all component SCSS/CSS/TS references to the new name. The rename is not done until no references to the old name remain (except historical docs).
- **Docs**: update `src/guidelines/color-theming.md` and `scripts/tokenMigrationMap.md` (rename table) so the old↔new mapping is recorded.

If a rename is high-blast-radius (many component references), report the scope before applying and let the user decide whether to take it in this sync or defer.

### 6. Update the exporter if needed

If Figma introduced new subgroups, families, or naming patterns that the exporter doesn't handle, update `src/pages/design-system/colorSystemCssExport.ts` (naming in `semanticExportVarName`, ordering in `ROLE_RANK`/`GROUP_RANK`/etc.). Mirror any resolution changes in `scripts/colorSystemToCss.mjs` if applicable.

### 7. Regenerate + bump baseline version + refresh snapshot

- Bump `COLOR_SANDBOX_CODEAI_BASELINE_VERSION` in `src/lib/colorSandbox/colorSandboxStorage.ts` (required whenever `codeAiColorSystem.json` changes, so stale localStorage drafts are discarded).
- Run `node scripts/generate-tokens.mjs`, then **diff `src/styles/tokens.css`** to confirm only intended CodeAI `:root` / `.dark` changes.
- Write the new Figma export to `src/pages/design-system/tokens/figmaVariablesSnapshot.json` so the next sync can ID-match renames.
- Keep generator / Figma / exporter naming in sync via `semanticTokenCssName` (do not reintroduce brand-family suffixes or `borders` plural in CSS names).

### 8. Verify and commit

```bash
npm run typecheck && npm run build
```

Then stage only the sync-related files (`codeAiColorSystem.json`, `figmaVariablesSnapshot.json`, `colorSandboxStorage.ts`, `tokens.css`, renamed-token component files, and `colorSystemCssExport.ts` if changed) and commit with a message like:

```
Sync CodeAI color tokens with CADS Figma variables

Update <n> primitive hexes and <m> semantic mappings; rename <k> tokens
(<old> → <new>); bump sandbox baseline version.
```

Update `src/guidelines/color-theming.md` in the same commit if pipeline behavior, naming, or exporter rules changed.
