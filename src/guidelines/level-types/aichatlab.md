# AI Chat Lab

## Purpose

Prototype environment for levels where the lab surface is an AI chat stream. Some levels only practice prompting; others progressively disclose model configuration controls before students publish or test a model card.

## Routes

| Route | Name | Export | Index section | Default shape |
|---|---|---|---|---|
| `/levels/aichatlab` | Chat Only Level | `AiChatLabLevelPage` | Level Types (core config) | Chat-only surface with the resource panel and no config column |
| `/levels/aichatlab-setup` | Setup Only Level | `AiChatLabSetupLevelPage` | Level Types (core config) | Resource panel, setup tab, model selector, and compact temperature tuning |
| `/levels/aichatlab-model-card` | Full Model Config Level | `AiChatLabModelCardLevelPage` | Level Types (core config) | Full setup, retrieval, publish, rubric, and published model-card flow |

## Key Files

- `src/pages/aichatlab/AiChatLabLevelPage.tsx`
- `src/pages/aichatlab/aiChatLabPageConfig.ts` — default content, sample rubric, and AI Chat Lab dev-panel fields
- `src/components/lab2/CadsLabProvider.tsx` — Lab2-scoped `@moshebaricdo/cads-*` provider + variables/fonts (`Lab2Shell`)
- `src/components/ide/aichatlab/views/AiChatLabWorkspace.tsx`
- `src/components/ide/aichatlab/views/AiChatLabConfigPanel.tsx`
- `src/components/ide/aichatlab/views/AiChatLabModelCardPanel.tsx`
- `src/components/ide/aichatlab/views/AiChatLabChatPanel.tsx` — CADS `AiChatMessage` / `AiChatInput` stream (no longer `AiTutorPanel`)
- `src/components/ide/aichatlab/views/aiChatLabModel.ts` — model options, config initialization, and mock response helpers
- `src/components/ide/aichatlab/views/AiChatLabWorkspace.types.ts`
- `src/components/lab2/resource-panel/Sidebar.tsx`
- `src/components/lab2/resource-panel/views/InstructionsPanel.tsx`
- `src/pages/levelTypeLinks.ts`

## CADS consumption

AI Chat Lab workspace columns (config, model card, chat) and the shared resource panel both consume packaged CADS (`@moshebaricdo/cads-*` from GitHub Packages) via `Lab2Shell` → `CadsLabProvider`. Local SCSS for those surfaces uses **CADS Foundations** variable names (unprefixed `--background-*` / `--text-*` / `--shape-*`, etc.), not prototype `--ds-*`.

- Bootstrap: `components/lab2/CadsLabProvider.tsx` → `CadsProvider baseline={false}` + `@moshebaricdo/cads-variables/variables.css` + icon fonts.
- Workspace primitives: `Button`, `TextInput`, `Dropdown`, `Slider`, `Tabs`, `Tooltip`, `Alert`, `FaIcon`, plus AI `AiChatMessage` / `AiChatInput`.
- Layout chrome (`PanelHeader`, panel frames, SCSS modules) stays local but tokens match Foundations.

## Current UX Behavior

- The AI chat stream is the lab workspace, not the sidebar Tutor.
- The lab chat stream uses CADS `AiChatMessage` + `AiChatInput` with a local mock reply path (no shared `AiTutorPanel`).
- The resource panel uses a standalone Instructions tab and can still show optional Resources, Rubric, Teacher Resources, and Dev tabs.
- AI Tutor is hidden for AI Chat Lab routes because the level itself is the AI conversation.
- The workspace supports either chat-only mode or a two-column lab surface with model customization plus chat.
- Configuration tabs are progressively disclosed:
  - Setup: optional model selector, compact temperature (CADS `Slider` size `small` with ± controls), and optional system prompt.
  - Retrieval: optional retrieval notes, with an added-items list for saved retrieval entries.
  - Publish: optional name, description, intended use, limitations and warnings, testing and evaluation, and example prompts/topics, with added cards for saved example prompts.
- Setup and Retrieval tabs use an Update footer action. Publish uses Save and Publish actions, shows a success toast after publish, and can switch into the published model-card view.
- Published/share mode hides the sidebar and config tabs, then renders a model-card column beside the reusable AI chat stream. It shows the chatbot name above collapsed sections that mirror the published model card: Description, Intended Use, Limitations and Warnings, Testing and Evaluation, Example Prompts and Topics, and Technical Info derived from config settings. The model-card header can toggle back to config view.
- The resource panel and lab workspace can use floating card chrome through `surfaceVariant: "card"`; card surfaces are non-resizable but the resource panel can collapse to a narrow card rail.
- Dev panel controls cover the visible prototype controls: config column, visible config tabs, individual controls, resource-panel tabs, model selector, instructions content, chat placeholder, header text, and Continue button placement.

## Current Data Shape

- No backend model call is wired in this prototype.
- Chat responses are local mock responses that reflect the current model configuration enough to demo how settings affect behavior.
- Page defaults are centralized in `aiChatLabPageConfig.ts`; visible prototype controls are exposed through the dev panel and defaults remain URL-overridable through the shared override system.

## Known Gaps

- No real LLM provider, retrieval index, publishing backend, or saved model-card persistence.
- The Backpack tab uses the production type-availability panel with an **aichatlab** allow-list that permits all file types for now. **+** (tooltip: "Add to chat") still dispatches `weblab:add-backpack-item-to-chat`, but the CADS chat composer spike does not yet listen for that event (attachments are a follow-up).
