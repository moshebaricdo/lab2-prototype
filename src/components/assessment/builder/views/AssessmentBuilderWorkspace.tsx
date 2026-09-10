import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Dialog, SegmentedButton, Toast } from "@moshebaricdo/cads-react";
import { Lab2Shell } from "../../../lab2/Lab2Shell";
import { PanelHeader } from "../../../ui/PanelHeader";
import type { LevelProgressLink } from "../../../ui/header/LevelProgressBubbles";
import type { DevPanelField } from "../../../lab2/dev";
import { initialChatMessages } from "../../../../data/weblab2";
import { useAssessmentBuilderState } from "../../../../hooks/useAssessmentBuilderState";
import { useQuestionBank } from "../../../../hooks/useQuestionBank";
import { useChatState } from "../../../../hooks/useChatState";
import { useLayoutState } from "../../../../hooks/useLayoutState";
import { useVersionHistoryState } from "../../../../hooks/useVersionHistoryState";
import { usePropsOverride } from "../../../../hooks/usePropsOverride";
import {
  addSection,
  appendQuestionRef,
  cloneQuestionItem,
  createBlankQuestion,
  deleteSection,
  forkQuestionItem,
  insertSectionAt,
  getAllCourseBanksSnapshot,
  getConceptOptionsForCourse,
  getUnitOptionsForCourse,
  insertSection,
  isQuestionDraftDirty,
  moveQuestionRef,
  moveSection,
  questionRefId,
  removeQuestionRef,
  replaceQuestionRef,
  resetAllCourseBanks,
  resetAssessmentDrafts,
  resolvedShowIntro,
  withSavedIdentity,
  type BlankQuestionKind,
  type OutlineDropTarget,
} from "../../../../lib/assessmentBuilder";
import type {
  AssessmentIntro,
  AssessmentSection,
  QuestionItem,
} from "../../../../types/assessmentBuilder";
import { AssessmentBuilderPanel } from "./AssessmentBuilderPanel";
import { AssessmentBuildCanvas } from "./AssessmentBuildCanvas";
import { AssessmentOutlineCanvas } from "./AssessmentOutlineCanvas";
import { AssessmentArtifactWorkspace } from "./AssessmentArtifactWorkspace";
import { QuizAttemptWorkspace } from "../../quiz/QuizAttemptWorkspace";
import { QuizPreviewEmptyState } from "./QuizPreviewEmptyState";
import { QuizStatusTag } from "./QuizStatusTag";
import { SaveQuestionPrompt, type SaveQuestionPromptKind } from "./SaveQuestionPrompt";
import styles from "./AssessmentBuilderWorkspace.module.scss";

type WorkspaceMode = "edit" | "preview";

const QUESTION_SAVE_TOAST_MS = 2000;
const SECTION_REMOVED_TOAST_MS = 5000;

type QuestionEditSession = { draft: QuestionItem; baseline: QuestionItem };

interface SectionUndoSnapshot {
  section: AssessmentSection;
  index: number;
  sessions: Record<string, QuestionEditSession>;
  selectedBankId: string | null;
}

const WORKSPACE_MODE_OPTIONS = [
  { value: "edit", label: "Build", iconName: "pen-to-square" as const },
  { value: "preview", label: "Preview", iconName: "eye" as const },
];

const BUILDER_DEV_DEFAULTS: Record<string, unknown> = {};

interface AssessmentBuilderWorkspaceProps {
  assessmentId: string;
  levelLinks?: LevelProgressLink[];
  currentLevelPath?: string;
  /** P0-aligned authoring: CFU/exam only; course/unit as bank scope; standards as tags. */
  p0Aligned?: boolean;
}

export function AssessmentBuilderWorkspace({
  assessmentId,
  levelLinks,
  currentLevelPath,
  p0Aligned = false,
}: AssessmentBuilderWorkspaceProps) {
  const navigate = useNavigate();
  const { artifact, bankQuestions, resolvedQuestions, updateArtifact } =
    useAssessmentBuilderState(assessmentId);
  const { saveQuestion } = useQuestionBank(artifact?.courseId ?? "aif-cert");

  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [editSessions, setEditSessions] = useState<
    Record<string, { draft: QuestionItem; baseline: QuestionItem }>
  >({});
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("edit");
  const [sharedSavePromptOpen, setSharedSavePromptOpen] = useState(false);
  const [savePromptKind, setSavePromptKind] =
    useState<SaveQuestionPromptKind>("shared-unpublished");
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [saveToastOpen, setSaveToastOpen] = useState(false);
  const [sectionRemovedToastOpen, setSectionRemovedToastOpen] = useState(false);
  const sectionUndoRef = useRef<SectionUndoSnapshot | null>(null);
  const allCourseBanks = useSyncExternalStore(
    (callback) => {
      const handler = (event: StorageEvent) => {
        if (event.key === "lab2:assessment-bank" || event.key === null) callback();
      };
      window.addEventListener("storage", handler);
      return () => window.removeEventListener("storage", handler);
    },
    getAllCourseBanksSnapshot,
    getAllCourseBanksSnapshot,
  );

  const courseOptions = useMemo(
    () =>
      allCourseBanks.map((bank) => ({
        value: bank.courseId,
        label: bank.courseName,
      })),
    [allCourseBanks],
  );

  const getDomainOptionsForCourse = (courseId: string) => {
    return getConceptOptionsForCourse(allCourseBanks, courseId);
  };

  const getUnitsForCourse = (courseId: string) => {
    return getUnitOptionsForCourse(allCourseBanks, courseId);
  };

  useEffect(() => {
    if (!selectedBankId) return;
    const question = resolvedQuestions.find(
      (entry) => entry.bankId === selectedBankId,
    );
    if (!question) return;
    setEditSessions((current) => {
      if (current[selectedBankId]) return current;
      const baseline = cloneQuestionItem(question);
      return {
        ...current,
        [selectedBankId]: { draft: baseline, baseline },
      };
    });
  }, [selectedBankId, resolvedQuestions]);

  const canvasQuestions = useMemo(() => {
    return resolvedQuestions.map((question) => {
      const session = editSessions[question.bankId];
      return session ? session.draft : question;
    });
  }, [editSessions, resolvedQuestions]);

  const questionsById = useMemo(
    () => new Map(canvasQuestions.map((question) => [question.bankId, question])),
    [canvasQuestions],
  );

  const editingDraft = selectedBankId
    ? (editSessions[selectedBankId]?.draft ?? null)
    : null;
  const editingBaseline = selectedBankId
    ? (editSessions[selectedBankId]?.baseline ?? null)
    : null;

  /** Provenance of the question being edited — drives the single-save flow. */
  const editingRefType = useMemo<"bank" | "inline" | null>(() => {
    if (!artifact || !selectedBankId) return null;
    const ref = artifact.questionRefs.find(
      (entry) => questionRefId(entry) === selectedBankId,
    );
    return ref?.type ?? null;
  }, [artifact, selectedBankId]);

  const isQuestionDirty = isQuestionDraftDirty(editingBaseline, editingDraft);
  const dirtyBankIds = useMemo(() => {
    const ids = new Set<string>();
    for (const [bankId, session] of Object.entries(editSessions)) {
      if (
        session.draft.neverSaved ||
        isQuestionDraftDirty(session.baseline, session.draft)
      ) {
        ids.add(bankId);
      }
    }
    return ids;
  }, [editSessions]);
  const dirtyCount = dirtyBankIds.size;

  useEffect(() => {
    if (dirtyCount === 0) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirtyCount]);

  useEffect(() => {
    if (!saveToastOpen) return undefined;
    const timeoutId = window.setTimeout(
      () => setSaveToastOpen(false),
      QUESTION_SAVE_TOAST_MS,
    );
    return () => window.clearTimeout(timeoutId);
  }, [saveToastOpen]);

  useEffect(() => {
    if (!sectionRemovedToastOpen) return undefined;
    const timeoutId = window.setTimeout(() => {
      setSectionRemovedToastOpen(false);
      sectionUndoRef.current = null;
    }, SECTION_REMOVED_TOAST_MS);
    return () => window.clearTimeout(timeoutId);
  }, [sectionRemovedToastOpen]);

  const {
    activeTab,
    setActiveTab,
    isSettingsOpen,
    setIsSettingsOpen,
    sidebarWidth,
    setSidebarWidth,
  } = useLayoutState();
  const { chatMessages, setChatMessages, chatInput, setChatInput } =
    useChatState(initialChatMessages);
  const versionHistory = useVersionHistoryState();
  const overrideResult = usePropsOverride(BUILDER_DEV_DEFAULTS);

  const handleResetStoredQuizzes = useCallback(() => {
    const confirmed = window.confirm(
      "Reset stored quiz drafts and the question bank to the seed fixtures, clear session storage, then reload?",
    );
    if (!confirmed) return;
    resetAssessmentDrafts();
    resetAllCourseBanks();
    window.sessionStorage.clear();
    window.location.reload();
  }, []);

  const builderDevFields = useMemo<DevPanelField[]>(
    () => [
      {
        key: "resetStoredQuizzes",
        label: "Reset stored quizzes",
        description:
          "Clears saved quiz drafts, the question bank, and session storage, then reloads from the seed fixtures.",
        type: "action",
        buttonLabel: "Reset and reload",
        iconName: "eraser",
        group: "Session",
        onAction: handleResetStoredQuizzes,
      },
    ],
    [handleResetStoredQuizzes],
  );

  useEffect(() => {
    setActiveTab("builder-bank");
  }, [setActiveTab]);

  if (!artifact) {
    return null;
  }

  const courseId = artifact.courseId;
  const graded = p0Aligned
    ? true
    : artifact.mode !== "survey" && artifact.surveyMode !== true;

  const handleAddBankQuestion = (bankId: string, sectionId?: string | "new") => {
    if (p0Aligned) {
      updateArtifact((current) => {
        if (sectionId === "new") {
          const withNew = addSection(current);
          const newId =
            withNew.sections?.[withNew.sections.length - 1]?.id ?? null;
          return appendQuestionRef(withNew, { type: "bank", bankId }, newId);
        }
        return appendQuestionRef(current, { type: "bank", bankId }, sectionId ?? null);
      });
    } else {
      updateArtifact((current) => ({
        ...current,
        questionRefs: [...current.questionRefs, { type: "bank", bankId }],
      }));
      setSelectedBankId(bankId);
    }
  };

  const handleRemoveQuestion = (index: number) => {
    const ref = artifact.questionRefs[index];
    const removedBankId =
      ref?.type === "bank" ? ref.bankId : ref?.type === "inline" ? ref.item.bankId : null;
    if (removedBankId && selectedBankId === removedBankId) {
      setSelectedBankId(null);
    }
    updateArtifact((current) => ({
      ...current,
      questionRefs: current.questionRefs.filter((_, i) => i !== index),
    }));
  };

  const handleReorderQuestion = (fromIndex: number, toIndex: number) => {
    updateArtifact((current) => {
      const next = [...current.questionRefs];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return { ...current, questionRefs: next };
    });
  };

  const handleEditQuestion = (bankId: string) => {
    setSelectedBankId(bankId);
  };

  const handleAddOneOff = (kind: BlankQuestionKind) => {
    const question = createBlankQuestion(kind, courseId);
    updateArtifact((current) => ({
      ...current,
      questionRefs: [
        ...current.questionRefs,
        { type: "inline", item: question },
      ],
    }));
    setSelectedBankId(question.bankId);
  };

  const commitDraftToAssessment = (draft: QuestionItem) => {
    updateArtifact((current) => ({
      ...current,
      questionRefs: current.questionRefs.map((ref) => {
        const refBankId =
          ref.type === "bank" ? ref.bankId : ref.item.bankId;
        if (refBankId !== draft.bankId) return ref;
        return { type: "inline", item: { ...draft, updatedAt: Date.now() } };
      }),
    }));
  };

  const handleSaveForAssessment = () => {
    if (!editingDraft) return;
    commitDraftToAssessment(editingDraft);
    setSelectedBankId(null);
  };

  const handleSaveToQuestionBank = () => {
    if (!editingDraft) return;
    const saved = { ...editingDraft, updatedAt: Date.now() };
    saveQuestion(saved);
    updateArtifact((current) => ({
      ...current,
      questionRefs: current.questionRefs.map((ref) => {
        const refBankId =
          ref.type === "bank" ? ref.bankId : ref.item.bankId;
        if (refBankId !== saved.bankId) return ref;
        return { type: "bank", bankId: saved.bankId };
      }),
    }));
    setSelectedBankId(null);
  };

  const handleUpdateQuestionDraft = (question: QuestionItem) => {
    setEditSessions((current) => {
      const session = current[question.bankId];
      return {
        ...current,
        [question.bankId]: {
          baseline: session?.baseline ?? cloneQuestionItem(question),
          draft: question,
        },
      };
    });
  };

  // ---- P0 outline canvas handlers (single-save model + sections) ----

  const closeEditor = () => {
    setSelectedBankId(null);
    setSharedSavePromptOpen(false);
  };

  const finishQuestionSave = () => {
    closeEditor();
    setSectionRemovedToastOpen(false);
    sectionUndoRef.current = null;
    setSaveToastOpen(true);
  };

  const dismissSectionRemovedToast = () => {
    setSectionRemovedToastOpen(false);
  };

  const commitDraftInline = (draft: QuestionItem) => {
    const saved = withSavedIdentity(draft);
    updateArtifact((current) =>
      replaceQuestionRef(current, draft.bankId, {
        type: "inline",
        item: saved,
      }),
    );
    setEditSessions((current) => ({
      ...current,
      [saved.bankId]: { draft: saved, baseline: cloneQuestionItem(saved) },
    }));
  };

  const commitForkedQuestion = (draft: QuestionItem) => {
    const forked = forkQuestionItem(draft);
    updateArtifact((current) =>
      replaceQuestionRef(current, draft.bankId, {
        type: "inline",
        item: forked,
      }),
    );
    setEditSessions((current) => {
      const next = { ...current };
      delete next[draft.bankId];
      next[forked.bankId] = {
        draft: forked,
        baseline: cloneQuestionItem(forked),
      };
      return next;
    });
  };

  /** Save commits one-offs directly and prompts for shared / published questions. */
  const handleRequestSave = () => {
    if (!editingDraft) return;
    if (!isQuestionDirty && !editingDraft.neverSaved) {
      closeEditor();
      return;
    }
    if (editingDraft.neverSaved) {
      commitDraftInline(editingDraft);
      finishQuestionSave();
      return;
    }
    if (editingDraft.usedInPublishedUnit) {
      setSavePromptKind("published");
      setSharedSavePromptOpen(true);
      return;
    }
    if (editingDraft.attachedToOtherQuizzes || editingRefType === "bank") {
      setSavePromptKind("shared-unpublished");
      setSharedSavePromptOpen(true);
      return;
    }
    commitDraftInline(editingDraft);
    finishQuestionSave();
  };

  const handleUpdateSharedQuestion = () => {
    if (!editingDraft) return;
    const saved = withSavedIdentity(editingDraft);
    saveQuestion(saved);
    setEditSessions((current) => ({
      ...current,
      [saved.bankId]: { draft: saved, baseline: cloneQuestionItem(saved) },
    }));
    finishQuestionSave();
  };

  const handleSaveCopyInAssessment = () => {
    if (!editingDraft) return;
    commitForkedQuestion(editingDraft);
    finishQuestionSave();
  };

  const handleFocusFromPanel = (bankId: string) => {
    setSelectedBankId(bankId);
  };

  const handleCancelEdits = () => {
    if (!selectedBankId) return;
    setEditSessions((current) => {
      const session = current[selectedBankId];
      if (!session) return current;
      return {
        ...current,
        [selectedBankId]: {
          ...session,
          draft: cloneQuestionItem(session.baseline),
        },
      };
    });
  };

  const handleDiscardUnsaved = (bankId: string) => {
    setEditSessions((current) => {
      const next = { ...current };
      delete next[bankId];
      return next;
    });
    if (selectedBankId === bankId) closeEditor();
    updateArtifact((current) => removeQuestionRef(current, bankId));
  };

  const handleRemoveQuestionById = (bankId: string) => {
    if (selectedBankId === bankId) closeEditor();
    setEditSessions((current) => {
      const next = { ...current };
      delete next[bankId];
      return next;
    });
    updateArtifact((current) => removeQuestionRef(current, bankId));
  };

  const handleMoveQuestion = (bankId: string, target: OutlineDropTarget) => {
    updateArtifact((current) => moveQuestionRef(current, bankId, target));
  };

  const handleAddOneOffTo = (kind: BlankQuestionKind, sectionId: string | null) => {
    const question = createBlankQuestion(kind, courseId);
    updateArtifact((current) =>
      appendQuestionRef(current, { type: "inline", item: question }, sectionId),
    );
    setSelectedBankId(question.bankId);
  };

  const handleAddSection = () => updateArtifact(addSection);

  const handleMoveSectionBy = (sectionId: string, direction: -1 | 1) => {
    updateArtifact((current) => moveSection(current, sectionId, direction));
  };

  const handleInsertSection = (
    sectionId: string,
    position: "above" | "below",
  ) => {
    updateArtifact((current) => insertSection(current, sectionId, position));
  };

  const handleDeleteSection = (sectionId: string) => {
    const sections = artifact.sections ?? [];
    const index = sections.findIndex((entry) => entry.id === sectionId);
    const section = index >= 0 ? sections[index] : undefined;
    if (!section) return;

    const bankIds = new Set(
      section.questionRefs.map((ref) => questionRefId(ref)),
    );
    const sessions: Record<string, QuestionEditSession> = {};
    for (const bankId of bankIds) {
      const session = editSessions[bankId];
      if (session) {
        sessions[bankId] = {
          draft: cloneQuestionItem(session.draft),
          baseline: cloneQuestionItem(session.baseline),
        };
      }
    }

    sectionUndoRef.current = {
      section: structuredClone(section),
      index,
      sessions,
      selectedBankId:
        selectedBankId && bankIds.has(selectedBankId) ? selectedBankId : null,
    };

    if (selectedBankId && bankIds.has(selectedBankId)) {
      closeEditor();
    }
    if (bankIds.size > 0) {
      setEditSessions((current) => {
        const next = { ...current };
        for (const bankId of bankIds) delete next[bankId];
        return next;
      });
    }

    updateArtifact((current) => deleteSection(current, sectionId));
    setSaveToastOpen(false);
    setSectionRemovedToastOpen(true);
  };

  const handleUndoSectionRemove = () => {
    const snapshot = sectionUndoRef.current;
    if (!snapshot) return;
    updateArtifact((current) =>
      insertSectionAt(current, snapshot.section, snapshot.index),
    );
    if (Object.keys(snapshot.sessions).length > 0) {
      setEditSessions((current) => {
        const next = { ...current };
        for (const [bankId, session] of Object.entries(snapshot.sessions)) {
          next[bankId] = {
            draft: cloneQuestionItem(session.draft),
            baseline: cloneQuestionItem(session.baseline),
          };
        }
        return next;
      });
    }
    if (snapshot.selectedBankId) {
      setSelectedBankId(snapshot.selectedBankId);
    }
    sectionUndoRef.current = null;
    dismissSectionRemovedToast();
  };

  const handleUpdateIntro = (patch: Partial<AssessmentIntro>) => {
    updateArtifact((current) => ({
      ...current,
      intro: {
        overviewContent: current.intro?.overviewContent ?? "",
        timeMinutes:
          current.timing?.timeLimitMinutes ?? current.intro?.timeMinutes ?? 45,
        attempts: current.attempts?.maxAttempts ?? current.intro?.attempts,
        title: current.intro?.title,
        ...patch,
      },
    }));
  };

  const handleRemoveIntro = () => {
    updateArtifact((current) => ({
      ...current,
      showIntroScreen: false,
    }));
  };

  return (
    <Lab2Shell
      topNavigationProps={{
        title: p0Aligned ? undefined : `${artifact.lessonName} - ${artifact.title}`,
        subtitle: p0Aligned ? undefined : "In-lab assessment builder",
        currentLevel: artifact.metadata.levelPosition,
        totalLevels: levelLinks?.length ?? artifact.metadata.totalLevelsInScript,
        levelLinks,
        currentLevelPath,
        hideTitle: p0Aligned,
        leadingActions: p0Aligned ? (
          <>
            <Button
              variant="outlined"
              color="secondary"
              size="extraSmall"
              startIconName="arrow-left"
              onClick={() => {
                if (dirtyCount > 0) setLeaveOpen(true);
                else navigate("/levels");
              }}
            >
              Back to Levelbuilder
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              size="extraSmall"
              startIconName="floppy-disk"
            >
              Save
            </Button>
          </>
        ) : undefined,
      }}
      sidebarProps={{
        activeTab,
        setActiveTab,
        sidebarWidth,
        isSettingsOpen,
        setIsSettingsOpen,
        chatMessages,
        setChatMessages,
        chatInput,
        setChatInput,
        selectedHistoryVersion: versionHistory.selectedHistoryVersion,
        setSelectedHistoryVersion: versionHistory.setSelectedHistoryVersion,
        onSaveVersion: versionHistory.handleSaveVersion,
        onRestoreVersion: versionHistory.handleRestoreVersion,
        showRestoreSuccessAlert: versionHistory.showRestoreSuccessAlert,
        setShowRestoreSuccessAlert: versionHistory.setShowRestoreSuccessAlert,
        showSaveSuccessAlert: versionHistory.showSaveSuccessAlert,
        setShowSaveSuccessAlert: versionHistory.setShowSaveSuccessAlert,
        showHistoryTab: false,
        showAiTutorTab: false,
        showBackpackTab: false,
        devPanelFields: builderDevFields,
        devPanelOverrideResult: overrideResult,
        showContinueButton: false,
        collapsible: true,
        defaultCollapsed: false,
        showInstructionsDrawer: false,
        showBuilderTab: true,
        builderPanelContent: (
          <AssessmentBuilderPanel
            activeTab={activeTab}
            artifact={artifact}
            onUpdateArtifact={updateArtifact}
            onAddBankQuestion={handleAddBankQuestion}
            onFocusQuestionInOutline={
              p0Aligned ? handleFocusFromPanel : setSelectedBankId
            }
            p0Aligned={p0Aligned}
          />
        ),
      }}
      onResize={(delta) => {
        setSidebarWidth((prev) => Math.max(300, Math.min(600, prev + delta)));
      }}
    >
      <div className={styles.workspace}>
        <PanelHeader
          label="workspace"
          left={
            <SegmentedButton
              size="extraSmall"
              options={WORKSPACE_MODE_OPTIONS}
              value={workspaceMode}
              onChange={(value) => setWorkspaceMode(value as WorkspaceMode)}
            />
          }
          right={p0Aligned ? <QuizStatusTag artifact={artifact} /> : undefined}
        />
        <div className={styles.workspaceSurface}>
          {workspaceMode === "edit" ? (
            p0Aligned ? (
              <AssessmentOutlineCanvas
                artifact={artifact}
                questionsById={questionsById}
                selectedBankId={selectedBankId}
                dirtyBankIds={dirtyBankIds}
                courseOptions={courseOptions}
                getDomainOptionsForCourse={getDomainOptionsForCourse}
                getUnitOptionsForCourse={getUnitsForCourse}
                onExpandQuestion={setSelectedBankId}
                onCollapseQuestion={closeEditor}
                onRequestSave={handleRequestSave}
                onCancelEdits={handleCancelEdits}
                onDiscardUnsaved={handleDiscardUnsaved}
                onUpdateQuestion={handleUpdateQuestionDraft}
                onRemoveQuestion={handleRemoveQuestionById}
                onMoveQuestion={handleMoveQuestion}
                onMoveSection={handleMoveSectionBy}
                onInsertSection={handleInsertSection}
                onDeleteSection={handleDeleteSection}
                onUpdateIntro={handleUpdateIntro}
                onRemoveIntro={handleRemoveIntro}
                onCreateQuestion={handleAddOneOffTo}
                onAddSection={handleAddSection}
              />
            ) : (
              <AssessmentBuildCanvas
                artifact={artifact}
                questions={canvasQuestions}
                selectedBankId={selectedBankId}
                graded={graded}
                courseOptions={courseOptions}
                getDomainOptionsForCourse={getDomainOptionsForCourse}
                getUnitOptionsForCourse={getUnitsForCourse}
                p0Aligned={p0Aligned}
                isQuestionDirty={isQuestionDirty}
                onEditQuestion={handleEditQuestion}
                onSaveForAssessment={handleSaveForAssessment}
                onSaveToQuestionBank={handleSaveToQuestionBank}
                onUpdateQuestion={handleUpdateQuestionDraft}
                onRemoveQuestion={handleRemoveQuestion}
                onReorderQuestion={handleReorderQuestion}
                onOpenBank={() => setActiveTab("builder-bank")}
                onAddOneOff={handleAddOneOff}
              />
            )
          ) : (
            p0Aligned ? (
              artifact.questionRefs.length === 0 &&
              !resolvedShowIntro(artifact) ? (
                <QuizPreviewEmptyState
                  onBackToBuild={() => setWorkspaceMode("edit")}
                />
              ) : (
                <QuizAttemptWorkspace
                  artifact={artifact}
                  bankQuestions={bankQuestions}
                  embedded
                />
              )
            ) : (
              <AssessmentArtifactWorkspace
                artifact={artifact}
                bankQuestions={bankQuestions}
                stepped={artifact.layout === "stepped"}
                embedded
              />
            )
          )}
        </div>
      </div>
      {p0Aligned && (
        <>
          <SaveQuestionPrompt
            open={sharedSavePromptOpen}
            kind={savePromptKind}
            questionTitle={editingDraft?.title ?? "This question"}
            onUpdateShared={handleUpdateSharedQuestion}
            onSaveCopy={handleSaveCopyInAssessment}
            onCancel={() => setSharedSavePromptOpen(false)}
          />
          <Toast
            open={saveToastOpen}
            placement="topCenter"
            sentiment="success"
            isDismissible
            onClose={() => setSaveToastOpen(false)}
          >
            Question saved
          </Toast>
          <Toast
            open={sectionRemovedToastOpen}
            placement="topCenter"
            sentiment="success"
            isDismissible
            hasAction
            actionLabel="Undo"
            onAction={handleUndoSectionRemove}
            onClose={dismissSectionRemovedToast}
          >
            Section removed
          </Toast>
          <Dialog
            open={leaveOpen}
            title="Leave without saving?"
            description={`${dirtyCount} question${
              dirtyCount === 1 ? " has" : "s have"
            } unsaved changes. If you leave this page now, those changes are lost.`}
            isDismissable
            primaryActionLabel="Keep editing"
            secondaryActionLabel="Leave and discard"
            onPrimaryAction={() => setLeaveOpen(false)}
            onSecondaryAction={() => navigate("/levels")}
            onClose={() => setLeaveOpen(false)}
          />
        </>
      )}
    </Lab2Shell>
  );
}
