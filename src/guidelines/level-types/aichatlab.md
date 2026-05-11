# AI Chat Lab

## Purpose

Prototype environment for levels where the lab surface is an AI chat stream. Some levels only practice prompting; others progressively disclose model configuration controls before students publish or test a model card.

## Routes

- `/levels/aichatlab`
- `/levels/aichatlab-setup`
- `/levels/aichatlab-model-card`

## Key Files

- `src/pages/aichatlab/AiChatLabLevelPage.tsx`
- `src/components/ide/aichatlab/views/AiChatLabWorkspace.tsx`
- `src/components/ui/AppSlider.tsx` — shared design-system slider used for temperature/model configuration controls
- `src/components/lab2/resource-panel/views/ai-tutor/AiTutorPanel.tsx` — shared chat stream/composer shell reused for the lab chat surface
- `src/components/lab2/resource-panel/Sidebar.tsx`
- `src/components/lab2/resource-panel/views/InstructionsPanel.tsx`
- `src/pages/levelTypeLinks.ts`

## Current UX Behavior

- The AI chat stream is the lab workspace, not the sidebar Tutor.
- The lab chat stream reuses the shared `AiTutorPanel` / message-list / composer components, with the instructions drawer hidden because instructions live in the sidebar.
- The resource panel uses a standalone Instructions tab and can still show optional Resources, Rubric, Teacher Resources, and Dev tabs.
- AI Tutor is hidden for AI Chat Lab routes because the level itself is the AI conversation.
- The workspace supports either chat-only mode or a two-column lab surface with model customization plus chat.
- Configuration tabs are progressively disclosed:
  - Setup: temperature (`AppSlider`) and optional system prompt.
  - Retrieval: optional retrieval notes.
  - Publish: optional name, intent, description, limitations, and example prompts.
- The resource panel and lab workspace can use floating card chrome through `surfaceVariant: "card"`; card surfaces are intentionally non-resizable.
- Dev panel controls can toggle the config column, visible config tabs, individual controls, resource-panel tabs, instructions content, chat placeholder, and header text.

## Current Data Shape

- No backend model call is wired in this prototype.
- Chat responses are local mock responses that reflect the current model configuration enough to demo how settings affect behavior.
- Page defaults are URL-overridable through the shared dev panel system.

## Known Gaps

- No real LLM provider, retrieval index, publishing backend, or saved model-card persistence.
- The Backpack/resource distinction is still represented through the existing shared Resources tab.
