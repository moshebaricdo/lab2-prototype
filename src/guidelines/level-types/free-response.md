# Free Response

## Purpose

Prototype of a single-question written response assessment level on the Lab2 shell: flexible stems (plain question and/or markdown), optional teacher answer reveal, optional file upload, and a compact submitted state.

## Routes

| Demo | Path |
|------|------|
| Simple text prompt | `/levels/free-response` |
| With reveal answer | `/levels/free-response-reveal` |
| Markdown description only (no `stem.question`) | `/levels/free-response-markdown` |
| File upload option | `/levels/free-response-upload` |

Bubble navigation for these demos is defined in `src/pages/levelTypeLinks.ts` (`freeResponseLevelLinks`).

## Key Files

- `src/pages/FreeResponseLevelPage.tsx` — simple demo route
- `src/pages/FreeResponseRevealLevelPage.tsx`
- `src/pages/FreeResponseMarkdownLevelPage.tsx`
- `src/pages/FreeResponseUploadLevelPage.tsx`
- `src/components/assessment/free-response/views/FreeResponseWorkspace.tsx`
- `src/components/assessment/free-response/views/FreeResponseWorkspace.module.scss`
- `src/components/assessment/free-response/views/UploadedFileChip.tsx` + `UploadedFileChip.module.scss` — file attachment chip UI under the drop zone
- `src/components/assessment/shared/AssessmentStemSection.tsx` — eyebrow, optional `stem.question`, optional markdown `stem.description`, then task UI
- `src/components/assessment/shared/AssessmentBottomRow.tsx` — footer row; `showLeft={false}` when this level type should not show teacher tools in the footer (default free-response demos omit the left cluster except when `revealAnswerEnabled` is true)
- `src/data/assessment/freeResponse.ts` — payload types and demo fixtures

## Current UX Behavior

- **Stem:** `stem.question` (optional plain heading) and/or `stem.description` (markdown). If `question` is omitted, the prompt lives entirely in `description` (see markdown-only demo).
- **Response:** Textarea with minimum character count; helper line under the field (character count + minimum copy; upload demo explains text-or-file rule).
- **Submit:** Enabled when the text meets `minCharacters`, or when **`allowFileUpload`** is true and either the minimum is met **or** a file is attached (file-only submit is allowed).
- **File upload (`allowFileUpload`):** Full-width dashed drop zone with **Attach a file** (`AppButton` secondary, gray, upload icon). Dropping or choosing a file shows an **`UploadedFileChip`** (teal icon rail, filename, extension, remove) below the zone.
- **Teacher answer (`revealAnswerEnabled`):** **Reveal answer** / **Hide answer** in the **bottom row** (left cluster), same interaction pattern as multi-choice. When revealed, an **inline** “Teacher answer key” block (exemplar + rubric or expected-elements list) appears inside the main card above the footer. Submit and inputs are disabled while revealed.
- **Submit / submitted:** On submit, textarea and file controls disable. There is **no** “Edit response” path. The bottom row shows a **Submitted** pill (light success background, check icon) and **Continue** (navigates to the next link in `freeResponseLevelLinks` or `/levels`).

## Data Shape

`FreeResponseLevelPayload` (`src/data/assessment/freeResponse.ts`):

- `level.stem.question` — optional plain-text heading.
- `level.stem.description` — optional markdown; if `question` is omitted, this carries the full prompt.
- `level.question.placeholder`, `level.question.minCharacters` — textarea configuration.
- `level.revealAnswerEnabled` — optional; when `true`, show bottom-row reveal + inline teacher content.
- `level.teacherAnswer` — optional `exemplar`, optional `rubricCriteria`, optional `expectedElements` (used when rubric lines are absent).
- `level.allowFileUpload` — optional; enables file UI and relaxed submit rule (text minimum **or** file).
- `level.metadata` — lesson name, level position, totals (for shell title and nav).

## Demo Fixtures

Exported mocks in `freeResponse.ts`:

- `mockFreeResponseLevel` — simple stem, no reveal, no upload.
- `mockFreeResponseLevelReveal` — `revealAnswerEnabled` + `teacherAnswer`.
- `mockFreeResponseLevelMarkdownOnly` — description-only stem.
- `mockFreeResponseLevelFileUpload` — `allowFileUpload: true`.

## Known Gaps

- No API submission, persistence, or rubric-based scoring.
- File handling is local UI only (no upload pipeline).
