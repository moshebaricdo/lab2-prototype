import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { ChatMessage } from "../../../types/chat";
import type { FileItem } from "../../../types/file";
import type { LevelProgressSnapshot } from "../../../types/validationReview";
import type { TutorRunnerContracts } from "../../../lib/tutor/runnerContracts";
import type {
  TutorPolicy,
  TutorRequestMode,
  TutorStartOptions,
  TutorSubmitOptions,
  TutorSupportContext,
  InstructionGuide,
  InstructionGuideState,
} from "../../../types/tutor";
import { runEditClarification } from "../../../lib/tutor/editClarificationRunner";
import type { ValidationReviewCardData } from "../../../types/validationReview";
import { PROJECT_PLAN_FILE } from "../../../lib/tutor/planningRunner";
import { tutorClient } from "../../../lib/tutor/tutorClient";
import { resolveTutorAction } from "../../../lib/tutor/tutorAction";
import { resolveInstructionCoachResponse } from "../../../lib/tutor/instructionCoach";
import { logTutorEvent } from "../../../lib/tutor/tutorDebugLogger";
import { pathBasename } from "../../../utils/fileTree";
import {
  findFileEntryInTree,
  hasAcceptedCompletedPlanStatus,
  hasWorkspaceProjectFiles,
  isPlanOnlyTutorChange,
  isPlanFilePath,
} from "./webLab2FileTree";

const STARTER_PROJECT_TUTOR_PROMPT =
  "Help me start a new web project. Suggest a simple HTML, CSS, and JavaScript starter structure and create the first files for me.";
const OPEN_TUTOR_PANEL_EVENT = "weblab:open-tutor-panel";
const TUTOR_PANEL_READY_EVENT = "weblab:tutor-panel-ready";
const FOCUS_TUTOR_INPUT_EVENT = "weblab:focus-tutor-input";

interface UseWebLab2TutorFlowOptions {
  chatMessages: ChatMessage[];
  setChatMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  setChatInput: (input: string) => void;
  currentFileStructure: FileItem[];
  runnerContracts: TutorRunnerContracts;
  levelInstructionsMarkdown: string;
  levelProgress?: LevelProgressSnapshot;
  instructionGuide?: InstructionGuide;
  instructionGuideState?: InstructionGuideState;
  onInstructionGuideStateChange?: (state: InstructionGuideState) => void;
  tutorSupportContext: TutorSupportContext;
  tutorPolicy: TutorPolicy;
  routingDiagnostics?: boolean;
  validationReviewOffer?: ValidationReviewCardData;
  useFilePreview: boolean;
  selectedPlanPath: string;
  hasPendingAiChanges: boolean;
  beginAiProposal: (changes: {
    fileName: string;
    status: "new" | "modified" | "deleted";
    content?: string;
  }[]) => void;
  acceptAiProposal: () => FileItem[];
  rejectAiProposal: () => void;
  handleSaveAiVersion: (fileStructure: FileItem[], saveTitle?: string) => void;
  openFile: (file: FileItem) => void;
  setActiveTab: (tab: "ai-tutor") => void;
  setIsFileManagerCollapsed: (collapsed: boolean) => void;
  setViewMode: (mode: "code" | "preview" | "split") => void;
}

export function useWebLab2TutorFlow({
  chatMessages,
  setChatMessages,
  setChatInput,
  currentFileStructure,
  runnerContracts,
  levelInstructionsMarkdown,
  levelProgress,
  instructionGuide,
  instructionGuideState,
  onInstructionGuideStateChange,
  tutorSupportContext,
  tutorPolicy,
  routingDiagnostics = true,
  validationReviewOffer,
  useFilePreview,
  selectedPlanPath,
  hasPendingAiChanges,
  beginAiProposal,
  acceptAiProposal,
  rejectAiProposal,
  handleSaveAiVersion,
  openFile,
  setActiveTab,
  setIsFileManagerCollapsed,
  setViewMode,
}: UseWebLab2TutorFlowOptions) {
  const [isTutorRequestRunning, setIsTutorRequestRunning] = useState(false);
  const [tutorRequestMode, setTutorRequestMode] =
    useState<TutorRequestMode>("auto");
  const [
    newProjectPlanQuestionnaireSignal,
    setNewProjectPlanQuestionnaireSignal,
  ] = useState(0);
  const [buildingPlanPath, setBuildingPlanPath] = useState<string | null>(null);
  const [builtPlanPaths, setBuiltPlanPaths] = useState<Set<string>>(() => new Set());
  const buildFromPlanRequestRef = useRef(false);

  const hasActivePlan = useCallback((files: FileItem[], parentPath = ""): boolean => {
    return files.some((file) => {
      const path = parentPath ? `${parentPath}/${file.name}` : file.name;
      if (file.children) {
        return hasActivePlan(file.children, path);
      }
      if (!isPlanFilePath(path)) return false;
      const content = file.proposedStatus && file.proposedStatus !== "deleted"
        ? file.proposedContent ?? ""
        : file.content ?? "";
      return !/\bStatus:\s*Completed\b/i.test(content);
    });
  }, []);

  const didLastAssistantAskPlanningQuestion = useCallback((conversation: ChatMessage[]) => {
    const lastAssistantMessage = [...conversation]
      .reverse()
      .find((message) => message.role === "assistant" && !message.isAlert);
    if (!lastAssistantMessage?.content.includes("?")) return false;
    return /\b(plan|project|idea|audience|feature|style|interaction|question|before\s+building|before\s+we\s+build)\b/i
      .test(lastAssistantMessage.content);
  }, []);

  const didLastAssistantSuggestEditableWork = useCallback((conversation: ChatMessage[]) => {
    const lastAssistantMessage = [...conversation]
      .reverse()
      .find((message) => message.role === "assistant" && !message.isAlert);
    if (!lastAssistantMessage) return false;
    if (lastAssistantMessage.fileChanges?.length || lastAssistantMessage.validationReview) {
      return false;
    }
    return /\b(style\.css|index\.html|script\.js|selector|button|link|hover|focus|style|spacing|color|colour|background|padding|margin|border|class|id)\b/i
      .test(lastAssistantMessage.content);
  }, []);

  const buildValidationOfferMessage = useCallback((
    submittedContent: string,
    review: ValidationReviewCardData,
  ) => {
    const hasMultipleRequirements = (review.requirements?.length ?? 0) > 1;

    if (/\b(works|worked|working|fixed|done|finished|complete|completed)\b/i.test(submittedContent)) {
      return "Great. I can check your work now and let you know whether you're ready to continue.";
    }

    if (/\b(check|review|validate|grade)\b/i.test(submittedContent)) {
      return hasMultipleRequirements
        ? "I can check your progress and show what looks complete and what to work on next."
        : "I can check your work and let you know whether you're ready to continue.";
    }

    return "When you're ready, I can check your work and let you know whether you're ready to continue.";
  }, []);

  const handleTutorSubmit = useCallback(async (
    message: string,
    conversation: ChatMessage[],
    requestMode: TutorRequestMode = "auto",
    options: TutorSubmitOptions = {},
  ) => {
    const workflow = {
      hasActivePlan: hasActivePlan(currentFileStructure),
      lastAssistantAskedPlanningQuestion: didLastAssistantAskPlanningQuestion(conversation),
      lastAssistantSuggestedEditableWork: didLastAssistantSuggestEditableWork(conversation),
      hasPendingProposal: hasPendingAiChanges,
      skipEditClarification: options.skipEditClarification,
    };
    const action = resolveTutorAction({
      message,
      requestMode,
      policy: tutorPolicy,
      workflow,
    });

    if (routingDiagnostics) {
      logTutorEvent("ui action resolved", {
        requestMode,
        action,
        policy: tutorPolicy,
        workflow,
        messagePreview: message.slice(0, 180),
        conversationTurns: conversation.length,
      });
    }

    const instructionCoachResult = action.kind === "guidance"
      ? resolveInstructionCoachResponse({
          message,
          guide: instructionGuide,
          guideState: instructionGuideState,
        })
      : null;
    const instructionFocus = instructionCoachResult?.instructionFocus;
    if (instructionCoachResult && instructionGuide) {
      logTutorEvent("instruction coach handled student message", {
        messagePreview: message.slice(0, 180),
        guideType: instructionGuide.type,
        nextState: instructionCoachResult.guideState,
        instructionFocus,
      });
      onInstructionGuideStateChange?.(instructionCoachResult.guideState);
    }

    if (action.kind === "validationReview" && validationReviewOffer) {
      logTutorEvent("validation review offer returned", {
        title: validationReviewOffer.title,
        status: validationReviewOffer.status,
      });
      return {
        role: "assistant",
        content: buildValidationOfferMessage(message, validationReviewOffer),
        validationReview: validationReviewOffer,
      } satisfies ChatMessage;
    }

    if (action.kind === "validationReview" || action.kind === "denied") {
      logTutorEvent("tutor action stopped before model call", {
        actionKind: action.kind,
        message: action.message,
      }, action.kind === "denied" ? "warn" : "info");
      return {
        role: "assistant",
        content: action.message,
      } satisfies ChatMessage;
    }

    if (action.kind === "editClarification") {
      const clarification = await runEditClarification({
        message,
        conversation,
        files: currentFileStructure,
        additionalSystemPrompt: runnerContracts.build ?? "",
        levelInstructionsMarkdown,
        levelProgress,
        supportContext: tutorSupportContext,
      });
      logTutorEvent("edit clarification result received", {
        messagePreview: message.slice(0, 180),
        hasEditOptions: Boolean(clarification.editOptions),
        optionCount: clarification.editOptions?.options.length ?? 0,
        introLength: clarification.message.length,
      });
      return {
        role: "assistant",
        content: clarification.message,
        editOptions: clarification.editOptions,
      } satisfies ChatMessage;
    }

    const resolvedRequestMode: TutorRequestMode =
      action.kind === "edit" ? "build" : action.kind === "plan" ? "plan" : "help";
    const wasEmptyOrPlanOnlyProject = !hasWorkspaceProjectFiles(currentFileStructure);
    const result = await tutorClient({
      message,
      conversation,
      files: currentFileStructure,
      runnerContracts,
      levelInstructionsMarkdown,
      levelProgress,
      instructionFocus,
      requestMode: resolvedRequestMode,
      supportContext: tutorSupportContext,
    });
    logTutorEvent("functional tutor result received", {
      resolvedRequestMode,
      changeCount: result.changes.length,
      changes: result.changes.map((change) => ({
        fileName: change.fileName,
        status: change.status,
        linesAdded: change.linesAdded,
        linesRemoved: change.linesRemoved,
      })),
      hasSaveTitle: Boolean(result.saveTitle),
      messageLength: result.message.length,
    });

    if (result.changes.length > 0) {
      const isPlanOnlyChange = isPlanOnlyTutorChange(result.changes);
      const shouldSwitchToPreviewAfterPlanBuild =
        buildFromPlanRequestRef.current && !isPlanOnlyChange && useFilePreview;
      buildFromPlanRequestRef.current = false;
      setIsFileManagerCollapsed(false);
      beginAiProposal(result.changes);
      logTutorEvent("ai proposal started", {
        isPlanOnlyChange,
        changeCount: result.changes.length,
        shouldSwitchToPreviewAfterPlanBuild,
        wasEmptyOrPlanOnlyProject,
      });
      if (isPlanOnlyChange) {
        setViewMode("code");
        openFile({
          name: pathBasename(PROJECT_PLAN_FILE),
          type: "text",
          content: "",
          proposedContent: result.changes[0].content ?? "",
          proposedStatus: result.changes[0].status,
        });
      } else if (shouldSwitchToPreviewAfterPlanBuild || (wasEmptyOrPlanOnlyProject && useFilePreview)) {
        setViewMode("preview");
      }
    } else {
      buildFromPlanRequestRef.current = false;
    }

    return {
      role: "assistant",
      content: result.message,
      fileChanges: result.changes.length > 0
        ? result.changes.map(({ fileName, status, linesAdded, linesRemoved }) => ({
            fileName,
            status,
            linesAdded,
            linesRemoved,
          }))
        : undefined,
      aiSaveTitle: result.changes.length > 0 ? result.saveTitle : undefined,
      codeChangeStatus: result.changes.length > 0 ? "pending" : undefined,
    } satisfies ChatMessage;
  }, [
    beginAiProposal,
    buildValidationOfferMessage,
    currentFileStructure,
    didLastAssistantAskPlanningQuestion,
    didLastAssistantSuggestEditableWork,
    hasActivePlan,
    hasPendingAiChanges,
    levelInstructionsMarkdown,
    levelProgress,
    instructionGuide,
    instructionGuideState,
    onInstructionGuideStateChange,
    openFile,
    routingDiagnostics,
    runnerContracts,
    setIsFileManagerCollapsed,
    setViewMode,
    tutorPolicy,
    tutorSupportContext,
    validationReviewOffer,
    useFilePreview,
  ]);

  const handleBuildCurrentPlan = useCallback(() => {
    if (isTutorRequestRunning || hasPendingAiChanges) return;
    const buildPrompt =
      `Build the project described in ${selectedPlanPath}. Update the plan status and check off the completed items as part of the proposal.`;
    const userMessage: ChatMessage = {
      role: "user",
      content: buildPrompt,
    };
    const nextMessages = [...chatMessages, userMessage];
    buildFromPlanRequestRef.current = true;
    setBuildingPlanPath(selectedPlanPath);
    logTutorEvent("build plan action started", {
      selectedPlanPath,
      conversationTurns: nextMessages.length,
    });
    setActiveTab("ai-tutor");
    window.dispatchEvent(new CustomEvent(OPEN_TUTOR_PANEL_EVENT));
    setTutorRequestMode("auto");
    setChatMessages(nextMessages);
    setIsTutorRequestRunning(true);
    void handleTutorSubmit(buildPrompt, nextMessages, "build")
      .then((assistantMessage) => {
        if (!assistantMessage) return;
        setChatMessages([...nextMessages, assistantMessage]);
      })
      .catch((error) => {
        logTutorEvent("build plan action failed", error, "error");
        console.error("[WebLab2LevelPage] Build plan request failed", error);
        buildFromPlanRequestRef.current = false;
        setChatMessages([
          ...nextMessages,
          {
            role: "assistant",
            content: "I had trouble starting the build from your plan. Try again in a moment.",
          },
        ]);
      })
      .finally(() => {
        setBuildingPlanPath(null);
        setIsTutorRequestRunning(false);
      });
  }, [
    chatMessages,
    handleTutorSubmit,
    hasPendingAiChanges,
    isTutorRequestRunning,
    selectedPlanPath,
    setActiveTab,
    setChatMessages,
  ]);

  const handleAcceptAiChanges = useCallback((saveTitle?: string) => {
    logTutorEvent("proposal accepted", {
      saveTitle,
      selectedPlanPath,
    });
    const acceptedFileStructure = acceptAiProposal();
    const acceptedPlan = findFileEntryInTree(acceptedFileStructure, selectedPlanPath);
    if (hasAcceptedCompletedPlanStatus(acceptedPlan?.file)) {
      setBuiltPlanPaths((current) => {
        const next = new Set(current);
        next.add(acceptedPlan?.path ?? selectedPlanPath);
        return next;
      });
    }
    handleSaveAiVersion(acceptedFileStructure, saveTitle);
  }, [acceptAiProposal, handleSaveAiVersion, selectedPlanPath]);

  const handleBannerAiChangeAction = useCallback((action: "accepted" | "rejected") => {
    const pendingMessage = chatMessages.find(
      (message) => message.codeChangeStatus === "pending" && message.fileChanges,
    );
    if (!pendingMessage) return;
    logTutorEvent("proposal banner action", {
      action,
      fileChanges: pendingMessage.fileChanges,
      saveTitle: pendingMessage.aiSaveTitle,
    });

    if (action === "accepted") {
      handleAcceptAiChanges(pendingMessage.aiSaveTitle);
    } else {
      rejectAiProposal();
    }

    setChatMessages((current) => {
      const pendingIndex = current.findIndex(
        (message) => message.codeChangeStatus === "pending" && message.fileChanges,
      );
      if (pendingIndex === -1) return current;

      const updated = current.map((message, index) => {
        if (index !== pendingIndex) return message;
        return { ...message, codeChangeStatus: action };
      });
      const alertMessage: ChatMessage = {
        role: "assistant",
        content:
          action === "accepted"
            ? "You accepted this suggestion."
            : "You dismissed this suggestion.",
        isAlert: true,
        alertVariant: action === "accepted" ? "accepted" : "rejected",
      };
      return [...updated, alertMessage];
    });
  }, [chatMessages, handleAcceptAiChanges, rejectAiProposal, setChatMessages]);

  const handleAddFileToTutor = useCallback((file: FileItem, path: string) => {
    logTutorEvent("project file attached to tutor", {
      name: file.name,
      path,
      type: file.type,
    });
    setActiveTab("ai-tutor");
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("weblab:add-project-file-to-tutor", {
        detail: {
          name: file.name,
          path,
        },
      }));
    }, 0);
  }, [setActiveTab]);

  const handleStartWithTutor = useCallback((
    prompt = STARTER_PROJECT_TUTOR_PROMPT,
    requestMode: TutorRequestMode = "auto",
    options?: TutorStartOptions,
  ) => {
    logTutorEvent("start with tutor action", {
      requestMode,
      flow: options?.flow,
      promptPreview: prompt.slice(0, 180),
    });
    setActiveTab("ai-tutor");
    if (options?.flow === "new-project-plan-questionnaire") {
      setTutorRequestMode("plan");
      setChatInput("");
      setNewProjectPlanQuestionnaireSignal((signal) => signal + 1);
    } else {
      setTutorRequestMode(requestMode);
      if (chatMessages.some((message) => message.newProjectPlanQuestionnaire)) {
        setChatMessages([]);
      }
      setChatInput(prompt);
      const focusTutorInput = () => {
        window.dispatchEvent(new CustomEvent(FOCUS_TUTOR_INPUT_EVENT));
      };
      window.addEventListener(TUTOR_PANEL_READY_EVENT, focusTutorInput, {
        once: true,
      });
    }
    window.dispatchEvent(new CustomEvent(OPEN_TUTOR_PANEL_EVENT));
  }, [chatMessages, setActiveTab, setChatInput, setChatMessages]);

  return {
    builtPlanPaths,
    buildingPlanPath,
    handleAcceptAiChanges,
    handleAddFileToTutor,
    handleBannerAiChangeAction,
    handleBuildCurrentPlan,
    handleStartWithTutor,
    handleTutorSubmit,
    isTutorRequestRunning,
    newProjectPlanQuestionnaireSignal,
    rejectAiProposal,
    setIsTutorRequestRunning,
    setTutorRequestMode,
    tutorRequestMode,
  };
}
