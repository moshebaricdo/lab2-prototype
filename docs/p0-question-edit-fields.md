# P0 Question Edit State — Fields & Input Components

Field inventory for mocking the **edit state** of the three P0 question types: Multiple Choice, Free Response, and Matching. Scoped to what an author touches in the editor.

- System-owned columns from the data model (`id`, `question_key`, `parent_id`) never appear in the UI. `type` is chosen once at creation and then fixed. `question_name` maps to **Internal name**; the `question` jsonb is everything under Content; `explanation` is the shared Explanation field.
- **Not in P0:** point value, difficulty, fill-in-the-blank, drag & drop (parsons / categorization), and a standalone code context panel (code goes inline in the stem for P0; see note below).
- Schema source of truth: `src/types/assessmentBuilder.ts` (`MultiChoiceQuestionContent`, `FreeResponseQuestionContent`, `MatchQuestionContent`). Model rationale: `docs/question-types-and-fields.md`.
- Component names below refer to the UI kit in `src/components/ui/`.

---

## Shared fields (all three types)

### Catalog — required to bank, optional for one-offs

| Field | Notes | Input component |
|-------|-------|-----------------|
| **Internal name** | Author-facing title for finding the question in the bank; never shown to learners. | `AppTextField` (single line) |
| **Standards tags** | One or more standards/concepts. The only author-assigned catalog tag in P0 — course/unit come from quiz placement, not the editor. | Tag multi-select: searchable `AppDropdown` (or popover picker) that emits removable `AppTag` chips |

### Content

| Field | Notes | Input component |
|-------|-------|-----------------|
| **Stem / prompt** | The student-facing question. Required. In P0 any code the question refers to is a snippet the author adds manually as part of the stem — there is no separate code-attachment field. | `textarea` (auto-growing), or rich-text editor if formatting is in scope for the mock |
| **Body / description** | Optional supplemental content — formatted text, code, image. | Collapsed-by-default "Add description" `AppButton` revealing a rich-text/`textarea` block |
| **Explanation** | Optional "why this is correct" prose. Distinct from the answer key. | Collapsed-by-default section with a `textarea` |

> **Code context — deferred.** A separate panel content model (read-only code/context pinnable to multiple questions or directly to a section) is under discussion but is **not P0**. For P0, code lives inline in the stem as a manually authored snippet.

---

## Multiple Choice

| Field | Notes | Input component |
|-------|-------|-----------------|
| **Selection mode** | Single (radio) vs. multiple (checkbox). Explicit, but smart-defaulted: starts single; auto-switches to multiple when a second correct answer is marked; never auto-switches back down. | `SegmentedControl` (Single / Multiple) |
| **Options** | 2+ options; text or rich content (code / image). Add, remove, reorder. | Repeating row list: `AppTextField` per option, drag handle, remove `AppIconButton`, trailing "Add option" `AppButton` |
| **Answer key** | Marked inline on the options themselves — no standalone field. Single: one correct option. Multiple: the set of correct options. | Leading control per option row: `AppRadio` in single mode, `AppCheckbox` in multiple mode |

Secondary / optional for the mock: survey mode (keyless, never scored — `AppCheckbox` toggle), required/max selection counts for multi-select (`AppTextField` number inputs), list-vs-grid option layout (`SegmentedControl`).

## Free Response

| Field | Notes | Input component |
|-------|-------|-----------------|
| **Placeholder** | Hint text shown in the empty response box. | `AppTextField` |
| **Minimum length** | Character floor for a substantive answer. | `AppTextField` (number) or stepper |
| **Sample answer (exemplar)** | The open-ended stand-in for an answer key. | `textarea` |
| **Rubric / expected elements** | Optional grading support. Keep visually separate from the exemplar and the explanation — these three get conflated. | Repeating list of `AppTextField` criteria rows with "Add criterion" `AppButton` (or a single `textarea` for the simplest mock) |
| **Allow file upload** | Lets an attached file count as a submission. | `AppCheckbox` toggle |

## Matching (P0: definition → term only)

| Field | Notes | Input component |
|-------|-------|-----------------|
| **Terms** | The match targets. Add, remove, reorder. | Repeating row list: `AppTextField` + drag handle + remove `AppIconButton`, "Add term" `AppButton` |
| **Definitions** | Each definition is authored with a pointer to its correct term — the answer key *is* this pairing, so there is no separate key field. | Repeating rows pairing a `textarea`/`AppTextField` (definition) with an `AppDropdown` of existing terms (correct match) |

No parsons or categorization fields — those belong to Drag & Drop, which is out of P0.

---

## Answer-key modeling note

In Multiple Choice and Matching the answer key lives **on** the options/pairings (inline radio/checkbox marks, term dropdowns) rather than as a standalone field. Free Response is the odd one out: its "answer" (the exemplar) is its own editable text block. Mock layouts should reflect that difference rather than inventing a separate "correct answer" section for the deterministic types.
