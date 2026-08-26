# Assessment Builder — Question Field & Metadata Schema

Holistic definition of **what fields every question type needs**, **what the bank requires**, and the resolved decisions on the tricky in-betweens (points, reveal, survey, one-offs). This is the source-of-truth artifact for the field groups; build the inline editors (`QuestionItemEditor`) against this, not the other way around.

Companion docs: [assessment-builder.md](./assessment-builder.md) (product model + UX), per-type renderer docs (`multi-choice.md`, `free-response.md`, `match.md`, `drag-drop.md`, `fill-in-blank.md`), [assessment-builder-levelbuilder-contract.md](./assessment-builder-levelbuilder-contract.md).

---

## 1. The mental model: three layers, not two

The instinct is "bank metadata vs. type fields." But the `points` question only resolves cleanly once you see **three** layers. Every field belongs to exactly one:

| Layer | What it answers | Lives on | Travels with the question when reused? |
|-------|-----------------|----------|----------------------------------------|
| **A — Catalog metadata** | *What is this question, for cataloging & reuse?* (title, course, unit, concepts) | `QuestionItem` (bank record) | Yes — shared across every assessment |
| **B — Content** | *What does the learner see and how is it answered?* (stem, type-specific fields, answer key, explanation text) | `QuestionItem.item` + shared content fields | Yes — intrinsic to the question |
| **C — Placement config** | *How does this question behave **in this assessment**?* (point weight, order, reveal visibility) | `AssessmentArtifact` / `AssessmentQuestionRef` | No — re-decided per assessment |

The `points` ambiguity is the A/B-vs-C boundary showing through: a question has an *inherent* suggested weight (Layer A/B), but its *effective* weight is a property of the assessment it's placed in (Layer C). See [§6](#6-decisions-on-the-tricky-in-betweens).

### The reuse spectrum (banked ↔ one-off)

"Banked" vs. "one-off" is **not a separate type** — it's whether a question carries complete Layer-A metadata and a stable `bankId`:

- **Banked** — full catalog metadata; lives in the per-course bank; referenced live (`{ type: "bank", bankId }`) so edits propagate. The default we lean into.
- **One-off** — assessment-scoped (`{ type: "inline", item }`); Layer-A metadata is **optional**. For survey questions, Hour-of-Code checkpoints, throwaway practice. Can be promoted to the bank later ("Save to question bank").

> Banking is orthogonal to grading. A one-off Hour-of-Code checkpoint still has a correct answer (Layer B); it just skips catalog metadata (Layer A).

---

## 2. Layer A — Catalog metadata (`QuestionItem`)

Identity and reuse fields. **Optional at the type level**, but **required to save to the bank** (validation gate, not a type constraint — see [§7](#7-validation-gates)). One-offs may leave these empty.

| Field | Type | Required to bank? | Notes |
|-------|------|-------------------|-------|
| `bankId` | `string` | always | Stable id. One-offs get an ephemeral `q-oneoff-…` id until promoted. |
| `title` | `string` | ✅ | **Internal** bank listing name. Never shown to students — that's the stem (`prompt`). |
| `courseId` | `string` | ✅ | Scopes the question to a course bank. Units and concepts are drawn from this course's taxonomy. |
| `unitId` | `string` | ✅ in P0 | Curriculum unit within the course (`AssessmentCourseBank.units`). |
| `tags` (concepts) | `DomainTag[]` | ✅ (≥1) | Concept / domain / standard tagging. Per-course catalog (`AssessmentCourseBank.domains`). Optional `code` is the compact standard id shown on P0 bank chips. P0 bank panel labels these **Standards**; the inline editor still says **Concepts**. Drives pool-draw rules + score rollup. |
| `difficulty` | `beginner \| intermediate \| advanced` | **dropped in P0** | Legacy bank filter only. Not authored or required on the P0 builder. |
| `points` | `number` | optional | **Bank default weight** (defaults to 1). Overridable per assessment — see [§6.1](#61-points-bank-default--per-assessment-override). |
| `updatedAt` | `number` | always | Last edit; used for "live ref" propagation + draft diffing. |

> **Not yet modeled, likely needed for a real bank** (flagged, not built): `status` (draft/published/archived), `author`/`owner`, `version`/revision history, `usageCount` (how many assessments reference it), `language`/locale. Add when the bank graduates past prototype.

---

## 3. Layer B — Shared content fields (all types)

Every `QuestionItemContent` variant shares these. They are intrinsic to the question and travel with it.

| Field | Type | Required? | Notes |
|-------|------|-----------|-------|
| `prompt` (stem.question) | `string` | one of prompt/description | Plain-text heading. Best for single-sentence questions. **This is the student-facing question**, distinct from the internal `title`. |
| `description` (stem.body) | `string` (markdown) | one of prompt/description | Rich body — code blocks, images, lists, supplemental context. May be used **alone** (whole question lives in markdown) or **alongside** `prompt` (renders as a supplemental block below the heading). |
| `reveal.explanation` | `string` | optional | **Bank-level** "why this is correct" text. Travels with the question. *Whether it is shown* is an assessment policy — see [§6.2](#62-reveal-explanation-is-bank-level-visibility-is-assessment-wide). |
| `codePanel` | `CodePanelConfig` | optional | Read-only code context attached to **any** type (code interpretation). `files[]` + `stemPosition` (`above`/`inline`) + `defaultWidthRatio`. Not a sibling question type. |

**Authoring rule:** at least one of `prompt` / `description` must be non-empty.

### The answer model — three distinct concepts

Most "reveal" confusion comes from one word doing several jobs. Keep these separate:

1. **Answer key** — the *correct response data*, type-specific (Layer B content below). Deterministic for `multi` / `match` / `dragDrop` / `fillInBlank`; **open-ended** for `freeResponse`, where the `teacherAnswer.exemplar` is the stand-in for "the answer."
2. **Explanation** (`reveal.explanation`) — optional prose for *why* the answer is correct. Universal, type-agnostic. **Not** the answer.
3. **Grading support** (`freeResponse` only) — `teacherAnswer.rubricCriteria` / `expectedElements`. Helps a human/AI score an open response. Distinct from both the exemplar and the explanation.

> The legacy `revealAnswerEnabled` flag (on `freeResponse` / `fillInBlank`) conflates "show the key" with "show the explanation." Treat it as **answer-key visibility only**; the universal explanation is `reveal.explanation`. Reveal *timing* is assessment-wide ([§6.2](#62-reveal-explanation-is-bank-level-visibility-is-assessment-wide)).

---

## 4. Layer B — Per-type content field matrix

Each type's answer-key and presentation fields. ⭐ = required for a graded (non-survey) question. ▫️ = optional/presentation.

### 4.1 Multiple Choice (`multi`)

| Field | Type | | Notes |
|-------|------|---|-------|
| `answers[]` | `{ id, text? , contentBlocks? }` | ⭐ | Each option is plain `text` **or** rich `contentBlocks` (`text` / `code{code,language}` / `image{src,alt,caption}`). |
| `selectionMode` | `single \| multiple` | ▫️ | Defaults `single`. |
| `correctAnswerId` | `string` | ⭐ (single) | The graded key for single-select. |
| `correctAnswerIds` | `string[]` | ⭐ (multiple) | The graded key for multi-select. |
| `requiredSelectionCount` | `number` | ▫️ | Multi-select: submit gated until exactly N chosen. |
| `maxSelectionCount` | `number` | ▫️ | Multi-select cap; omit for "select all that apply." |
| `optionLayout` | `{ type: list\|grid, columns?: 2\|3\|4 }` | ▫️ | `list` (default) for long text; `grid` for short/code/image options. |
| `surveyMode` | `boolean` | ▫️ | No graded key; submit always succeeds. See [§6.3](#63-survey-ungraded-is-an-assessment-property-no-key-is-a-question-property). |

### 4.2 Free Response (`freeResponse`)

| Field | Type | | Notes |
|-------|------|---|-------|
| `placeholder` | `string` | ⭐ | Textarea placeholder. |
| `minCharacters` | `number` | ⭐ | Submit gate (file upload can bypass — below). |
| `allowFileUpload` | `boolean` | ▫️ | When true, an attached file counts as a submission even under `minCharacters`. |
| `teacherAnswer.exemplar` | `string` | ▫️ | **This is the FR "answer"** — the open-ended stand-in for a deterministic key. |
| `teacherAnswer.rubricCriteria[]` | `string[]` | ▫️ | Grading support (not the answer, not the explanation). Shown when non-empty. |
| `teacherAnswer.expectedElements[]` | `string[]` | ▫️ | Grading-support checklist; shown when `rubricCriteria` is absent. |
| `revealAnswerEnabled` | `boolean` | ▫️ | Answer-key (exemplar) visibility only — **not** the explanation. |

> Free response has **no deterministic key**: `exemplar` plays the role that "highlight the correct option" plays for `multi`. `rubricCriteria` / `expectedElements` are a separate grading aid, and the universal `reveal.explanation` ([§3](#the-answer-model--three-distinct-concepts)) is the "why." Don't conflate the three. Scores `ungraded` (manual/AI scoring affordance-only); passes when the min-character gate is met.

### 4.3 Matching (`match`)

| Field | Type | | Notes |
|-------|------|---|-------|
| `terms[]` | `{ id, text? , contentBlocks? }` | ⭐ | Left column cards. |
| `prompts[]` | `{ id, text?/contentBlocks?, correctTermId }` | ⭐ | Right column; each carries its **answer key** (`correctTermId`). |
| `termLabel` / `promptLabel` | `string` | ▫️ | Deck headers. Default "Term" / "Definition". |
| `columnFlex` | `{ terms, prompts }` | ▫️ | Relative column widths (flex-grow proportions). |
| `cardAlignment` | `{ terms?, prompts? }` | ▫️ | `start`/`center` per column. Defaults: terms centered, definitions start. |

### 4.4 Drag & Drop — Parsons (`dragDrop`, `mode: "parsons"`)

| Field | Type | | Notes |
|-------|------|---|-------|
| `blocks[]` | `DragDropItem[]` | ⭐ | All draggable blocks (incl. distractors). `text` or `contentBlocks`. |
| `correctOrder[]` | `string[]` | ⭐ | Correct top-to-bottom block ids (solution blocks only). |
| `correctIndents[]` | `number[]` | ▫️ | Indent depth per solution line; presence enables nested drop targets. |
| `distractorIds[]` | `string[]` | ▫️ | Blocks that should never appear in the solution. |
| `bankLabel` / `solutionLabel` | `string` | ▫️ | Defaults "Unused blocks" / "Your solution". |

### 4.5 Drag & Drop — Categorization (`dragDrop`, `mode: "categorization"`)

| Field | Type | | Notes |
|-------|------|---|-------|
| `buckets[]` | `{ id, label, description? }` | ⭐ | Target categories. |
| `items[]` | `{ id, text?/contentBlocks?, correctBucketIds[] }` | ⭐ | Draggables; each carries its key (`correctBucketIds` — may accept multiple buckets). |
| `bankLabel` | `string` | ▫️ | Source deck label. Default "Items". |

> Drag-drop scores `ungraded` in the prototype scorer — flagged gap, not a content-model gap.

### 4.6 Fill in the Blank (`fillInBlank`)

| Field | Type | | Notes |
|-------|------|---|-------|
| `segments[]` | `({ type:"text", text } \| { type:"blank", blankId })[]` | ⭐ | Interleaved sentence with inline blanks. |
| `blanks[]` | `FillInBlankDefinition[]` | ⭐ | One per `blankId`. Carries the answer key. |
| `blanks[].acceptedAnswers[]` | `string[]` | ⭐ | Any match = correct. |
| `blanks[].placeholder` | `string` | ▫️ | Per-blank hint text. |
| `blanks[].caseSensitive` | `boolean` | ▫️ | Default false. |
| `blanks[].trimWhitespace` | `boolean` | ▫️ | Default true. |
| `revealAnswerEnabled` | `boolean` | ▫️ | Surfaces accepted answers on reveal. |

---

## 5. Layer C — Assessment-placement config

Properties decided **per assessment**, not stored on the question. Live on `AssessmentArtifact` or the per-question `AssessmentQuestionRef`.

| Field | Scope | Notes |
|-------|-------|-------|
| `pointsOverride` | per question (`questionRef`) | Optional override of the bank's default `points`. See [§6.1](#61-points-bank-default--per-assessment-override). |
| question order | per assessment | `questionRefs[]` order (drag-reorder on the canvas). |
| `mode` | assessment | `checkpoint \| survey \| quiz \| exam` — drives reveal/tutor/timer defaults. |
| `layout` | assessment | `scroll \| stepped`. |
| reveal visibility | assessment | Whether explanations show mid-attempt. **Assessment-wide, not per question.** See [§6.2](#62-reveal-explanation-is-bank-level-visibility-is-assessment-wide). |
| `shuffle` | assessment | Question + option order. |
| `timing`, `attempts`, `tutor`, `intro` | assessment | Exam/quiz behavior. |
| `poolDrawRules` | assessment | Draw N from a tagged pool at runtime (uses Layer-A `tags` + `difficulty`). |

---

## 6. Decisions on the tricky in-betweens

### 6.1 Points: bank default + per-assessment override ✅ DECIDED

- `QuestionItem.points` = **suggested default weight** (Layer A/B; defaults to 1).
- Each placement may set `pointsOverride` (Layer C).
- **Effective points** = `pointsOverride ?? item.points ?? 1`.

**Why:** mirrors how cert/standards banks behave — a question carries an inherent weight (often difficulty-implied), but a high-stakes exam can re-weight the same question vs. a practice quiz. The scorer (`scoreQuestionResponse`) should read *effective* points, not `item.points` directly.

> **Build change:** scoring + canvas total currently read `item.points`. Introduce `pointsOverride` on `AssessmentQuestionRef` and resolve effective points at the assessment boundary.

### 6.2 Reveal: explanation is bank-level, visibility is assessment-wide ✅ DECIDED

- **Explanation text** (`reveal.explanation`) lives on the question (Layer B) — it's about the content.
- **Whether answers/explanations are revealed** is decided **for the whole assessment**, not per question and not per placement (e.g. off for `exam`, on for practice `quiz`/`checkpoint`).

**Why:** keeps one explanation per question (no duplication), while reveal behavior stays a coherent assessment-level policy. Resolves today's conflict where `RevealConfig` sits on the item but the guideline calls reveal assessment-level.

> **Build change:** `RevealConfig.enabled` (per-item) should be retired/ignored in favor of an assessment-wide reveal setting. Keep `reveal.explanation` on the item. The per-question reveal toggle should **not** appear in `QuestionItemEditor`.

### 6.3 Survey/ungraded is an assessment property; "no key" is a question property

Two related-but-distinct ideas — keep both:

- **No answer key authored** (`surveyMode` on `multi`, or simply omitting `correctAnswerId`) — intrinsic to the question. A reflection question has no right answer anywhere.
- **Ungraded context** (`AssessmentArtifact.surveyMode` / `mode: "survey"`) — an assessment can present a normally-graded question without scoring it.

A graded MC *can* be reused in a survey assessment; an intrinsically keyless question *cannot* become graded. Both flags are legitimate; the editor should label them distinctly ("This question has no correct answer" vs. assessment-level "Survey — don't score").

### 6.4 Catalog tags: course, unit, concepts (difficulty dropped in P0) ✅ DECIDED

- **P0:** required to bank: `title`, `courseId`, `unitId`, ≥1 concept tag. Difficulty is not authored.
- **Legacy builder:** still shows difficulty + domain labels.
- One-offs may omit catalog metadata. Promoting a one-off to the bank requires filling the P0 catalog fields.

### 6.5 Internal title vs. student-facing prompt

Two separate fields, never conflated:
- `title` (Layer A) — internal bank listing name, for authors searching the bank. Never rendered to students.
- `prompt` / `description` (Layer B) — the student-facing question.

The editor shows the title as a "Bank label" with a hint that it's internal.

---

## 7. Validation gates

Requirements differ by **destination**, not by type:

| Action | Requires |
|--------|----------|
| **Save for this assessment** (inline one-off) | Valid Layer-B content only (stem + answer key for the type, unless survey/keyless). No catalog metadata required. |
| **Save to question bank** (promote/upsert) | Above **plus** Layer-A required fields: `title`, `courseId`, ≥1 concept tag, and in P0 a `unitId`. Difficulty is not required. |
| **Publish assessment** (future) | All placed questions resolve to valid content; graded modes require a key on every non-survey question; question pinning. (Deferred — see Known gaps in `assessment-builder.md`.) |

---

## 8. Schema reconciliation gaps (canonical types vs. renderer)

The canonical `QuestionItemContent` types in [`src/types/assessmentBuilder.ts`](../../types/assessmentBuilder.ts) are **narrower** than what the data-layer payloads / renderers support. Before building the editors, decide whether each presentation option is author-exposed or adapter-defaulted:

| Type | Renderer supports (in `data/assessment/*`) | Missing from canonical `QuestionItem*Content` |
|------|---------------------------------------------|-----------------------------------------------|
| `match` | `termLabel`, `promptLabel`, `columnFlex`, `cardAlignment` | all four |
| `dragDrop` (parsons) | `bankLabel`, `solutionLabel` | both |
| `dragDrop` (categorization) | `bankLabel` | yes |
| `multi` | `optionLayout` | present ✅ |
| `fillInBlank` | `caseSensitive`, `trimWhitespace` (via `FillInBlankDefinition`) | present ✅ |

**Recommendation:** treat these as **advanced/presentation options** — adapters supply sensible defaults, and the editor exposes them in a collapsed "Layout" group rather than the primary field set. Add them to the canonical types only as author-editable fields land in the editor, so the canonical schema stays the source of truth.

---

## 9. Inline editor structure (`QuestionItemEditor`)

Designed from the model, **unburdened by the current implementation**. The editor reads top-to-bottom as a consistent narrative for every type — *identify → ask → answer → explain → catalog → tune* — with only the **Answer** group changing shape per type.

### 9.0 General structure (every type)

| # | Group | Contents | Always visible? |
|---|-------|----------|-----------------|
| 1 | **Identity row** | Internal **title** (labeled "Bank name — internal") · **type** indicator · **effective points** (bank default; override affordance when placed in a graded assessment) | Yes |
| 2 | **Question** | **Stem** (plain heading) · **Body** (markdown, optional) · **+ Add code context** toggle (optional code panel) | Yes |
| 3 | **Answer** | Type-specific — see §9.1–9.6. Contains both *authoring the options/structure* and *marking what's correct*, together. | Yes |
| 4 | **Explanation** | Optional "why this is correct" prose (`reveal.explanation`). One field, type-agnostic. **No reveal-timing toggle** — that's assessment-wide. | Yes (collapsed if empty) |
| 5 | **Catalog** | **Course** · **Difficulty** · **Domains**. Required to bank; an inline "Save to bank" gate validates these. Dimmed/optional for one-offs. | Collapsible |
| 6 | **Advanced / Layout** | Presentation + edge options (per type, §9.7). | Collapsed |

**Design rules**
- Correctness is authored *inline with each choice* (a radio/checkbox next to each option), never as a separate "answer key" panel divorced from the options. The answer and the thing being answered live together.
- Group 4 holds the *explanation only*. The *answer reveal* (showing the key) is intrinsic to Group 3 content; whether either shows to a learner is assessment-level.
- Catalog (Group 5) collapses by default for one-offs so the quick path stays short, expands (and validates) when the author chooses "Save to bank."

### 9.1 Multiple Choice — Answer group

- **Selection mode** segmented control: *Single* / *Multiple* (switching re-maps the correctness control between radio and checkbox).
- **Options list**, each row: drag handle · **content** (defaults to a text field; "⋯" swaps to a code or image block) · **correctness control** (radio for single, checkbox for multiple) · remove. **+ Add option** below.
- **Survey toggle** ("This question has no correct answer") — hides all correctness controls and the answer concept entirely.

*Advanced/Layout:* option layout (list / grid + columns); multi-select `requiredSelectionCount` / `maxSelectionCount`.

### 9.2 Free Response — Answer group

Open-ended, so "answer" means exemplar, not a key:
- **Response settings** row: **placeholder** · **minimum characters** · **allow file upload** toggle.
- **Sample answer (exemplar)** — labeled as the answer, optional. *This is the FR analog of the correct option.*
- **Grading support** sub-group (optional): toggle between a **rubric** (criteria list) and an **expected-elements** checklist. Clearly separated from the exemplar so the three concepts ([§3](#the-answer-model--three-distinct-concepts)) stay distinct.

*Advanced/Layout:* none beyond the above.

### 9.3 Matching — Answer group

- Two stacked editable decks: **Terms** and **Definitions**. Each card: content (text/code/image) + remove; **+ Add** per deck.
- Each **Definition** card carries a **"matches →" selector** naming its correct term. Pairing is authored on the definition, inline.

*Advanced/Layout:* term/definition deck labels; column width ratio; per-column content alignment.

### 9.4 Drag & Drop (Parsons) — Answer group

The answer *is* the ordered, optionally-indented sequence, so author it as the solution directly:
- **Solution builder**: an ordered, drag-reorderable list of blocks. Each row: block content (text/code) · **indent stepper** (when nesting is on) · **"distractor" toggle** (in the pool, never in the solution) · remove.
- Order = top-to-bottom position; correct indents = the stepper values; distractors are flagged in place rather than maintained as a separate list.
- **Nesting** toggle enables/disables the indent steppers.

*Advanced/Layout:* bank label, solution label.

### 9.5 Drag & Drop (Categorization) — Answer group

- **Buckets** list: each bucket = label + optional description; **+ Add bucket**.
- **Items** list: each item = content (text/code/image) + a **bucket assignment** control (multi-select, since an item may fit several buckets); **+ Add item**.

*Advanced/Layout:* source bank label.

### 9.6 Fill in the Blank — Answer group (special: answer is inside the prompt)

This type breaks the "stem then answer" split — the blanks live *in* the sentence:
- The **Question** group (#2) becomes a **rich sentence editor** with an **"Insert blank"** action that drops an inline blank token at the cursor.
- The **Answer** group becomes **one card per blank** (ordered as they appear): **accepted answers** (add several) · **placeholder** · matching rules (case-sensitive, trim) in advanced.
- Editing the sentence and editing a blank's accepted answers are visually linked (selecting a blank token focuses its card).

*Advanced/Layout (per blank):* case sensitivity, whitespace trimming.

### 9.7 Cross-cutting special cases

| Case | Effect on the editor |
|------|----------------------|
| **Keyless / survey question** | Correctness controls hidden; Answer group reduces to authoring options only. (`multi` today; conceptually any type.) |
| **Code context attached** | Group 2 gains a code-panel sub-editor (files + placement). Available to every type. |
| **One-off (not yet banked)** | Catalog group collapsed and optional; "Save to bank" expands + validates it. |
| **Placed in a graded assessment** | Identity row exposes the **points override**; effective value = override ?? bank default ?? 1. |
| **Placed in an exam / survey** | No editor change — reveal timing and scoring context are assessment-level, not authored here. |
