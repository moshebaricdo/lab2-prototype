# Question Types & Field Requirements

A shared definition of **what every question type is made of** and **what the question bank requires**. This document is intentionally tool-agnostic — it describes the question *model*, not any particular authoring UI or implementation. Use it to align on requirements before building editors or importers.

---

## How to read this

This document describes a **question item** — the reusable unit. Everything a question item owns falls into **two layers**:

| Layer | The question it answers |
|-------|-------------------------|
| **1. Catalog** | *What is this question, for finding and reusing it?* |
| **2. Content** | *What does the learner see, and how is it answered?* |

Both layers travel with the question wherever it goes.

> **Out of scope: the assessment.** How a question is *used* — its order, timing, shuffle, scoring context, when answers are revealed — configures the **assessment** that contains it, not the question item. Those are deliberately excluded here so this doc stays focused on the question itself. The boundary (and what falls on the other side of it) is drawn in [Where assessment configuration lives](#where-assessment-configuration-lives).

### Banked vs. one-off

A question is **banked** when it carries full catalog metadata (Layer 1) and lives in the reusable bank. A **one-off** is a question created for a single assessment — a survey prompt, an Hour-of-Code checkpoint — that skips catalog metadata. One-offs can still be graded; they simply aren't catalogued. A one-off can be promoted to the bank later by filling in its catalog fields.

> **Principle:** lean toward banking (reuse), but never block a quick one-off.

---

## Layer 1 — Catalog (bank requirements)

What a question needs to be a good citizen of the bank. **Required to bank; optional for one-offs.**

| Field | What it is | Required to bank? |
|-------|-----------|-------------------|
| **Internal title** | A name for *authors* searching the bank. Never shown to learners. | ✅ |
| **Course** | Which course's bank this belongs to. | ✅ |
| **Unit** | Curriculum unit within the course. | ✅ |
| **Concepts** | Topics / standards / domains the question assesses. A question can carry several. | ✅ (at least one) |
| **Difficulty** | *Dropped in P0.* Previously beginner / intermediate / advanced. | — |
| **Point value (default)** | The question's *suggested* weight. A specific assessment may re-weight it (see [out of scope](#where-assessment-configuration-lives)), but the default belongs to the question. | Optional (defaults to 1) |

> **Likely needed for a production bank** (not yet specified): authorship/owner, status (draft / published / archived), version history, and a usage count (how many assessments reference it). Flagged here so they aren't forgotten.

---

## Layer 2 — Content (what the learner experiences)

### Shared by every question type

| Field | What it is | Required? |
|-------|-----------|-----------|
| **Type** | Which kind of question this is (Multiple Choice, Free Response, Matching, Drag & Drop, Fill in the Blank). Determines every other Content field below. Required for *every* question — banked or one-off. | ✅ always |
| **Question / stem** | The student-facing question. (Distinct from the internal title.) | ✅ — at least a stem or a body |
| **Body** | Optional rich supplemental content — formatted text, code, images, lists. Can carry the whole question, or add context beneath the stem. | Optional |
| **Answer** | The correct response. Its shape depends on the type (see below). | ✅ for graded questions |
| **Explanation** | Optional text explaining *why* the answer is correct. | Optional |
| **Code context** | An optional read-only code panel attached to any type, for "read this code, then answer" questions. | Optional |

### The answer model (important — read this once)

"The answer" means different things across types, and that's the source of most confusion. There are **three separate concepts** — keep them distinct:

1. **Answer key** — the *correct response itself*.
   - **Deterministic** for most types: the right option, the accepted text, the correct pairing or ordering. The system can grade it automatically.
   - **Open-ended** for Free Response: there is no single correct string, so a **sample answer (exemplar)** stands in for "the answer."
2. **Explanation** — optional prose explaining *why* the answer is right. Universal; applies to any type. This is **not** the answer — it's the reasoning.
3. **Grading support** *(Free Response only)* — optional **rubric criteria** or **expected elements** that help a person or AI score an open response. Distinct from both the exemplar and the explanation.

> So: a Multiple Choice question has a deterministic key **plus** an optional explanation. A Free Response question has an exemplar (its stand-in for "the answer") **plus** optional rubric **plus** an optional explanation. The word "reveal" should not be used to mean both "show the key" and "show the explanation" — they are separate contents.

---

## Per-type content requirements

For each type: what it is, the fields it needs, what its **answer** looks like, and its **special cases**.

### Multiple Choice

A stem and a set of options; the learner selects one or more.

| Field | Notes | Required? |
|-------|-------|-----------|
| **Options** | Two or more. Each option is text, or rich content (formatted text, a code snippet, or an image). | ✅ |
| **Selection mode** | *Single* (pick one) or *Multiple* (pick several). | Optional (defaults to single) |
| **Answer key** | Single: the one correct option. Multiple: the set of correct options. | ✅ when graded (omitted for survey) |

**Special cases**
- **Survey / reflection:** no correct answer at all. The question is intentionally keyless; it is never scored.
- **Multi-select constraints:** require exactly *N* selections, or cap the maximum selectable.
- **Option layout:** present options as a list (best for long text) or a grid (best for short, code, or image options).

### Free Response

A stem and an open text area; optionally a file upload.

| Field | Notes | Required? |
|-------|-------|-----------|
| **Placeholder** | Hint text in the empty response box. | ✅ |
| **Minimum length** | A soft gate ensuring a substantive response. | ✅ |
| **File upload** | Allow an attached file to count as a submission. | Optional |
| **Answer (exemplar)** | A sample strong response — the open-ended stand-in for an answer key. | Optional |
| **Grading support** | Rubric criteria, or a checklist of expected elements. | Optional |

**Special cases**
- **No automatic grading:** open responses are scored by a person or AI, not deterministically.
- The exemplar is the "answer"; rubric/expected elements are a separate grading aid — don't conflate them.

### Matching

Two columns; the learner connects each item on one side to its match on the other.

| Field | Notes | Required? |
|-------|-------|-----------|
| **Terms** | Left-column items (text or rich content). | ✅ |
| **Definitions / prompts** | Right-column items, each pointing to its correct term. | ✅ |
| **Answer key** | The correct term ↔ definition pairings. | ✅ |

**Special cases**
- Column labels, relative column widths, and content alignment are presentational options.

### Drag & Drop

The learner drags pieces into place. It has **two modes**, which share the drag-to-answer interaction but otherwise need different fields:

**Ordering (Parsons)** — arrange blocks (often lines of code) into the correct sequence.

| Field | Notes | Required? |
|-------|-------|-----------|
| **Blocks** | The draggable pieces (text or code). | ✅ |
| **Correct order** | The right top-to-bottom sequence. | ✅ |
| **Indentation** | When the correct sequence is also nested (e.g. a loop body), each line's indent depth is part of the answer. | Optional |
| **Distractors** | Extra blocks that don't belong in the solution. | Optional |

**Categorization** — sort items into buckets.

| Field | Notes | Required? |
|-------|-------|-----------|
| **Buckets** | The categories (label, optional description). | ✅ |
| **Items** | The draggable things to be sorted. | ✅ |
| **Answer key** | Which bucket(s) each item belongs in. An item may be accepted by more than one bucket. | ✅ |

**Special cases**
- **Mode** (ordering vs. categorization) selects which field set applies.
- *Ordering:* nesting on/off (ordering-only vs. ordering-plus-indentation) changes both authoring and grading; distractors add plausible-but-wrong blocks.

### Fill in the Blank

A sentence (or code) with one or more blanks the learner types into.

| Field | Notes | Required? |
|-------|-------|-----------|
| **Sentence with blanks** | The text, with blank positions marked inline. **The answer is embedded in the prompt itself**, not in a separate options list — this is what makes the type structurally special. | ✅ |
| **Accepted answers** | Per blank: one or more strings counted as correct. | ✅ |
| **Matching rules** | Per blank: case sensitivity and whitespace handling. | Optional (sensible defaults) |

**Special cases**
- The prompt and the answer are interleaved — authoring a blank means editing the sentence and its accepted answers together.
- Multiple blanks are independent, each with its own accepted answers.

---

## Where assessment configuration lives

The settings below are **not properties of a question item** — they configure the *assessment* a question is placed into. They're listed only to draw the boundary clearly; they're defined in their own doc, [Assessment Configuration & Modes](./assessment-config-and-modes.md).

| Assessment-level setting | Notes |
|--------------------------|-------|
| **Reveal visibility** | Whether answers and explanations are shown to the learner — decided for the **whole assessment** (e.g. off during an exam, on during practice), never per question. |
| **Scoring context** | An assessment can present an otherwise-graded question without scoring it (e.g. an ungraded survey). Distinct from a question that is *intrinsically* keyless. |
| **Point override** | An assessment may re-weight a question for that assessment only. The question's own default (Catalog) is the starting point. |
| **Order, shuffle, timing, attempts, layout** | How questions are sequenced and how the assessment is administered. |

> **Rule of thumb:** if a setting could differ for the *same question* across two assessments, it belongs to the assessment — not the question item.

---

## Summary: which layer owns what

| Concern | Owner |
|---------|-------|
| Internal title, **standards**, **default** point value | Question item — Catalog |
| Course / unit (where the *quiz* sits) | Levelbuilder placement — not question catalog |
| **Type**, stem, body, options, answer key, explanation, rubric, code context | Question item — Content |
| Reveal visibility, scoring context, order, shuffle, timing, attempts, **point override** | The assessment — *out of scope here* |
