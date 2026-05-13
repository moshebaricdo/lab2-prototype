import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { ChatMessage } from "../../../types/chat";
import type { FileItem } from "../../../types/file";
import type { TutorRequestMode, TutorStartOptions } from "../../../types/tutor";
import { PROJECT_PLAN_FILE } from "../../../lib/tutor/planningRunner";
import { tutorClient } from "../../../lib/tutor/tutorClient";
import { pathBasename } from "../../../utils/fileTree";
import {
  findFileEntryInTree,
  hasAcceptedCompletedPlanStatus,
  hasNonPlanProjectFiles,
  isPlanOnlyTutorChange,
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
  additionalTutorPrompt: string;
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
  additionalTutorPrompt,
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

  const handleTutorSubmit = useCallback(async (
    message: string,
    conversation: ChatMessage[],
    requestMode: TutorRequestMode = "auto",
  ) => {
    const wasEmptyOrPlanOnlyProject = !hasNonPlanProjectFiles(currentFileStructure);
    const result = await tutorClient({
      message,
      conversation,
      files: currentFileStructure,
      additionalSystemPrompt: additionalTutorPrompt,
      requestMode,
    });

    if (result.changes.length > 0) {
      const isPlanOnlyChange = isPlanOnlyTutorChange(result.changes);
      const shouldSwitchToPreviewAfterPlanBuild =
        buildFromPlanRequestRef.current && !isPlanOnlyChange && useFilePreview;
      buildFromPlanRequestRef.current = false;
      setIsFileManagerCollapsed(false);
      beginAiProposal(result.changes);
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
    additionalTutorPrompt,
    beginAiProposal,
    currentFileStructure,
    openFile,
    setIsFileManagerCollapsed,
    setViewMode,
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
