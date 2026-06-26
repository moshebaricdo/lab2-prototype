import type {
  LevelGroupDragDropQuestion,
  LevelGroupFillInBlankQuestion,
  LevelGroupFlowPayload,
  LevelGroupFreeResponseQuestion,
  LevelGroupMatchQuestion,
  LevelGroupMultiQuestion,
  LevelGroupQuestionBlock,
} from "../../data/assessment/levelGroup";
import {
  levelGroupDragDropToPayload,
  levelGroupFillInBlankToPayload,
  levelGroupFreeToPayload,
  levelGroupMatchToPayload,
  levelGroupMultiToPayload,
} from "../../data/assessment/levelGroup";
import type { DragDropLevelPayload } from "../../data/assessment/dragDrop";
import type { FillInBlankLevelPayload } from "../../data/assessment/fillInBlank";
import type { FreeResponseLevelPayload } from "../../data/assessment/freeResponse";
import type { MatchLevelPayload } from "../../data/assessment/match";
import type { MultiChoiceLevelPayload } from "../../data/assessment/multi";
import type {
  AssessmentArtifact,
  AssessmentQuestionRef,
  QuestionItem,
  QuestionItemContent,
} from "../../types/assessmentBuilder";

const BUILDER_LEVEL_ID_BASE = 90000;

function questionItemToBlock(
  item: QuestionItem,
  blockId: string,
): LevelGroupQuestionBlock {
  const base = {
    blockId,
    ...(item.codePanel ? { codePanel: item.codePanel } : {}),
  };

  switch (item.item.kind) {
    case "multi":
      return {
        ...base,
        kind: "multi",
        question: multiContentToLevelGroup(item.item.content, item.bankId),
      };
    case "freeResponse":
      return {
        ...base,
        kind: "freeResponse",
        question: freeContentToLevelGroup(item.item.content, item.bankId),
      };
    case "match":
      return {
        ...base,
        kind: "match",
        question: matchContentToLevelGroup(item.item.content, item.bankId),
      };
    case "dragDrop":
      return {
        ...base,
        kind: "dragDrop",
        question: dragDropContentToLevelGroup(item.item.content, item.bankId),
      };
    case "fillInBlank":
      return {
        ...base,
        kind: "fillInBlank",
        question: fillInBlankContentToLevelGroup(item.item.content, item.bankId),
      };
  }
}

function multiContentToLevelGroup(
  content: Extract<QuestionItemContent, { kind: "multi" }>["content"],
  id: string,
): LevelGroupMultiQuestion {
  return {
    id,
    prompt: content.prompt,
    ...(content.description ? { description: content.description } : {}),
    answers: content.answers,
    ...(content.surveyMode
      ? {}
      : content.selectionMode === "multiple"
        ? {}
        : { correctAnswerId: content.correctAnswerId }),
  };
}

function freeContentToLevelGroup(
  content: Extract<QuestionItemContent, { kind: "freeResponse" }>["content"],
  id: string,
): LevelGroupFreeResponseQuestion {
  return {
    id,
    prompt: content.prompt,
    ...(content.description ? { description: content.description } : {}),
    placeholder: content.placeholder,
    minCharacters: content.minCharacters,
    revealAnswerEnabled: content.revealAnswerEnabled ?? content.teacherAnswer != null,
    teacherAnswer: content.teacherAnswer,
    allowFileUpload: content.allowFileUpload,
  };
}

function matchContentToLevelGroup(
  content: Extract<QuestionItemContent, { kind: "match" }>["content"],
  id: string,
): LevelGroupMatchQuestion {
  return {
    id,
    prompt: content.prompt,
    ...(content.description ? { description: content.description } : {}),
    terms: content.terms,
    prompts: content.prompts,
  };
}

function dragDropContentToLevelGroup(
  content: Extract<QuestionItemContent, { kind: "dragDrop" }>["content"],
  id: string,
): LevelGroupDragDropQuestion {
  return {
    id,
    prompt: content.prompt,
    ...(content.description ? { description: content.description } : {}),
    mode: content.mode,
    blocks: content.blocks,
    correctOrder: content.correctOrder,
    correctIndents: content.correctIndents,
    distractorIds: content.distractorIds,
    buckets: content.buckets,
    items: content.items,
  };
}

function fillInBlankContentToLevelGroup(
  content: Extract<QuestionItemContent, { kind: "fillInBlank" }>["content"],
  id: string,
): LevelGroupFillInBlankQuestion {
  return {
    id,
    prompt: content.prompt,
    ...(content.description ? { description: content.description } : {}),
    segments: content.segments,
    blanks: content.blanks,
    revealAnswerEnabled: content.revealAnswerEnabled,
  };
}

export function resolveQuestionRef(
  ref: AssessmentQuestionRef,
  bankQuestions: Map<string, QuestionItem>,
): QuestionItem | null {
  if (ref.type === "inline") return ref.item;
  return bankQuestions.get(ref.bankId) ?? null;
}

export function assessmentToFlowBlocks(
  artifact: AssessmentArtifact,
  bankQuestions: Map<string, QuestionItem>,
): LevelGroupQuestionBlock[] {
  return artifact.questionRefs
    .map((ref, index) => {
      const item = resolveQuestionRef(ref, bankQuestions);
      if (!item) return null;
      return questionItemToBlock(item, `block-${item.bankId}-${index}`);
    })
    .filter((block): block is LevelGroupQuestionBlock => block != null);
}

export function questionsToFlowBlocks(
  questions: QuestionItem[],
): LevelGroupQuestionBlock[] {
  return questions.map((item, index) =>
    questionItemToBlock(item, `block-${item.bankId}-${index}`),
  );
}

export function assessmentToFlowPayloadFromQuestions(
  artifact: AssessmentArtifact,
  questions: QuestionItem[],
): LevelGroupFlowPayload {
  const surveyMode =
    artifact.surveyMode === true || artifact.mode === "survey";

  return {
    level: {
      id: BUILDER_LEVEL_ID_BASE + artifact.metadata.levelPosition,
      name: artifact.title,
      type: "LevelGroup",
      metadata: {
        lessonName: artifact.lessonName,
        assessmentName: artifact.metadata.assessmentName ?? artifact.title,
        levelPosition: artifact.metadata.levelPosition,
        totalLevelsInScript: artifact.metadata.totalLevelsInScript,
      },
      ...(artifact.intro ? { intro: artifact.intro } : {}),
      ...(surveyMode ? { surveyMode: true } : {}),
      steps: questionsToFlowBlocks(questions),
    },
  };
}

export function assessmentToFlowPayload(
  artifact: AssessmentArtifact,
  bankQuestions: Map<string, QuestionItem>,
): LevelGroupFlowPayload {
  const questions = artifact.questionRefs
    .map((ref) => resolveQuestionRef(ref, bankQuestions))
    .filter((item): item is QuestionItem => item != null);
  return assessmentToFlowPayloadFromQuestions(artifact, questions);
}

export function questionItemToMultiChoicePayload(
  item: QuestionItem,
  artifact: AssessmentArtifact,
  stepIndex: number,
): MultiChoiceLevelPayload | null {
  if (item.item.kind !== "multi") return null;
  const block = questionItemToBlock(item, `preview-${item.bankId}`);
  if (block.kind !== "multi") return null;
  const flow = assessmentToFlowPayload(artifact, new Map([[item.bankId, item]]));
  const payload = levelGroupMultiToPayload(block, flow.level, stepIndex);
  const content = item.item.content;
  if (content.description) {
    payload.level.stem.description = content.description;
  }
  if (content.selectionMode === "multiple") {
    payload.level.selectionMode = "multiple";
    payload.level.correctAnswerIds = content.correctAnswerIds;
    if (content.requiredSelectionCount != null) {
      payload.level.requiredSelectionCount = content.requiredSelectionCount;
    }
    if (content.maxSelectionCount != null) {
      payload.level.maxSelectionCount = content.maxSelectionCount;
    }
  }
  if (content.optionLayout) {
    payload.level.optionLayout = content.optionLayout;
  }
  return payload;
}

export type PreviewPayload =
  | { kind: "multi"; payload: MultiChoiceLevelPayload; codePanel?: QuestionItem["codePanel"] }
  | { kind: "freeResponse"; payload: FreeResponseLevelPayload; codePanel?: QuestionItem["codePanel"] }
  | { kind: "match"; payload: MatchLevelPayload; codePanel?: QuestionItem["codePanel"] }
  | { kind: "dragDrop"; payload: DragDropLevelPayload; codePanel?: QuestionItem["codePanel"] }
  | { kind: "fillInBlank"; payload: FillInBlankLevelPayload; codePanel?: QuestionItem["codePanel"] };

export function questionItemToPreviewPayload(
  item: QuestionItem,
  artifact: AssessmentArtifact,
  stepIndex = 0,
): PreviewPayload | null {
  const block = questionItemToBlock(item, `preview-${item.bankId}`);
  const flow = assessmentToFlowPayload(artifact, new Map([[item.bankId, item]]));

  switch (block.kind) {
    case "multi": {
      const multi = questionItemToMultiChoicePayload(item, artifact, stepIndex);
      return multi
        ? { kind: "multi", payload: multi, codePanel: item.codePanel }
        : null;
    }
    case "freeResponse":
      return {
        kind: "freeResponse",
        payload: levelGroupFreeToPayload(block, flow.level, stepIndex),
        codePanel: item.codePanel,
      };
    case "match":
      return {
        kind: "match",
        payload: levelGroupMatchToPayload(block, flow.level, stepIndex),
        codePanel: item.codePanel,
      };
    case "dragDrop":
      return {
        kind: "dragDrop",
        payload: levelGroupDragDropToPayload(block, flow.level, stepIndex),
        codePanel: item.codePanel,
      };
    case "fillInBlank":
      return {
        kind: "fillInBlank",
        payload: levelGroupFillInBlankToPayload(block, flow.level, stepIndex),
        codePanel: item.codePanel,
      };
  }
}
