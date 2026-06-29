import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Lab2Shell } from "../../../lab2/Lab2Shell";
import {
  SegmentedControl,
  type SegmentedOption,
} from "../../../ui/SegmentedControl";
import { PanelHeader } from "../../../ui/PanelHeader";
import type { LevelProgressLink } from "../../../ui/header/LevelProgressBubbles";
import { initialChatMessages } from "../../../../data/weblab2";
import { useAssessmentBuilderState } from "../../../../hooks/useAssessmentBuilderState";
import { useQuestionBank } from "../../../../hooks/useQuestionBank";
import { useChatState } from "../../../../hooks/useChatState";
import { useLayoutState } from "../../../../hooks/useLayoutState";
import { useVersionHistoryState } from "../../../../hooks/useVersionHistoryState";
import {
  cloneQuestionItem,
  createBlankQuestion,
  getAllCourseBanksSnapshot,
  isQuestionDraftDirty,
  type BlankQuestionKind,
} from "../../../../lib/assessmentBuilder";
import type { QuestionItem } from "../../../../types/assessmentBuilder";
import { AssessmentBuilderPanel } from "./AssessmentBuilderPanel";
import { AssessmentBuildCanvas } from "./AssessmentBuildCanvas";
import { AssessmentArtifactWorkspace } from "./AssessmentArtifactWorkspace";
import styles from "./AssessmentBuilderWorkspace.module.scss";

type WorkspaceMode = "edit" | "preview";

const WORKSPACE_MODE_OPTIONS: SegmentedOption<WorkspaceMode>[] = [
  { value: "edit", label: "Build", iconName: "pen-to-square" },
  { value: "preview", label: "Preview", iconName: "eye" },
];

interface AssessmentBuilderWorkspaceProps {
  assessmentId: string;
  levelLinks?: LevelProgressLink[];
  currentLevelPath?: string;
}

export function AssessmentBuilderWorkspace({
  assessmentId,
  levelLinks,
  currentLevelPath,
}: AssessmentBuilderWorkspaceProps) {
  const { artifact, bankQuestions, resolvedQuestions, updateArtifact } =
    useAssessmentBuilderState(assessmentId);
  const { saveQuestion } = useQuestionBank(artifact?.courseId ?? "aif-cert");

  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<QuestionItem | null>(null);
  const [editingBaseline, setEditingBaseline] = useState<QuestionItem | null>(null);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("edit");

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
    const bank = allCourseBanks.find((entry) => entry.courseId === courseId);
    return (bank?.domains ?? []).map((domain) => ({
      value: domain.id,
      label: domain.label,
    }));
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
  const graded = artifact.mode !== "survey" && artifact.surveyMode !== true;

  const handleAddBankQuestion = (bankId: string) => {
    updateArtifact((current) => ({
      ...current,
      questionRefs: [...current.questionRefs, { type: "bank", bankId }],
    }));
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

  return (
    <Lab2Shell
      topNavigationProps={{
        title: `${artifact.lessonName} - ${artifact.title}`,
        subtitle: "In-lab assessment builder",
        currentLevel: artifact.metadata.levelPosition,
        totalLevels: artifact.metadata.totalLevelsInScript,
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
            onFocusQuestionInOutline={setSelectedBankId}
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
            <SegmentedControl<WorkspaceMode>
              options={WORKSPACE_MODE_OPTIONS}
              value={workspaceMode}
              onChange={(value) => setWorkspaceMode(value)}
            />
          }
        />
        <div className={styles.workspaceSurface}>
          {workspaceMode === "edit" ? (
            <AssessmentBuildCanvas
              artifact={artifact}
              questions={canvasQuestions}
              selectedBankId={selectedBankId}
              graded={graded}
              courseOptions={courseOptions}
              getDomainOptionsForCourse={getDomainOptionsForCourse}
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
    </Lab2Shell>
  );
}
