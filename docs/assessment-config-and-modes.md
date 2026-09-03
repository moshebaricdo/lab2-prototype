# Assessment Configuration & Modes

This doc defines the assessment-level model: what an assessment stores, which settings configure how it runs, and how modes such as Checkpoint, Quiz, Practice Test, and Exam prefill those settings.

**P0 scope (prototype):** prioritize **checkpoints (CFUs)** and **exams**. Surveys are out of scope. Do not shuffle question order or answer options. Drop difficulty. **Standards** are question tags; course/unit are bank scope and quiz placement, not tags. Living status: [docs/status.md](./status.md).

It pairs with [Question Types & Field Requirements](./question-types-and-fields.md). That doc covers reusable question items. This one covers the assessment that selects questions, orders them, and decides how learners take, submit, and review them. Like its companion, this is intentionally tool-agnostic.

---

## How to read this

An assessment has three parts:

| Part | What it covers |
|------|----------------|
| **Setup** | Title, internal label, starting mode, and optional bank filter. |
| **Content** | The fixed, dynamic, or grouped set of questions included in the assessment. |
| **Settings** | Layout, attempts, timing, scoring, pass threshold, tutor availability, answer reveal, and results display. |

Modes are presets over the same assessment model. "Checkpoint," "Quiz," "Exam," and the other modes are not separate object types; they are all assessments that differ by question count and configuration. They start from different default values for the shared settings, and authors can adjust those settings when the product allows it.

Assessments are also course-portable. A question belongs to a course bank. An assessment can reference questions from a bank, but the assessment itself is not owned by a course and can be reused in different curriculum contexts.

The sections below follow that order: Setup, Content, then Settings. Mode presets come after those sections because they prefill settings rather than introduce another assessment layer.

---

## Setup

These fields are entered by the author. A mode may provide defaults for the assessment settings, but it should not override these fields.

| Setting | What it is | Required? |
|---------|------------|-----------|
| **Title** | The student-facing name of the assessment. | ✅ |
| **Internal name** | Optional author-facing label, distinct from the student title. | Optional |
| **Mode** | The starting configuration. See [Mode Presets](#mode-presets). | ✅ |
| **Bank filter (course)** | Optional convenience: pre-filters the question bank shown while authoring. It does **not** bind the assessment to a course; authors can still pull questions from any bank, and the assessment remains reusable across curricula. | Optional |

Unlike a banked question, an assessment does not require a course owner. Setting a course here only narrows the authoring view of the question bank; it does not scope where the assessment can be used.

---

## Content

These fields define which questions are included in the assessment. The question list and grouping are author content choices, not mode defaults, so they are described here but omitted from the preset matrix.

| Field | What it is |
|-------|------------|
| **Question list** | An ordered set of questions, each a live reference to a banked question or a one-off authored for this assessment. Banked questions keep the bank as the source of truth unless a future publishing model adds snapshots. *(Author choice, not mode-driven.)* |
| **Dynamic draw** | Populate the assessment from filters such as domain, difficulty, or question type instead of manually choosing every question. The simple model is either a fixed list or a fully dynamic draw; mixed fixed-plus-dynamic assessments need more definition. |
| **Sections / groups** | Optional labeled groups for longer assessments. Useful when several questions should appear together, such as a group of questions tied to the same code block. |

---

## Settings

These are the assessment-level settings that control how the assessment is taken, scored, and reviewed. A mode preset ([below](#mode-presets)) is a saved starting point for these values.

Pass thresholds are author choices, not mode defaults, so they are described here but omitted from the preset matrix.

### Taking Experience

| Setting | What it is |
|---------|------------|
| **Layout** | All questions on one scrollable page, or one question at a time (stepped). Longer assessments may also use sections to show a group of related questions on the same page. |
| **Shuffle questions** | Randomize question order per learner. |
| **Shuffle options** | Randomize option order within a question. |
| **Intro screen** | An overview shown before starting: description, estimated time, attempt info. |
| **Attempts** | How many times a learner may take it. |
| **Time limit** | An overall limit for the attempt, or none. |
| **Tutor available** | Whether the AI tutor is available during the assessment. |

### Scoring & Results

| Setting | What it is |
|---------|------------|
| **Scored** | Whether responses are graded, or collected ungraded. |
| **Pass / mastery threshold** | Optional assessment-level passing bar set by the author. |
| **Reveal correct answers** | Whether learners see the correct answer, and **when**: never, after each question, or after submitting. Assessment-wide, never per question. |
| **Show explanations** | Whether the "why" explanation accompanies a revealed answer. |
| **Show score** | Whether learners see a final score after submission. This can be separate from answer reveal, especially for multi-attempt assessments where learners may see a score without seeing exact correct answers. Domain-level results may still inform internal analysis or assessment balancing, but are not assumed to be learner-facing. |

---

## Mode Presets

A mode preset fills in the assessment settings for a common use case:

- **Checkpoint**: an in-level progress check. Usually one question, formative scoring, immediate feedback, and no stakes.
- **Practice Test**: exam-like questions with study-friendly behavior: retryable attempts, answers, and explanations.
- **Survey**: ungraded reflection or opinion gathering. No right answers and no score.
- **Quiz**: graded practice with moderate stakes. Usually allows a few attempts and reveals feedback after submission.
- **Exam**: high-stakes graded assessment. Usually one attempt, timed, no tutor, no feedback during the attempt, and stronger integrity defaults.

### Preset Matrix

How each mode starts the shared settings. These are defaults, not hard rules.

*Property names are provisional. Author content choices such as sections and pass thresholds are omitted from this matrix.*

| Property | Checkpoint | Practice Test | Survey | Quiz | Exam |
|----------|-----------|---------------|--------|------|------|
| **Scored** | Yes (formative) | Yes | No | Yes | Yes |
| **Attempts** | Unlimited | Unlimited | 1 | 3 | 1 |
| **Time limit** | None | None | None | Optional | Required |
| **Layout** | Single question | Stepped | Scroll | Scroll or stepped | Stepped |
| **Dynamic draw** | No | Optional | No | Optional | Common |
| **Shuffle questions** | No | Optional | No | Optional | Yes |
| **Shuffle options** | No | Optional | No | Optional | Yes |
| **Intro screen** | No | Yes | Optional | Optional | Yes |
| **Tutor available** | Yes | Yes | Optional | Yes | No |
| **Reveal correct answers** | After each question | After each question | N/A | After submit | Never |
| **Show explanations** | Yes | Yes | N/A | Yes | No |
| **Show score** | Yes | Yes | No | Yes | Yes |

Key differences:

- **Exam** prioritizes integrity: one attempt, timed, no in-progress reveal, no tutor, shuffled questions/options, and a final score.
- **Practice Test** can use exam-like content, but turns feedback on so learners can study from the results.
- **Survey** removes answer keys, scoring, and correctness feedback.

---

## Question vs. Assessment Boundary

Some settings involve both the question item and the assessment that contains it. Use the rule from the companion doc: if the same question could use a different value in two assessments, the assessment owns that value.

| Setting | Question item provides | Assessment decides |
|---------|------------------------|--------------------|
| **Point value** | The weight a question carries when scored | The assessment total produced by those question-level values |
| **Reveal** | The answer key + optional explanation *content* | Whether and when that content is shown |
| **Scoring context** | Whether the question has a correct answer at all | Whether this assessment scores it |

---

## Remaining Details To Specify

Product details still to define before this becomes an implementation-ready spec:

- **Reveal combinations.** Confirm which reveal timing options each mode allows, especially for multi-attempt assessments that may show score without showing exact answers.
- **Scoring authority.** Define where final scores and pass/mastery state are calculated and stored: client, server, gradebook, or another source of truth.
- **Grouped-question layout.** Define how sections behave in scroll vs. stepped layouts, and how shared context such as a code block attaches to a group of questions.
- **Mixed dynamic draws.** Decide whether an assessment can combine fixed questions with dynamically drawn questions, and how that would be authored, ordered, and scored.
