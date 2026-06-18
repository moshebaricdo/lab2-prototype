# Assessment Builder — Levelbuilder Handoff Contract

Forward-looking contract for how legacy Levelbuilder and the Lab2 in-lab builder divide ownership. **Greenfield** for this prototype: the in-lab builder may define any artifact shape; Levelbuilder is not constrained by legacy assessment content schemas.

## Levelbuilder owns (coarse shell)

| Field | Notes |
|-------|-------|
| Level title | Display name in course/script |
| Course / script placement | Where the level appears in the curriculum |
| Publish workflow | Draft → published, versioning at level boundary |
| Level type routing | Opens Lab2 with the saved assessment artifact |

Levelbuilder does **not** author individual questions, answer keys, or exam assembly in the target model.

## Lab2 in-lab builder owns (content + policy)

| Area | Artifact fields |
|------|-----------------|
| Questions | `questionRefs`, inline authoring → bank |
| Answer keys & explanations | `QuestionItem.reveal`, per-type content |
| Domain / standard tags | `QuestionItem.tags`, `poolDrawRules.tagIds` |
| Assessment mode | `mode`, `layout`, `surveyMode` |
| Exam policy | `timing`, `attempts`, shuffle, Tutor toggle |
| Pool assembly | `poolDrawRules` |
| Live preview | Adapters → existing assessment workspaces |
| Question bank linkage | `bankId` references (live in prod; localStorage in prototype) |

## Saved artifact

Levelbuilder persists a single **assessment content artifact** (JSON or equivalent) matching `AssessmentArtifact` plus embedded or referenced `QuestionItem` records:

```json
{
  "artifact": { "id": "...", "mode": "exam", "questionRefs": [{ "type": "bank", "bankId": "q-1" }] },
  "bankUpserts": []
}
```

Inline-authored questions are upserted to the course bank on save. Assessments store `bankId` references, not snapshots, unless publish pinning is enabled (deferred in prototype).

## Runtime handoff

1. Student opens level → Lab2 loads `AssessmentArtifact` + resolves bank questions
2. `resolveAssessmentQuestions` applies pool draw + shuffle per attempt
3. `assessmentToFlowPayloadFromQuestions` feeds the multi-question flow renderer
4. Submit produces `QuestionResponse[]` → `ScoringResult[]` → domain report

Scoring execution location (client vs service) is TBD; the artifact always carries scoring **config** on each `QuestionItem`.

## Prototype vs production

| Concern | Prototype | Production intent |
|---------|-----------|-------------------|
| Persistence | `localStorage` keys `lab2:assessment-bank`, `lab2:assessment-drafts` | Course bank API + level content API |
| Bank references | Live `bankId` via localStorage | Live `bankId` with optional publish pin |
| Tutor / attempts | In-lab builder settings tab | May move to Levelbuilder shell |
| Levelbuilder UI | Not implemented in sandbox | Shell fields only |

## Migration note

Legacy **levelgroup** combined separate question-levels into one student flow. The canonical model replaces that with one `AssessmentArtifact` containing multiple `QuestionItem`s. Levelgroup remains in the codebase as a rendering reference only.
