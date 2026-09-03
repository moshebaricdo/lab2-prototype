# Modernizing Assessments — Status

Living snapshot of **product decisions** and **prototype state** for this workstream. Specs and implementation details live in the linked docs; this file is the turn-by-turn source of truth for what is in, out, and still open.

**Last updated:** 2026-08-28

**How to maintain:** update this file in the same turn as substantive product or architecture changes (scope, modes, tagging, schema, routes, builder UX model). Skip for visual polish, copy nits, and bugfixes that do not change the model.

---

## Current prototype

| Route | Role |
|-------|------|
| [`/levels/assessment-builder-p0`](/levels/assessment-builder-p0) | **Active P0 prototype.** Seeded cert exam **attached** to AI Foundations · Unit 3. Checkpoint vs Exam settings; Course / Unit **scope** + Standard tags. |
| [`/levels/assessment-builder-p0-draft`](/levels/assessment-builder-p0-draft) | P0 **floating** draft (not in a live unit). Same builder; bank course/unit start empty. |
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
| **Standards are tags; course/unit are not** | Bank result cards and the item editor show **standards** (and type) only. Course and unit are **scope** (bank filters) and **placement** (this quiz’s `script_level`), never chips on the question. |
| **Combined Course + Unit filter** | One **Used in course(s) or unit(s)** typeahead: course rows with nested units. Full-course check matches every question in that family; partial units are OR within/across courses. AND with standards and question types. Family-keyed labels, no year suffixes. |
| **Auto-scope from placement** | Attached quiz → default bank to that family + unit (clearable). Floating (“Draft · not in a live unit”) → leave course/unit empty; name/standard/type still work. |

Mode presets in P0 (`applyP0ModePreset`):

- **Checkpoint (CFU):** stepped, no timer, unlimited attempts, Tutor on, no intro, shuffle off.
- **Exam:** stepped, timed (default 45 min), 1 attempt, Tutor off, intro on, shuffle off, no mid-attempt reveal.

---

## What the P0 builder has today

- Lab2 workspace: **Build** is the block-based outline canvas (`AssessmentOutlineCanvas`) + **Preview** of the full assessment flow. Legacy routes keep the old `AssessmentBuildCanvas`.
- Outline canvas: uncontainerized overview header (heading-xl title, question count, time, attempts), pinned intro card (exam mode), sections-as-pages with **Section N** + title, single-row question cards, tick connectors, floating add toolbar.
- Sections: flat vs sectioned is a structural invariant — first **New section** wraps existing questions into Section 1; ungrouping/deleting the last section flattens back. `sections` is authoring truth; flattened `questionRefs` stays in sync for adapters/preview/scoring.
- Reorder: dnd-kit drag for questions (type icon is the handle; within and across sections) and collapsed sections; expanded sections move via overflow menu (Move up / Move down). Live outline preview while dragging.
- Add actions: floating toolbar (**New section** + Multiple Choice / Free Response / Matching; More = remaining P0 types + question bank). An empty section in a populated outline uses a dashed, unfilled slot with **Add from question bank** (opens the rail, scoped to that section) and **Create new** (five P0 types). Tick connectors at populated section / flat ends are append drop targets. Ghost **+ Add intro screen** when exam mode has no intro.
- Bank panel: search (“Search for a question”) + filter button (selected fill when filters deviate from placement; icon-only), uppercase result-count overline (hidden when empty), bordered result cards (title, hover eye, stem peek, gray **type** Tag then **standard chips** with `+N` overflow, brand plus / disabled check). Empty: centered **No results** + Clear filters. Filter popover: Sort by (A–Z / Z–A / newest / oldest / question type); combined course+unit typeahead; standards typeahead (framework groups); question-type checklist with Select all / Clear all. Closed fields show All vs a summary; Clear filters restores placement defaults.
- Placement chrome: workspace header **Live in 2 scripts** (attached) or **Draft** (floating). Global header uses the lesson name + “Saved a few seconds ago”, with Back to Levelbuilder / Save.
- Single-save edit model: cards expand in place; **Done** when clean (no forced save decision), **Save** when dirty. Saving a dirty bank ref prompts *Update the shared question* vs *Save a copy in this assessment only* (converts to inline). One-offs save directly with a secondary *Add to question bank*.
- Resource panel: **Question bank** and **Settings** (Tutor is a setting, not a panel).
- Inline editor catalog: **Standards** only (no course/unit; no difficulty; no per-question survey toggle).
- Settings: title, CFU vs Exam mode, Tutor, exam timing/attempts/intro (intro stays in sync with the outline's intro card).
- Persistence: `localStorage` (`lab2:assessment-bank`, `lab2:assessment-drafts`). Existing banks hydrate missing units/standards/questions on read; the P0 draft hydrates legacy flat drafts to the sectioned seed and fills missing `placement`, lesson name, and section titles.
- Seeded P0 exam: 8 AI Foundations questions across 3 named sections (Supervised Learning, Responsible AI, Models in Practice) with an intro screen, **attached** to Unit 3. Header lesson name is **AIF Practice Exam**. Extra bank items (including Web Dev) exist so widening filters is demonstrable.

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

## Locked builder UX

Paper hi-fi frames: `HF · 01`–`04` in *Modernizing Assessments*.

**Now in the React prototype (P0 route):**

- **Outline:** pinned intro (not reorderable), sections as nested pages (**Section N** + title), collapsed rows show type icon (drag handle) · internal name · stem peek · outlined pencil · minus. No `page.item`, no grip-dots, no catalog chips on collapsed rows. Floating add toolbar for new section / question types.
- **Edit is in-place** (scroll the card into view). One **Save** — not a “this assessment / question bank” menu. One-offs may still *Add to question bank*. **Done** exits a clean editor with no save decision.
- **Draft + shared question:** prompt *Update the shared question* vs *Save a copy in this assessment only*.
- **Live vs draft chrome:** attached quizzes show **Live in 2 scripts** on the workspace header; floating quizzes show **Draft**. Placement is not subtitle/meta copy.

**Not in the React prototype yet:**

- **Inspect** as a middle depth on the same card: standards, points, shared vs copy vs one-off, **usage** (derived — “used in N assessments”), placement. Edit is a separate action. (Prototype shows provenance in the expanded footer only.) Do not put editable Course/Unit on inspect.
- **Live vs draft** is **in a deployed script**, not a per-level publish button. A duplicate of a live level is a draft. (P0 shows the badge; it does not yet simulate script count or copy-on-edit rules.)
- **Live script:** one assessment banner (“students can see changes”). Shared-question edits copy silently. Placement changes (points, order, page) never copy.
- Catalog chips stay on **bank rows** (standards only). Collapsed outline stays identification-only; provenance can be a single inspect/collapsed signal later.

## Changelog

Newest first. Log **decisions and model changes**, not polish.

### 2026-08-28

- Empty section in a populated outline is a dashed, unfilled slot with two actions: **Add from question bank** (opens the rail, scoped to that section) and **Create new** (five P0 one-off types). Not copy-only.

### 2026-08-27

- Question bank filter matches the labeled CADS spec: combined **Used in course(s) or unit(s)** typeahead (hierarchical course + units, parent/partial/full states, Clear all + Done); **Standard(s)** typeahead grouped by framework; **Question type(s)** inline checklist (Select all / Clear all); five sort options. Closed fields show All vs a summary (no chips under fields). Empty bank list is a **No results** state. Search query is not part of “filters active.” Combined typeahead supersedes the earlier split Course / Unit fields.

### 2026-08-26

- P0 UI brought to Lab 2 Frame parity: workspace label + live/draft badge, header Back/Save without progression bubbles, bank type Tags, outline rows without `page.item`/grips, section overlines, tick connectors, floating add toolbar. Catalog/placement model unchanged.
- **Casing:** standards are the only question tags. Course/unit are bank **scope** (split Course + Unit filters, AND of layers) and quiz **placement** (Levelbuilder-owned), not chips on bank cards or editor fields. Reopened the earlier “tag by course, unit, concept” lock.
- Placement chrome: attached P0 exam defaults the bank to AI Foundations · Unit 3; new `/levels/assessment-builder-p0-draft` is a floating checkpoint (empty course/unit scope).
- P0 Build canvas rebuilt as the block-based outline (`AssessmentOutlineCanvas`): overview header, pinned intro card, sections-as-pages with the wrap/flatten invariant, dnd-kit cross-section drag, ghost add rows. Legacy routes keep `AssessmentBuildCanvas`.
- Schema: `AssessmentSection` + optional `sections` on `AssessmentArtifact`; optional `placement` (`floating` | `attached`). Flattened `questionRefs` kept in sync so adapters/preview/scoring are untouched. P0 seed now sectioned (3 sections + intro).
- Single-save model shipped on P0: Done-when-clean, Save-when-dirty, shared-question prompt (*Update the shared question* vs *Save a copy in this assessment only* → inline conversion). Two-destination save menu removed from the P0 editor.
- Question bank panel: search + filter button (badge counts deviations from placement scope), result-count overline, bordered result cards with **standard** tags only.

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
