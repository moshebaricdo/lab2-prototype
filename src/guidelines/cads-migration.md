# CADS migration findings (Lab2 sandbox)

Handoff notes for migrating the rest of this prototype from local `App*` / `--ds-*` to packaged CADS (`@moshebaricdo/cads-react` + `@moshebaricdo/cads-variables` from GitHub Packages).

Related: `.cursor/skills/cads-prototyping/SKILL.md`, `color-theming.md`, `/design-system/cads`. CADS source lives in `moshebaricdo/cads`; this repo consumes published packages, not a sibling checkout.

---

## Current status (2026-08)

| Surface | Components | Foundations tokens (SCSS) |
|---|---|---|
| `Lab2Shell` → `CadsLabProvider` | Theme bootstrap for all Lab2 routes; flow-complete uses CADS `Dialog` | Loads `variables.css` + icon fonts; `baseline={false}` |
| Header (`TopNavigation` / `GlobalNavMenu` / `LevelProgressBubbles`) | CADS `Button` / `Dropdown` / `Tooltip` / `FaIcon` — extraSmall outlined/text on-brand; progress indicator matches CADS Global Header **labLevel** (always light); header chrome always dark | Unprefixed Foundations (white-on-brand via `--btn-*` overrides; header `dark` / `data-theme="Dark"`, progress pill `data-theme="Light"`) |
| AI Chat Lab workspace | CADS primitives + `AiChatMessage` / `AiChatInput` | Unprefixed Foundations |
| Resource panel (shared) | CADS `Button` / `TextInput` / `Dropdown` / `Tooltip` / `Alert` / `Toast` (backpack save/delete + undo) / `Dialog` (backpack delete confirm) / `Checkbox` / `AiChatMessage` + `AiChatInput` + `AiChatFileChip` (Tutor) / `Tag` (rubric status, backpack Added) | Unprefixed Foundations |
| `PanelHeader` | Still local layout; labels use Foundations via mixin | Unprefixed Foundations |
| Shared overlays (`Dialog` / `AlertBanner` / `FileChip`) | CADS `CloseIconButton` / `Button` / `Tooltip` / `Link` | Unprefixed Foundations |
| IDE shared chrome (`FileManager`, `CreateFileModal`, `EmptyState`, `VersionBanner`, code-editor chrome) | CADS `Modal` / `Button` / `Dropdown` / `Tooltip` / `TextInput` / `Alert` (`CreateFileModal` and `NameInputModal` wrap `CadsLabProvider` so page-level overlays outside `Lab2Shell` still theme) | Unprefixed Foundations (`--ds-syntax-*` kept in CodeMirror highlight style) |
| Web Lab 2 workspace + agentic chrome | CADS `Button` / `Dropdown` / `Tooltip` / `SegmentedButton` / `Alert` / `Modal` | Unprefixed Foundations |
| Python Lab / Sketch Lab workspaces | CADS `Button` / `Dropdown` / `Tooltip` / `Slider` / `TextInput` | Unprefixed Foundations |
| Assessment workspaces + builder | CADS `Button` / `TextInput` / `Checkbox` / `Radio` / `Dropdown` / `SegmentedButton` / `Tooltip` / `Tag` | Unprefixed Foundations |
| Lab2 dev panel + `/levels` index | CADS `Button` / `Dropdown` / `TextInput` / `Slider` / `Tooltip` | Unprefixed Foundations (`LevelsIndexPage` wraps `CadsLabProvider`) |
| Local `ui/` atoms (`AppButton`, etc.) | Freeze for new UI; do not extend. Remaining call sites: color sandbox, teacher dashboard | `--ds-*` |

Parity sandbox: `/design-system/cads`. Spike consumer: `/levels/aichatlab*`.

---

## Architecture rules

1. **Do not vendor CADS into this repo.** Import `@moshebaricdo/cads-react` and `@moshebaricdo/cads-variables` from GitHub Packages (`^0.1.2`). CI and fresh clones use `.npmrc` + `NODE_AUTH_TOKEN` (see below). Do not commit a `file:../cads` rewrite.
2. **One provider:** `src/components/lab2/CadsLabProvider.tsx` wraps `Lab2Shell` (`CadsProvider baseline={false}`). Nested providers are unnecessary for Lab2 routes.
3. **Consumers import CADS, never raw MUI** (`Button` from `@moshebaricdo/cads-react`).
4. **New UI on migrated surfaces** uses CADS + Foundations names. Do not add new `--ds-*` or `App*` usage there.
5. **Migrate by surface**, not big-bang. Prefer: header → IDE shared chrome → per-lab workspace → assessment.

---

## Prop mapping (`App*` → CADS)

### Button

| Legacy (`AppButton`) | CADS (`Button`) |
|---|---|
| `variant="primary"` | `variant="contained" color="primary"` |
| `variant="secondary"` | `variant="outlined" color="secondary"` |
| `variant="tertiary"` + icon-only | `variant="text" color="tertiary" iconOnly` |
| `variant="tertiary"` + label | `variant="text" color="secondary"` |
| Python Lab **Run** | `variant="contained" color="orange"` (contained-only; CADS falls back to primary for other variants) |
| `tone` | Drop; use `color` |
| size `l` / `m` / `s` / `xs` | `large` / `medium` / `small` / `extraSmall` |
| `iconName` | `startIconName` (or `endIconName` if `iconPosition="end"`) |
| icon, no children | set `iconOnly` |

Panel-header icon buttons: always `variant="text" color="tertiary" size="extraSmall" iconOnly`.

### Other primitives

| Legacy | CADS |
|---|---|
| `Tooltip` `content` / `position` | `title` / `placement` (wrap disabled triggers in `<span>`) |
| `AlertBanner` | `Alert` (`dismissible`→`isDismissible`, `onDismiss`→`onClose`; `danger`→`error`) |
| `AppNativeSelect` | `Dropdown role="input"` (`onValueChange`→`onChange`, `width="full"`; set `menuWidth="trigger"` when the menu should match the field) |
| `AppActionDropdown` + custom trigger | `Dropdown role="action"`; for kebab menus use `iconOnly` + `startIconName="ellipsis-vertical"` + `buttonVariant="text"` + `buttonColor="tertiary"` + `aria-label` |
| `AppTextField` / `AppTextArea` | `TextInput` (+ `multiline` / `rows`) |
| Custom Tutor composer (`TextInput` + send) | `AiChatInput` (`leftActions` / `onAddFile`; Web Lab + Python Lab share `AiTutorComposer`). Composer file chips are a sibling `AiChatFileChip` row **above** the field, not the in-field `attachments` slot. |
| Custom Tutor bubbles + `ActionRow` | `AiChatMessage` (`context="Tutor"`). File-change lists, questionnaires, edit-options, validation, action, and hand-off cards go in `customContent`. |
| `AppTag` | `Tag` (`label`, `color`, `size` `large`/`medium`/`small`, `startIconName`, `isDismissible`/`onClose`) |
| `AppCheckbox` | `Checkbox` |
| `AppSlider` | `Slider` |

`Alert` has no `duration` — keep auto-dismiss with a local `useEffect` timeout if needed.

`AiChatInput` refs the wrapper; native `<textarea>` may need `querySelector("textarea")` for focus/autosize (see Tutor composer). CADS send enables on non-empty text; Tutor still allows send with attachments only. Pass `customContent` (not extra children) for in-bubble Tutor cards so the CADS action row stays under the bubble.

---

## Foundations token mapping (SCSS)

On CADS-backed surfaces, use **unprefixed** vars from `@moshebaricdo/cads-variables` (already loaded by `CadsLabProvider`).

| Local / legacy | CADS Foundations |
|---|---|
| `--ds-background-*` / `--ds-text-*` / `--ds-border-*` | Same path without `ds-` |
| `--radius-sm` / `--radius` | `--shape-sm` |
| `--radius-round` | `--shape-round` |
| `--font-body` | `--font-family-main` |
| `--font-weight-semibold` | `--font-weight-semi-bold` |
| `--font-weight-normal` | `--font-weight-regular` |
| `--font-mono` | `--font-family-mono` |

Watch `var(--ds-foo, fallback)` — naive replace misses comma fallbacks.

Dark mode: CADS keys off `.dark` (or `[data-theme='Dark']`) on an **ancestor**. `useTheme` toggles `.dark` on `document.documentElement` so **portaled** Dropdown/Tooltip menus (Popper → `body`) theme correctly. In-tree chrome also gets `.dark` from `Lab2Shell` theme scope.

---

## Pitfalls (read before migrating)

1. **Vite must not prebundle CADS** — Published `@moshebaricdo/cads-react` injects styles via `import './button.css'` from `dist`. Vite’s esbuild optimizer drops those imports, so buttons/inputs look like unstyled MUI. `vite.config.ts` **excludes** `@moshebaricdo/cads-*` from `optimizeDeps`, and **includes** CJS transitives (`prop-types`, `react-is`, …) plus the `@mui/material/*` subpaths CADS deep-imports — otherwise MUI ESM does `import PropTypes from 'prop-types'` against raw CJS and the app blanks (`does not provide an export named 'default'`). Linked `file:../cads` skipped prebundling automatically; GitHub Packages does not. After changing that config, `rm -rf node_modules/.vite` and restart Vite.
2. **Local `file:` iteration (do not commit)** — To test unpublished CADS changes: `npm install ../cads/packages/react ../cads/packages/variables`. After rebuilding CADS, clear `node_modules/.vite` and restart Vite. Stale CSS-module hashes make components look “unstyled” / full-width / broken (seen with `AiChatMessage`). Revert to `^0.1.2` before committing.
3. **Font files outside allow list** — Local `file:` / symlinked CADS icon fonts may warn under Vite `server.fs.allow`; extend allow list if icons 404 in dev. Published packages do not need this.
4. **`Button` `fullWidth`** — Fixed upstream in CADS (`--btn-width: 100%`). If Continue/Finish hugs again, confirm you’re on a rebuilt `@moshebaricdo/cads-react`.
5. **Action `Dropdown` `iconOnly`** — Added upstream for kebab overflow. Needs rebuilt CADS; pass `aria-label` + `startIconName`.
6. **Checklist `Dropdown` `menuWidth`** — CADS forces checklist menus to hug content, so `menuWidth="trigger"` is ignored. Assessment builder Course (and similar full-width checklists) sync the portaled menu to the trigger on open until CADS respects the prop.
7. **Slider track lag** — MUI track `left`/`width` transitions can lag the thumb; AI Chat Lab kills them in workspace SCSS. Prefer upstreaming into CADS Slider later.
8. **Do not invent props** — Check `cadsManifest` / docs `/llms.txt`. Tag uses `color` not `tone`; etc.
9. **Selected vs brand** — Never paint selected chrome with brand fills (see `color-theming.md`).
10. **AiChatMessage hug** — Width/hug lives in CADS. Local `.chatMessageList` should not force stretch in a way that fights `align-self` / `fit-content`.
11. **Header white-on-brand** — CADS Button has no white tone. On the purple header, override `--btn-bg` / `--btn-fg` / `--btn-border` / `--btn-bg-hover` with `!important` so they beat the inline chrome vars.
12. **Package name** — Consumer imports are `@moshebaricdo/cads-*` (not `@codeai`). Icons: `@moshebaricdo/cads-react/icons`. CSS: `@moshebaricdo/cads-variables/variables.css`.

---

## Suggested next migrations

Lab2 learner/teacher chrome is on CADS. Remaining:

1. **Retire or thin `App*`** once sandbox/dashboard call sites are gone. Keep color sandbox / token generator on `--ds-*` until Foundations fully replace them app-wide.
2. **Teacher dashboard** — still `App*` / `--ds-*`.
3. **Custom menus CADS Dropdown cannot host** — Sketch property swatch grids / in-menu sliders, agent identity color dots / “Added” badges (still use `AppDropdown.module.scss` for layout).
4. **CodeMirror syntax** stays on `--ds-syntax-*` until CADS owns syntax.

For each surface:

1. Swap primitives using the mapping table.
2. Rewrite colocated SCSS `--ds-*` → Foundations (including fallback forms).
3. Smoke light + dark (especially portaled menus).
4. `npm run typecheck` && `npm run build`.
5. Update the level-type doc + this status table.

---

## Upstream CADS changes made during the spike

These landed in CADS `0.1.0` (rebuild a local checkout only when iterating unpublished changes):

- `Button` `fullWidth` respects module CSS width token
- `Dropdown` `role="action"` supports `iconOnly` (no label/chevron)
- `AiChatMessage` hug / max-width / human alignment (consumer-owned follow-up if still wrong after cache clear)

Optional follow-ups for CADS: Slider track transition kill; accept `[data-theme='dark']` lowercase (Lab2 uses lowercase `data-theme` in places — html `.dark` is the current bridge).

---

## Install (GitHub Packages)

Packages: [`cads-react`](https://github.com/moshebaricdo/cads/pkgs/npm/cads-react) and [`cads-variables`](https://github.com/moshebaricdo/cads/pkgs/npm/cads-variables). Repo-root `.npmrc` scopes `@moshebaricdo` to `https://npm.pkg.github.com` and reads `NODE_AUTH_TOKEN` (never commit a real token).

**Local:** `export NODE_AUTH_TOKEN=ghp_...` (classic PAT with `read:packages`), then `npm ci`.

**CI (GitHub Pages):** repo secret `NODE_AUTH_TOKEN` is passed into `npm ci` in `.github/workflows/deploy-pages.yml`. Until that secret exists, Pages install will 401.

**Local CADS iteration (temporary, do not commit):**

```bash
npm install ../cads/packages/react ../cads/packages/variables
```

Restore `^0.1.2` in `package.json` / `package-lock.json` before committing.

---

## Verification checklist

```bash
# Fresh clone / CI (GitHub Packages):
export NODE_AUTH_TOKEN=ghp_...   # read:packages
npm ci
npm run typecheck
npm run build

# After editing a local ../cads checkout (do not commit the file: rewrite):
pnpm --dir ../cads --filter @moshebaricdo/cads-react build
rm -rf node_modules/.vite
npm run dev
```

Manual: light/dark via header Username menu; open a `Dropdown` menu in dark mode; AI Chat Lab tabs/slider/chat; resource panel Backpack filters + item kebab; Continue/Finish full width.
