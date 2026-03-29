# Teacher Answer Key Pattern

## Goal

Define a shared teacher-facing answer pattern for assessment levels: clear labeling, optional expand/reveal behavior, and type-specific body content.

## Current Prototype (this repo)

The standalone **`TeacherAnswerKeyCard`** component is **not** used in the app anymore. Teacher-facing answers are shown **inline** in the assessment card when the user invokes **Reveal answer** / **Hide answer** from the **bottom row** (same general interaction as multi-choice):

- **Multi-choice:** Reveal highlights correct option(s) in the student option list.
- **Free response** (when `revealAnswerEnabled` is true): Reveal shows an inline block with exemplar text and rubric or expected-elements bullets above the footer row.

For free-response levels **without** `revealAnswerEnabled`, there is no teacher answer UI in the student workspace.

---

## Historical / Reference: Expandable Card Wrapper

The following described a reusable **card below the workspace** pattern. It remains useful as a reference if a separate collapsible teacher panel is reintroduced elsewhere.

### Shared Wrapper Idea

- Render below the student-facing question workspace (when using a card pattern).
- Collapsed by default.
- Expand/collapse toggle in the header.
- Persist expanded state per level in local UI state during session.
- Include clear teacher-only labeling in the header.

### Suggested Header Structure (card pattern)

- Label: `Teacher Answer Key`
- Optional secondary text: `Visible to teachers only`
- Right-side toggle button:
  - collapsed: `Show answer`
  - expanded: `Hide answer`

### Refreshed Visual Direction

- Tokenized surface/card style.
- Contrast between header and content.
- Subtle border + radius + shadow to separate from student UI.

### Accessibility and Interaction

- Toggle must be a semantic `button`.
- Support keyboard activation (`Enter`/`Space`).
- Expose `aria-expanded` and `aria-controls`.
- Ensure visible focus ring with design tokens.

### Content Slot Contract

The wrapper should only own frame behavior and styling. The body content should be supplied by level-specific presenters.

### Level-Type Content Expectations

- **Multi-choice:** Correct option text (student-facing uses A/B/C letters from order).
- **Match:** Prompt-to-term mapping list.
- **Free response:** Exemplar response and/or rubric bullets (in this prototype, inlined when reveal is enabled—not a separate card).
- **Levelgroup:** Per-section answer keys grouped by section title.
- **Bubble choice:** Optional recommended path rationale when used as formative branching.
- **Web Lab 2:** Not applicable unless paired with an assessment prompt.
