import {
  editableQuizSeed,
  isEditableQuizDemoId,
  type EditableQuizDemoId,
} from "../../data/assessmentBuilder/editableQuizDemos";
import {
  decodePropsOverride,
  encodePropsOverride,
} from "../../hooks/usePropsOverride";
import type {
  AssessmentArtifact,
  AssessmentQuestionRef,
  QuestionItem,
} from "../../types/assessmentBuilder";
import { getBankQuestionMap } from "./bankStorage";

/** Same `o` query param as other encoded level links. Payload key is `artifact`. */
export const EDITABLE_QUIZ_PARAM = "o";

const SESSION_PREFIX = "lab2:editable-quiz:";

const listeners = new Set<() => void>();
const memory = new Map<EditableQuizDemoId, AssessmentArtifact>();
/** Last `o` value applied for this demo, so a shared link can replace session state. */
const lastEncoded = new Map<EditableQuizDemoId, string | null>();
/**
 * Set for the rest of this document while a reset reload is in flight.
 * React still holds the old `o` param after `replaceState`, and a re-render
 * would treat that stale value as a new share link and save it again.
 */
let resetInProgress = false;

export function editableQuizResetInProgress() {
  return resetInProgress;
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeEditableQuiz(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function sessionKey(id: EditableQuizDemoId) {
  return `${SESSION_PREFIX}${id}`;
}

function isArtifact(value: unknown): value is AssessmentArtifact {
  if (!value || typeof value !== "object") return false;
  const candidate = value as AssessmentArtifact;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.courseId === "string" &&
    Array.isArray(candidate.questionRefs)
  );
}

export function artifactFromEncodedOverride(
  encoded: string | null,
): AssessmentArtifact | null {
  if (!encoded) return null;
  const decoded = decodePropsOverride(encoded);
  return isArtifact(decoded.artifact) ? decoded.artifact : null;
}

function canonical(artifact: AssessmentArtifact) {
  const { updatedAt: _updatedAt, ...rest } = artifact;
  return JSON.stringify(rest);
}

export function editableQuizMatchesSeed(artifact: AssessmentArtifact) {
  if (!isEditableQuizDemoId(artifact.id)) return false;
  return canonical(artifact) === canonical(editableQuizSeed(artifact.id));
}

function inlineRef(
  ref: AssessmentQuestionRef,
  bankQuestions: Map<string, QuestionItem>,
): AssessmentQuestionRef {
  if (ref.type === "inline") return ref;
  const item = bankQuestions.get(ref.bankId);
  if (!item) return ref;
  return { type: "inline", item: structuredClone(item) };
}

/**
 * Copy bank questions into the artifact so a shared link does not depend on
 * the recipient's question bank.
 */
export function prepareEditableQuiz(
  artifact: AssessmentArtifact,
): AssessmentArtifact {
  const bankQuestions = getBankQuestionMap(artifact.courseId);
  const questionRefs = artifact.questionRefs.map((ref) =>
    inlineRef(ref, bankQuestions),
  );
  const sections = artifact.sections?.map((section) => ({
    ...section,
    questionRefs: section.questionRefs.map((ref) =>
      inlineRef(ref, bankQuestions),
    ),
  }));
  const stamped: AssessmentArtifact = {
    ...artifact,
    questionRefs,
    sections,
    updatedAt: Date.now(),
  };
  return JSON.parse(JSON.stringify(stamped)) as AssessmentArtifact;
}

function readSession(id: EditableQuizDemoId): AssessmentArtifact | null {
  try {
    const raw = window.sessionStorage.getItem(sessionKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isArtifact(parsed) || parsed.id !== id) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(artifact: AssessmentArtifact) {
  if (!isEditableQuizDemoId(artifact.id)) return;
  try {
    if (editableQuizMatchesSeed(artifact)) {
      window.sessionStorage.removeItem(sessionKey(artifact.id));
      return;
    }
    window.sessionStorage.setItem(
      sessionKey(artifact.id),
      JSON.stringify(artifact),
    );
  } catch {
    // Private mode can reject the write. The encoded URL still carries the quiz.
  }
}

/**
 * Merge this quiz into the current query string. Other encoded override keys
 * and unrelated params (including share mode) stay put.
 */
export function searchWithEditableQuiz(
  current: URLSearchParams,
  artifact: AssessmentArtifact,
): URLSearchParams {
  const next = new URLSearchParams(current);
  const decoded = decodePropsOverride(next.get(EDITABLE_QUIZ_PARAM) ?? "");
  if (editableQuizMatchesSeed(artifact)) {
    delete decoded.artifact;
  } else {
    decoded.artifact = artifact;
  }
  if (Object.keys(decoded).length === 0) {
    next.delete(EDITABLE_QUIZ_PARAM);
    if (isEditableQuizDemoId(artifact.id)) lastEncoded.set(artifact.id, null);
  } else {
    const encoded = encodePropsOverride(decoded);
    next.set(EDITABLE_QUIZ_PARAM, encoded);
    if (isEditableQuizDemoId(artifact.id)) lastEncoded.set(artifact.id, encoded);
  }
  return next;
}

/**
 * Resolve the quiz for this page. A new encoded `o` value wins (shared link).
 * Otherwise keep the in-tab copy, then session storage, then the seed.
 */
export function ensureEditableQuiz(
  id: EditableQuizDemoId,
  encoded: string | null,
): AssessmentArtifact {
  if (resetInProgress) {
    const seed = structuredClone(editableQuizSeed(id));
    memory.set(id, seed);
    lastEncoded.set(id, null);
    return seed;
  }

  const fromUrl = artifactFromEncodedOverride(encoded);
  const urlMatchesDemo = fromUrl?.id === id;
  const seen = lastEncoded.get(id);

  if (urlMatchesDemo && encoded !== seen) {
    memory.set(id, fromUrl);
    lastEncoded.set(id, encoded);
    writeSession(fromUrl);
    return fromUrl;
  }

  const cached = memory.get(id);
  if (cached) return cached;

  const stored = typeof window === "undefined" ? null : readSession(id);
  const initial = stored ?? structuredClone(editableQuizSeed(id));
  memory.set(id, initial);
  return initial;
}

export function getEditableQuizSnapshot(
  id: EditableQuizDemoId,
): AssessmentArtifact {
  return memory.get(id) ?? editableQuizSeed(id);
}

/**
 * Drop in-memory copies and session rows so the next load uses the seed.
 * Marks a reset in progress and does not notify subscribers. React still
 * holds the old `o` param after the address bar is cleared, and a re-render
 * would save that edited quiz again before reload.
 */
export function clearEditableQuizCache() {
  resetInProgress = true;
  memory.clear();
  lastEncoded.clear();
  try {
    for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = window.sessionStorage.key(index);
      if (key?.startsWith(SESSION_PREFIX)) {
        window.sessionStorage.removeItem(key);
      }
    }
  } catch {
    // Private mode can reject storage access. The reload still drops the URL copy.
  }
}

/** Address without the encoded quiz, so a reload cannot restore the edited copy. */
export function hrefWithoutEditableQuizArtifact(href: string): string {
  const url = new URL(href);
  const hash = url.hash;
  const queryAt = hash.indexOf("?");
  if (queryAt < 0) return href;
  const params = new URLSearchParams(hash.slice(queryAt + 1));
  const decoded = decodePropsOverride(params.get(EDITABLE_QUIZ_PARAM) ?? "");
  delete decoded.artifact;
  if (Object.keys(decoded).length === 0) {
    params.delete(EDITABLE_QUIZ_PARAM);
  } else {
    params.set(EDITABLE_QUIZ_PARAM, encodePropsOverride(decoded));
  }
  const search = params.toString();
  url.hash = search ? `${hash.slice(0, queryAt)}?${search}` : hash.slice(0, queryAt);
  return url.toString();
}

export function commitEditableQuiz(
  id: EditableQuizDemoId,
  updater: (current: AssessmentArtifact) => AssessmentArtifact,
): AssessmentArtifact {
  const current = memory.get(id) ?? structuredClone(editableQuizSeed(id));
  if (resetInProgress) return current;
  const next = prepareEditableQuiz(updater(current));
  memory.set(id, next);
  writeSession(next);
  emit();
  return next;
}
