# AI Lab

## Purpose

Lab2 prototype of AI Lab (tabular data → train → test). This is **not** AI Chat Lab. The student workspace follows the AI Studio / Data Makes AI flow: choose an algorithm, explore a dataset, train a model, then test it. There is no in-lab Back/Next wizard. Dataset / Train / Test live in a workspace tab rail. Lab2 Continue leaves the level.

Source intent: [PR #74600](https://github.com/code-dot-org/code-dot-org/pull/74600) (`ai-studio-prototype`) and the Data Makes AI handoff. Export / model card is out of this P0.

## Routes

| Route | Name | Export | Index section | Default shape |
|---|---|---|---|---|
| `/levels/ailab` | Train a model | `AiLabLevelPage` | Lab environments | Algorithm picker (KNN or Decision Tree), then Dataset / Train / Test on taco-truck orders |
| `/levels/ailab-pretrained` | Audit a model | `AiLabPretrainedLevelPage` | Lab environments | Lands on Test with a finished Decision Tree; Dataset and Train hidden |
| `/levels/ailab-guided` | Train a model (guided) | `AiLabGuidedLevelPage` | Lab environments | Data + Test. Training is a setup row on the dataset. Original routes are unchanged. |

## Key Files

- `src/pages/ailab/AiLabLevelPage.tsx`
- `src/components/ide/ailab/views/AiLabWorkspace.tsx` — original P0 chrome
- `src/components/ide/ailab/views/AiLabGuidedWorkspace.tsx` — guided studio
- `src/hooks/useAiLabState.ts`
- `src/lib/aiLab/` — local KNN and ID3-style tree, holdout scoring, prediction explanations
- `src/data/ailab/` — taco-truck datasets and section instructions
- `src/types/aiLab.ts`

## CADS consumption

Workspace chrome uses packaged CADS via `Lab2Shell` → `CadsLabProvider`: `Button`, `Tabs`, `Radio`, `Dropdown`, `TextInput`, `Tag`, `Dialog`, `SegmentedButton`, `Tooltip`. Local SCSS uses unprefixed Foundations (`--background-*`, `--text-*`, `--shape-*`).

The workspace is full-bleed Lab2 chrome (header + tab rail + edge-to-edge panels), not the inset floating cards used by AI Chat Lab.

Visualizations use visx (d3-based) rather than a graph editor. That matches the [decision-tree POC](https://github.com/code-dot-org/code-dot-org/pull/75114): a left-to-right readable tree (matching branches continue across; others step down) instead of a node-canvas. Production trains with `ml-cart`; this prototype still uses a local multi-way ID3-style trainer so categorical splits stay labeled as values (`salsa is hot`) instead of ordinal thresholds (`salsa < 0.5`).

- Decision Tree: `@visx/hierarchy` + `@visx/shape` (`LinkHorizontalStep`), with a step-through path trace
- KNN: `@visx/scale` + `@visx/axis` + `@visx/glyph` scatter of training points, query point, and nearest-neighbor lines

## Current UX Behavior

- Resource panel: Instructions (swap by section), Continue, Dev. AI Tutor, Version History, and Backpack are off.
- No in-lab Previous/Next. Named actions only (`Train model`, `Open Test`, `Predict` on the original; guided Test is live).
- Dataset is exploration only in the original (table / cards + column inspector). Guided Cards split into Catalog and Carousel. Guided training is a show/hide setup row on **Data**, not a Train tab. Test stays its own tab.
- Original Train: a separate tab; click a column, then use inspector actions. Guided setup row: label dropdown, feature checkboxes, optional k, and Train.
- Test shows reserved-row accuracy, click-a-row to fill Try it out, and an algorithm-specific visualization.
- Guided chrome after algorithm pick: 40px panel header. Medium secondary tabs sit on the left, flush with the header bottom edge. Algorithm switch and Start over are grouped on the right. Start over confirms and clears training. Curriculum-locked algorithm disables the algorithm chip. Guided opens the algorithm cards in a modal to switch without a full reset.
- Dev panel: lock algorithm, hide Dataset, hide Train. Changing those flags remounts the session.

## Current Data Shape

- Seeded datasets: `tacoTruckDataset` (original) and `tacoTruckGuidedDataset` (weekday distractor, 25 rows, 5 reserved).
- `AiLabLevelConfig` mirrors production `mode` knobs used by Data Makes AI: algorithm lock, hide Dataset/Train, hide label select, optional pretrained model. Guided adds `classificationOnly`, `defaultKnnK`, and `holdoutCount`.
- Training and prediction run locally in the browser. Nothing is saved to App Lab.

## Known Gaps

- No CSV upload, multi-dataset picker, or historic-result comparison of two saved models
- No A.I. bot train/test animation (guided only shows a short Training… pause)
- No Export / model card / `getPrediction` block preview
- Tree trainer is a small canned-depth ID3 stand-in, not production `ml-cart` (depth sweep, regression). Guided tree nodes show sample count and impurity drop; they are not the full PM contribution tooltips
- KNN distance is not feature-scaled; guided Test calls that out instead of hiding it
