# AI Lab — 6th-grade playtest follow-up (v2 progression)

Living doc for the work that came out of the first AI Lab playtest with 6th graders. Where we started, what we learned, what we decided, and what is being built (in order). Update as decisions change or items land.

Related: `src/guidelines/level-types/ailab.md` (routes, key files, current UX), `src/data/ailab/instructions.ts`, `src/data/ailab/playtestProgression.ts`.

---

## Where we started

The playtest ran on `/levels/progression-ailab`, a three-stage in-memory progression on the locked Bird / mammal / fish sheet with a Decision Tree:

1. **Look** — Data Set only. Land on a 25-row spreadsheet. Column analysis dock on header click. Table / Cards toggle.
2. **Try** — Testing only, with an explicit pretrained tree on **Has feathers** + **Breathes with lungs**. Floating "Try a prediction" card + prediction card over the tree canvas.
3. **Build** — Data Set + Testing. Train rail (Predict / Using dropdowns → Train model → Results card with accuracy → **Test model →**).

Training is a 420ms "Training…" pause followed by an accuracy percentage. A new prediction in Testing jumps the trace to its last step; Play is opt-in.

## What we learned

Students navigated the UI fine and understood almost none of it. They lacked the base mental model for **data** ("one row is one animal, one column is one thing we know about it, one special column is the answer") and for **prediction** (the model is a set of questions built from those rows). Specific observations:

- The Look stage leads with the aggregate (a table). Nothing builds the individual → aggregate model first.
- The dataset has no story. Students see a name and a grid; nothing says what a row is, who collected it, or why.
- Train → Test is a leap. The model appears as a number. Nothing shows the tree forming from the data.
- Accuracy as a percent is meaningless without a visible process behind it.
- Selected label/features are not visible in the sheet; the statement ("Predict X based on Y") only appears on Testing.
- The Testing trace does not auto-play, so the "model thinks in steps" moment is easy to miss.
- Vocabulary drifts across surfaces (property / column / feature; Predict / Using / based on).

The tool is one piece of a scaffolded curriculum (unplugged activities, mini-lessons, quizzes) and will not carry the concept alone. But the tool must stop assuming the concept, and it must stay usable by advanced high-school levels with far less scaffolding — every onboarding step below is a level knob, not baked-in behavior.

## Decisions

### Data before the model

- **Cards as an authorable default view** (exists: `defaultDataView: "cards"`). Keep.
- **Intro activity** (new, generic, `introActivity` on the level config). Modes: `none` | `info` | `classify` (+ `extend` later for older students: "add N more rows"). Nothing in the flow knows about a specific dataset; the label column, its values (the classify button row), and sampled rows come from the sheet. Author knobs: row count / explicit row ids, `visibleColumns`, property reveal `all` | `one-at-a-time`, `showStoryFirst`. Cardinality guardrails (`MAX_CATEGORY_VALUES`, 8-label palette) decide whether `classify` is available; otherwise fall back to `info`.
- **Classify card visual**: properties reveal as clues (one at a time when configured), label hidden, button row to guess, flip to reveal; label palette colors carry through to tree leaves / KNN wedges. Optional image slot (`imageColumn` convention) for datasets that have one; card layout must not depend on it.
- **Deck → sheet transition**: prototype as a shared-element move; validate visually before committing. Fallback: deck collapses into the first row.
- **Dataset story** as first-class metadata (`story` on the dataset: what one row is, who collected it / how, the question, why it matters, example row). Surfaces: Setup modal preview, "About this data" entry behind the dataset chip / name, optional story-first modal (the `info` intro mode), and available to Instructions.
- "Own a row" as a lightweight Look step is **dropped** for middle school (too light, poor discoverability); it returns as the `extend` mode for older students.

### Training as a visible step

- **Training modal is the training step.** The Train rail keeps the statement builder; **Train model** opens a modal titled **Training your model** with the sentence above the tree, grows the tree top-down (row counts and distribution bars filling), settles leaves into predictions with **correct / wrong marks on each leaf**, then shows results (Accuracy | Number correct) with **Test model** and **Back to data**.
- Closing the modal returns to Data Set where the Results card gains a **mini-map** thumbnail (static, no text). **Replay training** on the Train card reopens the same modal in playback. One component, two entry points.
- Granularity: the modal shows nodes at readable size using the existing layout constraints; wide trees reuse the pannable canvas and the animation follows the current split.
- KNN has no tree to grow; the modal shell must not assume a tree. KNN animation (rows placed on the target, then voting) is lower priority.
- **Correct / wrong lives on the model visual, not the sheet.** In Testing a novel input has no ground truth, so the mark appears only when the input came from a real row.
- **Random uses a real row** (replaces the existing per-field random fill). Inputs then always have ground truth, so the final node and Result card can show actual vs predicted.

### Statement as the through-line

- Keep the Predict / Using dropdowns; a live sentence populates beneath them as fields are chosen.
- The same sentence sits in the training modal body (title is the fixed **Training your model**) and already the Testing strip. Three placements, all in the context of the model.
- **Colors:** label = **brand** (purple), features = **success** (green). Applies to the strip Tags (already so), the sheet column highlight (full-column tint + light role borders; header-only selected fill), Cards view **dots** next to the name, the rail sentence, and the modal sentence.

### Testing polish

- **Auto-play** the trace from step 1 on every new prediction, with a **cooldown** that queues the latest input change until the walk finishes; Skip to end available. `prefers-reduced-motion` rewinds only.
- **First node and final prediction node open expanded** when a prediction is made; intermediate nodes stay as cards.
- Floating card titles are fixed strings: **Make a prediction** and **Result** (label name moves into the value line).
- Floating cards stay on the right.

### Deferred

- Guided instruction delivery (spotlight / zone highlighting). Explore tool changes first. Prod already supports a "guide" delivery (floating cards with nested Continue) that any future zone-anchor approach must work under.
- Vocabulary pass across instructions, rail, strip, modal — do it once the new surfaces exist so nothing is renamed twice.

### Progression

The existing `/levels/progression-ailab` is a demo and stays as-is. A **v2 progression** demos the same look → try → build shape with all of the above (story-first intro, classify cards, statement + highlights, training modal, autoplay).

## Execution order

| # | Item | Status |
|---|---|---|
| 1 | Live statement sentence under the Train dropdowns (`PredictionStatement`) | done |
| 2 | Sheet + Cards column highlight (label brand, features success) | done |
| 3 | Floating card titles → "Make a prediction" / "Result" (label name moves to an eyebrow) | done |
| 4 | First + final tree node expanded on prediction (click collapses) | done |
| 5 | Auto-play trace with cooldown (`useStepPlayback`; Play → Skip; deferred inputs; `autoPlayTrace`) | done |
| 6 | Random button uses a real row (`loadRandomRow`, `testRowIndex`); Result / final node show actual vs predicted | done |
| 7 | Dataset `story` metadata (`AiLabDatasetStory`) + About this data info button + story modal (`DatasetStoryModal`); stories for Bird / mammal / fish, Cats and dogs, Iris | done |
| 8 | Training modal (`TrainingModal` + `TreeGrowth`): growing tree, leaf ✓ / ✗ counts, results; mini-map (`TreeThumbnail`) + Replay on Results card; `trainingModal` knob | done |
| 9 | Classify intro activity (`IntroActivity`, `introActivity` config: info / classify, story-first, rowCount / rowIndexes, visibleColumns, reveal) | done — picture slot reserved (`story.imageColumn`), not rendered |
| 10 | Deck → sheet transition spike | pending — the deck hands off with a plain swap to the Cards carousel on Row 1 |
| 11 | v2 progression route `/levels/progression-ailab-v2` (`AiLabProgression`, generic `AiLabProgressionPage`) | done |
| 12 | Vocabulary pass | v2 instructions only; older routes pending |
| 13 | KNN training animation (rows placed, then vote) in the modal shell | pending |

## What v2 looks like

1. **Meet the Data** — story modal ("Let's try it") → five classify cards (Hawk, Salmon, Dog, …: clues, hidden Type, Bird / Fish / Mammal buttons, right / wrong reveal) → "You got N of 5 right… every card you saw is one row" → **Open the data** lands on the Cards carousel at Row 1 (the same Hawk). Table and the column dock are one toggle away. **About this data** stays in the header.
2. **Try a Prediction Model** — pretrained tree; **Random** loads a real animal, the trace auto-plays from the root, the root and answer nodes open, the Result card shows the predicted Type (no label line above it) plus Correct / Wrong against the real Type; **Replay** + the stepper sit in that card's footer.
3. **Train and Test a Model** — dropdowns + live sentence; Predict **Type** is read-only (hover: **You can't change this**). **Train model** opens the training modal (**Training your model**, sentence above the tree, tree grows, leaves get ✓ / ✗, score) → **Test model**. Results card keeps the mini-map; **Replay training** lives on the Train card.

## Success criteria for the next playtest

Observable, not vibes:

- A student can say what one row is.
- A student can say what the model is guessing and from what.
- A student can explain why the model got one animal wrong.
