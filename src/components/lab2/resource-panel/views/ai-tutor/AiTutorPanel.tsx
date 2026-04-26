import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from "react";
import { InstructionsDrawer } from "../../InstructionsDrawer";
import type { InstructionsDrawerVisualCue } from "../../InstructionsDrawer";
import type { ChatAttachment, ChatMessage } from "../../../../../types/chat";
import type {
  AiTutorInputExperiment,
  MockTutorConfig,
  TutorContextFile,
  TutorSubmitHandler,
} from "../../../../../types/tutor";
import { AiTutorComposer } from "./AiTutorComposer";
import { AiTutorMessageList } from "./AiTutorMessageList";
import {
  buildAttachmentsForSend,
  buildUniqueUploadPath,
  buildUnreadableUploadAttachment,
  buildUploadedAttachment,
} from "./attachmentUtils";
import styles from "./AiTutorPanel.module.scss";

interface CodeAttachmentContext {
  content: string;
  startLine: number;
  endLine: number;
  fileName: string;
}

interface AiTutorPanelProps {
  chatMessages: ChatMessage[];
  setChatMessages: (messages: ChatMessage[]) => void;
  chatInput: string;
  setChatInput: (input: string) => void;
  showInstructionsDrawer?: boolean;
  instructionsDrawerInitialHeightRatio?: number;
  instructionsDrawerVisualCue?: InstructionsDrawerVisualCue;
  inputExperiment?: AiTutorInputExperiment;
  mockTutorConfig?: MockTutorConfig;
  onAddFileToProject?: (fileName: string) => void;
  instructionsContent?: ReactNode;
  onTutorSubmit?: TutorSubmitHandler;
  onAcceptAiChanges?: () => void;
  onRejectAiChanges?: () => void;
  availableContextFiles?: TutorContextFile[];
  onRequestRunningChange?: (isRunning: boolean) => void;
  clearChatSignal?: number;
}

function resolveSeedConversation(
  seedConversation: MockTutorConfig["seedConversation"],
  firstUserMessage: string,
) {
  if (!seedConversation) return null;
  return typeof seedConversation === "function"
    ? seedConversation(firstUserMessage)
    : seedConversation;
}

function resolveMockResponse(
  response: MockTutorConfig["response"],
  input: string,
  conversation: ChatMessage[],
) {
  if (!response) return undefined;
  return typeof response === "function" ? response(input, conversation) : response;
}

export function AiTutorPanel({
  chatMessages,
  setChatMessages,
  chatInput,
  setChatInput,
  showInstructionsDrawer = true,
  instructionsDrawerInitialHeightRatio,
  instructionsDrawerVisualCue = "none",
  inputExperiment = "default",
  mockTutorConfig,
  onAddFileToProject,
  instructionsContent,
  onTutorSubmit,
  onAcceptAiChanges,
  onRejectAiChanges,
  availableContextFiles = [],
  onRequestRunningChange,
  clearChatSignal = 0,
}: AiTutorPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const scrollWrapRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const requestSerialRef = useRef(0);
  const hasSeededOnMountRef = useRef(false);
  const [maxDrawerHeight, setMaxDrawerHeight] = useState<number | null>(null);
  const [drawerHeight, setDrawerHeight] = useState(0);
  const [drawerIsOpen, setDrawerIsOpen] = useState(true);
  const [isDragOverInput, setIsDragOverInput] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<string[]>(
    mockTutorConfig?.initialAttachments ?? [],
  );
  const [uploadedAttachmentContexts, setUploadedAttachmentContexts] = useState<Record<string, ChatAttachment>>({});
  const [codeAttachmentTimestamps, setCodeAttachmentTimestamps] = useState<Record<string, string>>({});
  const [codeAttachmentContexts, setCodeAttachmentContexts] = useState<Record<string, CodeAttachmentContext>>({});
  const [isThinking, setIsThinking] = useState(false);
  const [generatedTutorResponse, setGeneratedTutorResponse] = useState<ChatMessage | null>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const chatMessagesRef = useRef(chatMessages);
  const generatedTutorResponseRef = useRef<ChatMessage | null>(generatedTutorResponse);
  chatMessagesRef.current = chatMessages;
  generatedTutorResponseRef.current = generatedTutorResponse;

  const contextFileByPath = useMemo(
    () => new Map(availableContextFiles.map((file) => [file.path, file])),
    [availableContextFiles],
  );

  const resetComposerState = useCallback(() => {
    setAttachedFiles([]);
    setUploadedAttachmentContexts({});
    setCodeAttachmentTimestamps({});
    setCodeAttachmentContexts({});
    setIsDragOverInput(false);
    dragDepthRef.current = 0;
  }, []);

  useEffect(() => {
    onRequestRunningChange?.(isThinking);
    return () => onRequestRunningChange?.(false);
  }, [isThinking, onRequestRunningChange]);

  useEffect(() => {
    if (clearChatSignal === 0) return;
    hasSeededOnMountRef.current = true;
    requestSerialRef.current += 1;
    setIsThinking(false);
    setGeneratedTutorResponse(null);
    resetComposerState();
  }, [clearChatSignal, resetComposerState]);

  const updateScrollFades = useCallback(() => {
    const el = scrollWrapRef.current?.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (!el) return;
    setCanScrollUp(el.scrollTop > 2);
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 2);
  }, []);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollWrapRef.current?.querySelector<HTMLElement>(
        '[data-slot="scroll-area-viewport"]',
      );
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, []);

  const appendTutorResponse = useCallback((response: ChatMessage) => {
    setIsThinking(false);
    setChatMessages([...chatMessagesRef.current, response]);
    setGeneratedTutorResponse(null);
    setTimeout(scrollToBottom, 50);
  }, [scrollToBottom, setChatMessages]);

  const handleThinkingComplete = useCallback(() => {
    setIsThinking(false);
    const response = generatedTutorResponseRef.current;
    if (response) {
      appendTutorResponse(response);
    }
  }, [appendTutorResponse]);

  useEffect(() => {
    if (!generatedTutorResponse) return;
    if (onTutorSubmit || !isThinking) {
      appendTutorResponse(generatedTutorResponse);
    }
  }, [appendTutorResponse, generatedTutorResponse, isThinking, onTutorSubmit]);

  useEffect(() => {
    const el = scrollWrapRef.current?.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (!el) return;
    updateScrollFades();
    el.addEventListener("scroll", updateScrollFades, { passive: true });
    const ro = new ResizeObserver(updateScrollFades);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollFades);
      ro.disconnect();
    };
  }, [updateScrollFades, chatMessages.length]);

  useEffect(() => {
    if (!showInstructionsDrawer) {
      setMaxDrawerHeight(null);
      return;
    }

    const calculateMaxHeight = () => {
      if (containerRef.current && inputRef.current) {
        const containerHeight = containerRef.current.clientHeight;
        const inputHeight = inputRef.current.clientHeight;
        setMaxDrawerHeight(containerHeight - inputHeight - 32);
      }
    };

    calculateMaxHeight();
    window.addEventListener("resize", calculateMaxHeight);
    return () => window.removeEventListener("resize", calculateMaxHeight);
  }, [showInstructionsDrawer]);

  useEffect(() => {
    if (
      !mockTutorConfig?.seedOnMount ||
      chatMessages.length > 0 ||
      hasSeededOnMountRef.current
    ) {
      return;
    }
    const seeded = resolveSeedConversation(
      mockTutorConfig.seedConversation,
      "",
    );
    if (!seeded) return;
    hasSeededOnMountRef.current = true;
    setChatMessages(seeded);
  }, [chatMessages.length, mockTutorConfig, setChatMessages]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { fileName, startLine, endLine, selectedText } = (e as CustomEvent).detail;
      const range = startLine === endLine ? `${startLine}` : `${startLine}-${endLine}`;
      const label = `${fileName} (${range})`;
      const timestamp = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      setAttachedFiles((prev) =>
        prev.some((f) => f === label) ? prev : [...prev, label],
      );
      setCodeAttachmentTimestamps((prev) => ({ ...prev, [label]: timestamp }));
      setCodeAttachmentContexts((prev) => ({
        ...prev,
        [label]: {
          content: selectedText ?? "",
          startLine,
          endLine,
          fileName,
        },
      }));
    };
    window.addEventListener("weblab:add-to-tutor", handler);
    return () => window.removeEventListener("weblab:add-to-tutor", handler);
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const { path, name } = (event as CustomEvent<{ path?: string; name?: string }>).detail ?? {};
      const fileLabel = path || name;
      if (!fileLabel) return;
      setAttachedFiles((prev) =>
        prev.includes(fileLabel) ? prev : [...prev, fileLabel],
      );
    };
    window.addEventListener("weblab:add-project-file-to-tutor", handler);
    return () => window.removeEventListener("weblab:add-project-file-to-tutor", handler);
  }, []);

  const topPadding =
    showInstructionsDrawer && drawerIsOpen ? drawerHeight + 40 : showInstructionsDrawer ? 40 : 8;
  const canSend = Boolean(chatInput.trim() || attachedFiles.length > 0);
  const showEmptyState = chatMessages.length === 0 && !isThinking;

  const formatUserMessage = () => {
    const trimmedMessage = chatInput.trim();
    if (!trimmedMessage && attachedFiles.length === 0) return null;
    if (attachedFiles.length === 0) return trimmedMessage;

    const attachmentPrefix = `Attached files: ${attachedFiles.join(", ")}`;
    return trimmedMessage ? `${attachmentPrefix}\n\n${trimmedMessage}` : attachmentPrefix;
  };

  const mergeAttachedFile = (fileLabel: string) => {
    setAttachedFiles((prev) => {
      if (prev.includes(fileLabel)) return prev;
      return [...prev, fileLabel];
    });
  };

  const handleUploadFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (files.length === 0) return;

    const existingPaths = new Set([
      ...attachedFiles,
      ...Object.keys(uploadedAttachmentContexts),
    ]);

    const uploaded = await Promise.all(files.map(async (file) => {
      const path = buildUniqueUploadPath(file.name, existingPaths);
      existingPaths.add(path);
      try {
        return await buildUploadedAttachment(file, path);
      } catch {
        return buildUnreadableUploadAttachment(file, path);
      }
    }));

    setUploadedAttachmentContexts((prev) => ({
      ...prev,
      ...Object.fromEntries(uploaded.map((attachment) => [attachment.path, attachment])),
    }));
    setAttachedFiles((prev) => {
      const next = [...prev];
      for (const attachment of uploaded) {
        if (!next.includes(attachment.path)) {
          next.push(attachment.path);
        }
      }
      return next;
    });
  };

  const removeAttachedFile = (fileLabel: string) => {
    setAttachedFiles((prev) => prev.filter((file) => file !== fileLabel));
    setUploadedAttachmentContexts((prev) => {
      const next = { ...prev };
      delete next[fileLabel];
      return next;
    });
    setCodeAttachmentTimestamps((prev) => {
      const next = { ...prev };
      delete next[fileLabel];
      return next;
    });
    setCodeAttachmentContexts((prev) => {
      const next = { ...prev };
      delete next[fileLabel];
      return next;
    });
  };

  const handleMarkAttachmentAdded = (msgIndex: number, attachmentPath: string) => {
    const msg = chatMessages[msgIndex];
    const att = msg?.attachments?.find((a) => a.path === attachmentPath);
    if (att) {
      onAddFileToProject?.(att.fileName);
    }

    setChatMessages(
      chatMessages.map((m, i) => {
        if (i !== msgIndex || !m.attachments) return m;
        return {
          ...m,
          attachments: m.attachments.map((a) =>
            a.path === attachmentPath
              ? { ...a, addedToProject: true }
              : a,
          ),
        };
      }),
    );
  };

  const handleActionCardUpdate = (msgIndex: number, newStatus: "added" | "dismissed") => {
    const msg = chatMessages[msgIndex];
    const fileCount = msg?.actionCard?.files.length ?? 0;

    if (newStatus === "added") {
      msg?.actionCard?.files.forEach((fileName) => {
        onAddFileToProject?.(fileName);
      });
    }

    const updated = chatMessages.map((m, i) => {
      if (i !== msgIndex || !m.actionCard) return m;
      return {
        ...m,
        actionCard: { ...m.actionCard, status: newStatus },
      };
    });

    if (newStatus === "added") {
      updated.push({
        role: "assistant",
        content: `${fileCount} ${fileCount === 1 ? "file was" : "files were"} added to your project.`,
        isAlert: true,
      });
    }

    setChatMessages(updated);
  };

  const handleCodeChangeAction = (msgIndex: number, action: "accepted" | "rejected") => {
    if (action === "accepted") {
      onAcceptAiChanges?.();
    } else {
      onRejectAiChanges?.();
    }

    const updated = chatMessages.map((m, i) => {
      if (i !== msgIndex) return m;
      return { ...m, codeChangeStatus: action as ChatMessage["codeChangeStatus"] };
    });
    const alertMsg: ChatMessage = {
      role: "assistant",
      content:
        action === "accepted"
          ? "Aaliyah accepted this suggestion."
          : "Aaliyah dismissed this suggestion.",
      isAlert: true,
      alertVariant: action === "accepted" ? "accepted" : "rejected",
    };
    setChatMessages([...updated, alertMsg]);
    scrollToBottom();
  };

  const handleSendMessage = () => {
    const userMessage = formatUserMessage();
    if (!userMessage) return;

    const sentAttachments = buildAttachmentsForSend({
      attachedFiles,
      codeAttachmentTimestamps,
      codeAttachmentContexts,
      contextFileByPath,
      uploadedAttachmentContexts,
      attachmentMeta: mockTutorConfig?.attachmentMeta,
    });
    const submittedContent = chatInput.trim() || userMessage;
    const newUserMsg: ChatMessage = {
      role: "user",
      content: submittedContent,
      attachments: sentAttachments,
    };
    const newMessages = [...chatMessages, newUserMsg];
    const followUp = sentAttachments
      ? mockTutorConfig?.buildAttachmentFollowUp?.(sentAttachments, inputExperiment)
      : null;
    if (followUp) {
      newMessages.push(followUp);
    }

    const isFirstMessage = chatMessages.length === 0;
    const seededConversation =
      !onTutorSubmit && isFirstMessage && !sentAttachments && !followUp
        ? resolveSeedConversation(mockTutorConfig?.seedConversation, userMessage)
        : null;

    setChatMessages(seededConversation ?? newMessages);
    setGeneratedTutorResponse(null);

    const requestId = requestSerialRef.current + 1;
    requestSerialRef.current = requestId;

    if (onTutorSubmit) {
      setIsThinking(true);
      onTutorSubmit(submittedContent, newMessages)
        .then((response) => {
          if (requestSerialRef.current !== requestId) return;
          setGeneratedTutorResponse(response ?? {
            role: "assistant",
            content: "I finished thinking, but I do not have a response to show yet. Try sending the request again.",
          });
        })
        .catch((error) => {
          if (requestSerialRef.current !== requestId) return;
          console.error("[TutorPanel] Tutor submit failed", {
            requestId,
            submittedContent,
            error,
          });
          setGeneratedTutorResponse({
            role: "assistant",
            content: "I had trouble preparing those edits. Try sending the request again.",
          });
        });
    } else if (mockTutorConfig?.response) {
      setIsThinking(true);
      Promise.resolve(resolveMockResponse(mockTutorConfig.response, submittedContent, newMessages))
        .then((response) => {
          if (requestSerialRef.current !== requestId || !response) return;
          setGeneratedTutorResponse(response);
        });
    } else {
      setIsThinking(false);
    }

    setChatInput("");
    resetComposerState();
    scrollToBottom();
  };

  const isFileDragEvent = (event: DragEvent<HTMLElement>) =>
    Array.from(event.dataTransfer.types).includes("application/x-weblab-file");

  const handleDragEnter = (event: DragEvent<HTMLElement>) => {
    if (!isFileDragEvent(event)) return;
    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDragOverInput(true);
  };

  const handleDragOver = (event: DragEvent<HTMLElement>) => {
    if (!isFileDragEvent(event)) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
    setIsDragOverInput(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLElement>) => {
    if (!isFileDragEvent(event)) return;
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragOverInput(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    if (!isFileDragEvent(event)) return;
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDragOverInput(false);

    const rawData = event.dataTransfer.getData("application/x-weblab-file");
    if (!rawData) return;

    try {
      const parsed = JSON.parse(rawData) as { path?: string; name?: string };
      const fileLabel = parsed.path || parsed.name;
      if (fileLabel) {
        mergeAttachedFile(fileLabel);
      }
    } catch (error) {
      console.error("Unable to parse dropped file payload", error);
    }
  };

  return (
    <div className={styles.root} ref={containerRef}>
      {showInstructionsDrawer && (
        <div className={styles.drawerContainer}>
          <InstructionsDrawer
            maxHeight={maxDrawerHeight}
            onHeightChange={setDrawerHeight}
            onOpenChange={setDrawerIsOpen}
            initialHeightRatio={instructionsDrawerInitialHeightRatio}
            visualCue={instructionsDrawerVisualCue}
          >
            {instructionsContent}
          </InstructionsDrawer>
        </div>
      )}

      <AiTutorMessageList
        scrollWrapRef={scrollWrapRef}
        canScrollUp={canScrollUp}
        canScrollDown={canScrollDown}
        showEmptyState={showEmptyState}
        topPadding={topPadding}
        chatMessages={chatMessages}
        isThinking={isThinking}
        autoCompleteThinking={!onTutorSubmit}
        inputExperiment={inputExperiment}
        onThinkingComplete={handleThinkingComplete}
        onMarkAttachmentAdded={handleMarkAttachmentAdded}
        onActionCardUpdate={handleActionCardUpdate}
        onCodeChangeAction={handleCodeChangeAction}
      />

      <div ref={inputRef}>
        <AiTutorComposer
          inputExperiment={inputExperiment}
          chatInput={chatInput}
          setChatInput={setChatInput}
          attachedFiles={attachedFiles}
          attachmentMeta={mockTutorConfig?.attachmentMeta}
          uploadedAttachmentContexts={uploadedAttachmentContexts}
          codeAttachmentTimestamps={codeAttachmentTimestamps}
          isDragOverInput={isDragOverInput}
          fileInputRef={fileInputRef}
          canSend={canSend}
          onSend={handleSendMessage}
          onRemoveAttachedFile={removeAttachedFile}
          onUploadFileSelection={handleUploadFileSelection}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        />
      </div>
    </div>
  );
}

export type { AiTutorInputExperiment, TutorContextFile } from "../../../../../types/tutor";
