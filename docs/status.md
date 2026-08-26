# Modernizing Assessments — Status

Living snapshot of **product decisions** and **prototype state** for this workstream. Specs and implementation details live in the linked docs; this file is the turn-by-turn source of truth for what is in, out, and still open.

**Last updated:** 2026-08-25

**How to maintain:** update this file in the same turn as substantive product or architecture changes (scope, modes, tagging, schema, routes, builder UX model). Skip for visual polish, copy nits, and bugfixes that do not change the model.

---

## Current prototype

| Route | Role |
|-------|------|
| [`/levels/assessment-builder-p0`](/levels/assessment-builder-p0) | **Active P0 prototype.** Seeded cert exam; Checkpoint (CFU) vs Exam settings; course / unit / concept bank filters. |
| [`/levels/assessment-builder-new`](/levels/assessment-builder-new) | Legacy exploration — blank quiz outline. Still shows shuffle, difficulty, survey. |
| [`/levels/assessment-builder-seeded`](/levels/assessment-builder-seeded) | Legacy exploration — six-question quiz (includes a survey item). |

Learner-facing question types (multi, free response, match, drag-drop, fill-in-blank, levelgroup) remain as rendering references. Canonical authoring going forward is the in-lab builder, not legacy levelgroup.

---

## P0 decisions (locked)

These came from internal architecture/scoping and are reflected in the P0 builder (`p0Aligned`):

| Decision | Implication |
|----------|-------------|
| **Prioritize CFUs and exams** | Checkpoint = check for understanding (typically one question in a progression). Exam = timed, high-stakes cert-style assessment. Quiz remains on the schema for legacy drafts only. |
| **Surveys out of scope** | No survey mode in P0 authoring. Survey copy/checkboxes hidden. Survey bank items hidden in the P0 bank list. |
| **No shuffling** | Question order and option order stay fixed. Hidden in P0 settings (teacher-dashboard impact we are not resourced to take). |
| **Drop difficulty** | No beginner/intermediate/advanced on questions. Not authored, filtered, or shown in P0. |
| **Tag by course, unit, concept** | Bank filters and question metadata use this taxonomy. “Concept” is the loose term for domains/standards. |

Mode presets in P0 (`applyP0ModePreset`):

- **Checkpoint (CFU):** stepped, no timer, unlimited attempts, Tutor on, no intro, shuffle off.
- **Exam:** stepped, timed (default 45 min), 1 attempt, Tutor off, intro on, shuffle off, no mid-attempt reveal.

---

## What the P0 builder has today

- Lab2 workspace: **Build** outline (inline question editor) + **Preview** of the full assessment flow.
- Resource panel: **Question bank** and **Settings** (Tutor is a setting, not a panel).
- Bank filters: search, A–Z / Recent sort, combined Course or unit, Standard (concept codes). Rows show type icon, stem preview, unit + standard chips.
- Inline editor catalog fields: course, unit, concepts (no difficulty; no per-question survey toggle).
- Settings: title, CFU vs Exam mode, Tutor, exam timing/attempts/intro.
- Persistence: `localStorage` (`lab2:assessment-bank`, `lab2:assessment-drafts`). Existing banks hydrate missing units/concepts/questions on read.
- Seeded P0 exam: 8 AI Foundations questions across Supervised Learning, Responsible AI, and Models in Practice. Extra bank items (including Web Dev) exist so filters are demonstrable.

---

## Explicitly out of scope (P0)

- Surveys / ungraded opinion gathering in this builder.
- Shuffle questions or options.
- Difficulty as a catalog field or filter.
- Teacher dashboard work that shuffling would require.
- Levelbuilder integration (handoff contract exists; UI not in this sandbox).
- Publish-time question pinning.
- Mixed fixed + dynamic pool assembly as an authoring surface (pool-draw remains on the schema, not in P0 settings).

---

## Open / later

- Scoring authority (client vs service vs gradebook).
- Relink a copy back to the shared question; promote a copy to replace the shared question.
- Grouped-question / shared-code-block layout.
- Reveal timing combinations for multi-attempt assessments.
- Drag-drop scoring (prototype scorer marks ungraded).
- Free-response AI/rubric scoring (affordance only).
- Whether quiz/practice-test returns as a first-class P0+ mode, or stays a preset of exam/checkpoint settings.
- Production bank API (authorship, draft/published/archived, usage count).
- Whether script **deploy** also freezes question copies automatically, or P0 only copies on first live edit. Copy-on-first-edit is enough to protect the shared question while hotfixing.

---

## Spec & implementation pointers

| Need | Doc |
|------|-----|
| Builder UX, routes, known gaps | [`src/guidelines/level-types/assessment-builder.md`](../src/guidelines/level-types/assessment-builder.md) |
| Question field / catalog schema | [`src/guidelines/level-types/assessment-builder-question-schema.md`](../src/guidelines/level-types/assessment-builder-question-schema.md) |
| Levelbuilder vs in-lab boundary | [`src/guidelines/level-types/assessment-builder-levelbuilder-contract.md`](../src/guidelines/level-types/assessment-builder-levelbuilder-contract.md) |
| Tool-agnostic assessment config | [`docs/assessment-config-and-modes.md`](./assessment-config-and-modes.md) |
| Tool-agnostic question types | [`docs/question-types-and-fields.md`](./question-types-and-fields.md) |

---

## Locked builder UX (not in the React prototype yet)

Paper hi-fi frames: `HF · 01`–`04` in *Modernizing Assessments*.

- **Outline:** pinned intro (not reorderable), sections as nested pages, collapsed rows show type icon (same as the bank) · internal name · stem peek · grab · `page.item` · edit · remove. No catalog chips on collapsed rows.
- **Inspect** is a middle depth on the same card: unit, standard, points, shared vs copy vs one-off, usage, placement. Edit is a separate action.
- **Edit is in-place** (scroll the card into view). One **Save** — not a “this assessment / question bank” menu. One-offs may still *Add to question bank*.
- **Live vs draft** is **in a deployed script**, not a per-level publish button. A duplicate of a live level is a draft.
- **Draft + shared question:** prompt *Update the shared question* vs *Edit a copy in this assessment only*.
- **Live script:** one assessment banner (“students can see changes”). Shared-question edits copy silently. Placement changes (points, order, page) never copy.
- Catalog chips stay on **bank rows**. Collapsed outline stays identification-only; provenance can be a single inspect/collapsed signal later.

## Changelog

Newest first. Log **decisions and model changes**, not polish.

### 2026-08-25

- Write policy: deployed script = live. Draft (including duplicates) prompts on a shared question. Live exam warns once, then copies the question without asking.
- Builder outline/inspect/in-place edit locked in Paper; React prototype still uses the older two-destination save menu.

### 2026-08-24

- P0 question bank panel matches the finalized CADS Figma sidebar: search + sort, combined **Course or unit** (union match), **Standard** filter with optional `DomainTag.code` chips, stem preview, type icons, and icon-only add.

### 2026-08-18

- Added this living status file. Agents should update it on substantive assessment-modernization turns (not design nits).

### 2026-08-14

- P0-aligned builder level: `/levels/assessment-builder-p0`.
- Scope: CFU + exam only; surveys hidden; shuffle hidden/off; difficulty dropped.
- Question bank taxonomy: course, unit, concept. Hydrate existing `localStorage` banks with units and new mock questions.
- Seeded 8-question AI Foundations Certification Exam; Settings mode switch applies CFU vs exam presets.
- Legacy blank + seeded routes kept as the prior exploration (still show shuffle / difficulty / survey).
