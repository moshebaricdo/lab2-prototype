import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { SegmentedButton } from "@moshebaricdo/cads-react";
import { Lab2Shell } from "../../../lab2/Lab2Shell";
import { PanelHeader } from "../../../ui/PanelHeader";
import type { LevelProgressLink } from "../../../ui/header/LevelProgressBubbles";
import { initialChatMessages } from "../../../../data/weblab2";
import { useAssessmentBuilderState } from "../../../../hooks/useAssessmentBuilderState";
import { useQuestionBank } from "../../../../hooks/useQuestionBank";
import { useChatState } from "../../../../hooks/useChatState";
import { useLayoutState } from "../../../../hooks/useLayoutState";
import { useVersionHistoryState } from "../../../../hooks/useVersionHistoryState";
import {
  addSection,
  appendQuestionRef,
  cloneQuestionItem,
  createBlankQuestion,
  createDefaultExamIntro,
  deleteSection,
  getAllCourseBanksSnapshot,
  getConceptOptionsForCourse,
  getUnitOptionsForCourse,
  isQuestionDraftDirty,
  moveQuestionRef,
  moveSection,
  moveSectionToIndex,
  questionRefId,
  removeQuestionRef,
  replaceQuestionRef,
  ungroupSection,
  type BlankQuestionKind,
  type OutlineDropTarget,
} from "../../../../lib/assessmentBuilder";
import type { QuestionItem } from "../../../../types/assessmentBuilder";
import { AssessmentBuilderPanel } from "./AssessmentBuilderPanel";
import { AssessmentBuildCanvas } from "./AssessmentBuildCanvas";
import { AssessmentOutlineCanvas } from "./AssessmentOutlineCanvas";
import { AssessmentArtifactWorkspace } from "./AssessmentArtifactWorkspace";
import { SaveQuestionPrompt } from "./SaveQuestionPrompt";
import styles from "./AssessmentBuilderWorkspace.module.scss";

type WorkspaceMode = "edit" | "preview";

const WORKSPACE_MODE_OPTIONS = [
  { value: "edit", label: "Build", iconName: "pen-to-square" as const },
  { value: "preview", label: "Preview", iconName: "eye" as const },
];

interface AssessmentBuilderWorkspaceProps {
  assessmentId: string;
  levelLinks?: LevelProgressLink[];
  currentLevelPath?: string;
  /** P0-aligned authoring: CFU/exam only; course/unit/concept tags; no survey, shuffle, or difficulty. */
  p0Aligned?: boolean;
}

export function AssessmentBuilderWorkspace({
  assessmentId,
  levelLinks,
  currentLevelPath,
  p0Aligned = false,
}: AssessmentBuilderWorkspaceProps) {
  const { artifact, bankQuestions, resolvedQuestions, updateArtifact } =
    useAssessmentBuilderState(assessmentId);
  const { saveQuestion } = useQuestionBank(artifact?.courseId ?? "aif-cert");

  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<QuestionItem | null>(null);
  const [editingBaseline, setEditingBaseline] = useState<QuestionItem | null>(null);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("edit");
  const [sharedSavePromptOpen, setSharedSavePromptOpen] = useState(false);
  /** Section that bank adds should land in (set by a section's add row). */
  const [bankTargetSectionId, setBankTargetSectionId] = useState<string | null>(null);

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
    if (!selectedBankId) {
      setEditingDraft(null);
      setEditingBaseline(null);
      return;
    }

    const question = resolvedQuestions.find(
      (entry) => entry.bankId === selectedBankId,
    );
    if (!question) {
      setEditingDraft(null);
      setEditingBaseline(null);
      return;
    }

    const baseline = cloneQuestionItem(question);
    setEditingBaseline(baseline);
    setEditingDraft(baseline);
  }, [selectedBankId, resolvedQuestions]);

  const canvasQuestions = useMemo(() => {
    if (!selectedBankId || !editingDraft) return resolvedQuestions;
    return resolvedQuestions.map((question) =>
      question.bankId === selectedBankId ? editingDraft : question,
    );
  }, [editingDraft, resolvedQuestions, selectedBankId]);

  const questionsById = useMemo(
    () => new Map(canvasQuestions.map((question) => [question.bankId, question])),
    [canvasQuestions],
  );

  /** Provenance of the question being edited — drives the single-save flow. */
  const editingRefType = useMemo<"bank" | "inline" | null>(() => {
    if (!artifact || !selectedBankId) return null;
    const ref = artifact.questionRefs.find(
      (entry) => questionRefId(entry) === selectedBankId,
    );
    return ref?.type ?? null;
  }, [artifact, selectedBankId]);

  const isQuestionDirty = isQuestionDraftDirty(editingBaseline, editingDraft);

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

  const handleAddBankQuestion = (bankId: string) => {
    if (p0Aligned) {
      const target = artifact.sections?.some(
        (section) => section.id === bankTargetSectionId,
      )
        ? bankTargetSectionId
        : null;
      updateArtifact((current) =>
        appendQuestionRef(current, { type: "bank", bankId }, target),
      );
    } else {
      updateArtifact((current) => ({
        ...current,
        questionRefs: [...current.questionRefs, { type: "bank", bankId }],
      }));
    }
    setSelectedBankId(bankId);
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
    setEditingDraft(question);
  };

  // ---- P0 outline canvas handlers (single-save model + sections) ----

  const closeEditor = () => {
    setSelectedBankId(null);
    setSharedSavePromptOpen(false);
  };

  const commitDraftInline = (draft: QuestionItem) => {
    updateArtifact((current) =>
      replaceQuestionRef(current, draft.bankId, {
        type: "inline",
        item: { ...draft, updatedAt: Date.now() },
      }),
    );
  };

  /** Done when clean; Save commits one-offs directly and prompts for shared questions. */
  const handleRequestSave = () => {
    if (!editingDraft || !isQuestionDirty) {
      closeEditor();
      return;
    }
    if (editingRefType === "bank") {
      setSharedSavePromptOpen(true);
      return;
    }
    commitDraftInline(editingDraft);
    closeEditor();
  };

  const handleUpdateSharedQuestion = () => {
    if (!editingDraft) return;
    saveQuestion({ ...editingDraft, updatedAt: Date.now() });
    closeEditor();
  };

  const handleSaveCopyInAssessment = () => {
    if (!editingDraft) return;
    commitDraftInline(editingDraft);
    closeEditor();
  };

  const handleAddDraftToBank = () => {
    if (!editingDraft) return;
    const saved = { ...editingDraft, updatedAt: Date.now() };
    saveQuestion(saved);
    updateArtifact((current) =>
      replaceQuestionRef(current, saved.bankId, {
        type: "bank",
        bankId: saved.bankId,
      }),
    );
    closeEditor();
  };

  const handleFocusFromPanel = (bankId: string) => {
    if (
      selectedBankId &&
      selectedBankId !== bankId &&
      isQuestionDirty &&
      !window.confirm("Discard unsaved changes to the open question?")
    ) {
      return;
    }
    setSelectedBankId(bankId);
  };

  const handleRemoveQuestionById = (bankId: string) => {
    if (selectedBankId === bankId) closeEditor();
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

  const handleOpenBankFor = (sectionId: string | null) => {
    setBankTargetSectionId(sectionId);
    setActiveTab("builder-bank");
  };

  const handleAddSection = () => updateArtifact(addSection);

  const handleMoveSectionBy = (sectionId: string, direction: -1 | 1) => {
    updateArtifact((current) => moveSection(current, sectionId, direction));
  };

  const handleMoveSectionToIndex = (sectionId: string, index: number) => {
    updateArtifact((current) => moveSectionToIndex(current, sectionId, index));
  };

  const handleUngroupSection = (sectionId: string) => {
    updateArtifact((current) => ungroupSection(current, sectionId));
  };

  const handleDeleteSection = (sectionId: string) => {
    const section = artifact.sections?.find((entry) => entry.id === sectionId);
    if (
      selectedBankId &&
      section?.questionRefs.some((ref) => questionRefId(ref) === selectedBankId)
    ) {
      closeEditor();
    }
    updateArtifact((current) => deleteSection(current, sectionId));
  };

  const handleAddIntro = () => {
    updateArtifact((current) => ({
      ...current,
      intro: createDefaultExamIntro(current),
    }));
  };

  const handleRemoveIntro = () => {
    updateArtifact((current) => ({ ...current, intro: undefined }));
  };

  const handleUpdateIntroContent = (overviewContent: string) => {
    updateArtifact((current) => ({
      ...current,
      intro: {
        overviewContent,
        timeMinutes:
          current.timing?.timeLimitMinutes ?? current.intro?.timeMinutes ?? 45,
        attempts: current.attempts?.maxAttempts ?? current.intro?.attempts,
      },
    }));
  };

  return (
    <Lab2Shell
      topNavigationProps={{
        title: `${artifact.lessonName} - ${artifact.title}`,
        subtitle: p0Aligned
          ? "P0 assessment builder (CFU + exam)"
          : "In-lab assessment builder",
        currentLevel: artifact.metadata.levelPosition,
        totalLevels: levelLinks?.length ?? artifact.metadata.totalLevelsInScript,
        levelLinks,
        currentLevelPath,
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
          label="Outline"
          left={
            <SegmentedButton
              size="extraSmall"
              options={WORKSPACE_MODE_OPTIONS}
              value={workspaceMode}
              onChange={(value) => setWorkspaceMode(value as WorkspaceMode)}
            />
          }
        />
        <div className={styles.workspaceSurface}>
          {workspaceMode === "edit" ? (
            p0Aligned ? (
              <AssessmentOutlineCanvas
                artifact={artifact}
                questionsById={questionsById}
                selectedBankId={selectedBankId}
                isQuestionDirty={isQuestionDirty}
                courseOptions={courseOptions}
                getDomainOptionsForCourse={getDomainOptionsForCourse}
                getUnitOptionsForCourse={getUnitsForCourse}
                onExpandQuestion={setSelectedBankId}
                onCloseEditor={closeEditor}
                onRequestSave={handleRequestSave}
                onAddDraftToBank={handleAddDraftToBank}
                onUpdateQuestion={handleUpdateQuestionDraft}
                onRemoveQuestion={handleRemoveQuestionById}
                onMoveQuestion={handleMoveQuestion}
                onAddSection={handleAddSection}
                onMoveSection={handleMoveSectionBy}
                onMoveSectionToIndex={handleMoveSectionToIndex}
                onUngroupSection={handleUngroupSection}
                onDeleteSection={handleDeleteSection}
                onAddOneOff={handleAddOneOffTo}
                onOpenBank={handleOpenBankFor}
                onAddIntro={handleAddIntro}
                onRemoveIntro={handleRemoveIntro}
                onUpdateIntroContent={handleUpdateIntroContent}
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
            <AssessmentArtifactWorkspace
              artifact={artifact}
              bankQuestions={bankQuestions}
              stepped={artifact.layout === "stepped"}
              embedded
            />
          )}
        </div>
      </div>
      {p0Aligned && (
        <SaveQuestionPrompt
          open={sharedSavePromptOpen}
          questionTitle={editingDraft?.title ?? "This question"}
          onUpdateShared={handleUpdateSharedQuestion}
          onSaveCopy={handleSaveCopyInAssessment}
          onCancel={() => setSharedSavePromptOpen(false)}
        />
      )}
    </Lab2Shell>
  );
}
