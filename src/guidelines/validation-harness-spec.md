# Validation Harness Spec (assessment-owned checklist)

## Invariants

1. **Checklist = assessment goals only** — no appending requirements from instructions or derived rows.
2. **Evaluator routing is generalized** — goal requirement text resolves to `ai`, `version-history-save`, or `version-history-revert`; no level ids or flags.
3. **Labels and ids come from assessment** — `requirement-{index}` + bracket labels from `assessment.md`.
4. **Effort is a gate on AI goals, not a checklist row** — when `effortPolicy` is `required`, AI-evaluated goals fail without iteration evidence; no `workspace-progress` item.
5. **Version history snapshots** run when any assessment goal needs them, not when instructions mention Version History.

## Modules

| Module | Role |
|---|---|
| `validationGoalEvaluators.ts` | Resolve evaluator kind per goal index |
| `validationHarness.ts` | Evidence, checklist assembly, rollup, offer/fallback review |
| `validationReviewMessaging.ts` | Programmatic validation chat copy, LLM offer/result messaging helpers |
| `aiWebLab2Review.ts` | AI path for `ai` goals only; merges via harness |

## Goal → evaluator patterns

- **version-history-save** — goal text mentions saving a manual version / Version History with description
- **version-history-revert** — goal text mentions restoring/reverting to a saved version
- **ai** — default; model (or no-key placeholder) + optional effort gate

## Rollup

- Item status (`pass` / `warn` / `missing`) is authoritative.
- Aggregate status derived via `getValidationReviewSummaryStatus`; `likely_complete` gates Continue.
- `getNextStep` uses the first incomplete assessment item label when present.

## Pinned steps

When a route passes `validationReviewConfig`, the collapsed instructions pin uses **`Step N of M`** where `M` is the assessment goal count and `N` comes from the first incomplete criterion after Check My Work (or `1` before any review). Summary text uses review detail when present, otherwise the assessment goal label. Instruction guide shape (linear vs choice-based) does not affect the pin.

Levels without validation config keep guide-driven pinning (linear steps or open-ended focus).

## Student-facing validation copy

- Checklist rows, pass/warn/missing status, and Continue gating stay deterministic in `validationHarness.ts`.
- Chat text above the review card may be LLM-authored when a Tutor API key is present:
  - **Offer entry point** (natural-language readiness in chat): `generateValidationOfferMessage()` in `validationReviewMessaging.ts`
  - **Review results** (composer/card/Continue paths): `summaryMessage` from `createAiWebLab2ValidationReview()`, resolved via `resolveValidationResultMessage()`
- Both paths fall back to programmatic copy in `validationReviewMessaging.ts` when unkeyed or on model failure. The inline Check my work card UI is unchanged.

## Level builder contract

Authors declare all Continue requirements under `## AI Review Requirements` in `assessment.md`. Instructions remain student-facing prose only.
