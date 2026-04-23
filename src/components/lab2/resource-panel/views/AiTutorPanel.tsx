import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faArrowUp, faPaperclip } from "@fortawesome/free-solid-svg-icons";
import { useRef, useEffect, useState, useCallback, type ReactNode } from "react";
import { ScrollArea } from "../../../ui/scroll-area";
import { Textarea } from "../../../ui/textarea";
import { AppButton } from "../../../ui/AppButton";
import { FileChip } from "../../../ui/FileChip";
import { faIconForFileName, fileExtensionLabelFromName } from "../../../ui/fileChipMeta";
import { FaIcon } from "../../../ui/icons/FaIcon";
import { ActionRow } from "../ActionRow";
import { InstructionsDrawer } from "../InstructionsDrawer";
import type { InstructionsDrawerVisualCue } from "../InstructionsDrawer";
import { TutorActionCard } from "./TutorActionCard";
import type { ChatAttachment, ChatMessage, FileChange } from "../../../../types/chat";
import styles from "./AiTutorPanel.module.scss";

/* ── Rich message content renderer ──────────────────────── */

function renderInlineFormatting(text: string): ReactNode {
  const parts = text.split(/(\*\*[\s\S]*?\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    const bold = part.match(/^\*\*([\s\S]*?)\*\*$/);
    if (bold) return <strong key={i}>{bold[1]}</strong>;
    const code = part.match(/^`([^`]+)`$/);
    if (code) return <code key={i} className={styles.inlineCode}>{code[1]}</code>;
    return part;
  });
}

const LANG_LABELS: Record<string, string> = {
  css: "CSS",
  html: "HTML",
  js: "JavaScript",
  javascript: "JavaScript",
  ts: "TypeScript",
  typescript: "TypeScript",
  json: "JSON",
  py: "Python",
  python: "Python",
};

function CodeSnippetCard({ lang, code }: { lang: string | null; code: string }) {
  const label = lang ? (LANG_LABELS[lang.toLowerCase()] ?? lang) : null;
  const lines = code.split("\n");
  return (
    <div className={styles.codeCard}>
      <div className={styles.codeCardHeader}>
        {label && <span className={styles.codeCardLang}>{label}</span>}
        <AppButton
          variant="secondary"
          tone="gray"
          size="xs"
          iconName="copy"
          aria-label="Copy code"
          onClick={() => navigator.clipboard.writeText(code)}
        />
      </div>
      <div className={styles.codeCardBody}>
        <div className={styles.codeCardLines}>
          {lines.map((_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <code className={styles.codeCardCode}>{code}</code>
      </div>
    </div>
  );
}

const FILE_STATUS_ICON: Record<FileChange["status"], { name: "circle-plus" | "pen-circle" | "circle-trash"; className: string }> = {
  new: { name: "circle-plus", className: styles.fileChangesIconNew },
  modified: { name: "pen-circle", className: styles.fileChangesIconModified },
  deleted: { name: "circle-trash", className: styles.fileChangesIconDeleted },
};

function FileChangeDiffStat({ fc }: { fc: FileChange }) {
  if (fc.status === "deleted") {
    return <span className={styles.statLabel}>Removed</span>;
  }
  const added = fc.linesAdded;
  const removed = fc.linesRemoved;
  if (added == null && removed == null) return null;
  return (
    <span className={styles.fileChangesStat}>
      {removed != null && removed > 0 && <span className={styles.statRemoved}>-{removed}</span>}
      {added != null && added > 0 && <span className={styles.statAdded}>+{added}</span>}
    </span>
  );
}

function FileChangesCard({ changes }: { changes: FileChange[] }) {
  return (
    <div className={styles.fileChangesCard}>
      <div className={styles.fileChangesHeader}>Files modified</div>
      {changes.map((fc) => {
        const icon = FILE_STATUS_ICON[fc.status];
        return (
          <div key={fc.fileName} className={styles.fileChangesRow}>
            <FaIcon name={icon.name} size="xs" className={icon.className} />
            <span className={styles.fileChangesName}>{fc.fileName}</span>
            <FileChangeDiffStat fc={fc} />
          </div>
        );
      })}
    </div>
  );
}

function renderMessageContent(content: string): ReactNode {
  const hasCodeFence = content.includes("```");
  if (!hasCodeFence) {
    return <p className={styles.messageText}>{renderInlineFormatting(content)}</p>;
  }

  const segments = content.split(/(```\w*\n[\s\S]*?```)/g);
  return (
    <div className={styles.messageContent}>
      {segments.map((seg, i) => {
        const fence = seg.match(/^```(\w*)\n([\s\S]*?)```$/);
        if (fence) {
          const lang = fence[1] || null;
          const code = fence[2].replace(/\n$/, "");
          return <CodeSnippetCard key={i} lang={lang} code={code} />;
        }
        if (!seg) return null;
        return (
          <span key={i} className={styles.textSegment}>
            {renderInlineFormatting(seg)}
          </span>
        );
      })}
    </div>
  );
}

export type AiTutorInputExperiment =
  | "default"
  | "clarified-send"
  | "file-drop"
  | "file-chip-action"
  | "tutor-action-card";

interface AiTutorPanelProps {
  chatMessages: ChatMessage[];
  setChatMessages: (messages: ChatMessage[]) => void;
  chatInput: string;
  setChatInput: (input: string) => void;
  /** When false, the instructions drawer is not shown (e.g. assessment levels). Default true. */
  showInstructionsDrawer?: boolean;
  instructionsDrawerInitialHeightRatio?: number;
  instructionsDrawerVisualCue?: InstructionsDrawerVisualCue;
  autoSeedConversationOnMount?: boolean;
  inputExperiment?: AiTutorInputExperiment;
  /** Pre-attach files in the composer (shown as chips before sending). */
  initialAttachedFiles?: string[];
  /** Metadata for attached files (image src, timestamps). Keyed by file path. */
  attachmentMeta?: Record<string, ChatAttachment>;
  /** Callback to add a file to the project tree. */
  onAddFileToProject?: (fileName: string) => void;
  instructionsContent?: React.ReactNode;
}

const SEEDED_USER_MESSAGE =
  "Can you help me improve this page while keeping my brand styling consistent?";

function buildSeededConversation(firstUserMessage: string): ChatMessage[] {
  return [
    {
      role: "user",
      content: firstUserMessage,
    },
    {
      role: "assistant",
      content:
        "I can help you with that! Let me create a solution for you.\n\nI've analyzed your request and here's what I'll build:\n• A responsive layout with proper spacing\n• Interactive elements with hover states\n• Accessible form controls with proper labels\n• Mobile-optimized design that works on all screen sizes\n\nThe page will follow your existing design system and brand colors. Would you like me to proceed?",
    },
    {
      role: "user",
      content:
        "Yes, that sounds great! Can you make the button colors match my brand identity? I want to make sure everything is consistent with the purple and teal color scheme we're using throughout the app.",
    },
    {
      role: "assistant",
      content:
        "Absolutely! I've updated the button styling to use your brand colors from the design pack:\n\n• Primary buttons: #9657c7 (purple) with hover state #6c468a\n• Secondary buttons: #0093a4 (teal) for accents and CTAs\n• Focus states: 2px teal ring (#0093a4) with 2px offset for accessibility\n• Disabled states: Light gray (#d4dae1) to indicate inactive controls\n\nAll buttons now match your brand identity and include proper transition effects for smooth interactions. I've also ensured the contrast ratios meet WCAG accessibility standards.",
    },
    {
      role: "user",
      content:
        "Perfect! One more thing - can you add some validation to the form fields? I want to make sure users enter valid email addresses and that required fields aren't left empty.",
    },
    {
      role: "assistant",
      content:
        "Great idea! I've added comprehensive form validation:\n\n**Email Validation:**\n• Checks for valid email format (name@domain.com)\n• Shows error message if format is incorrect\n• Real-time validation as user types\n\n**Required Fields:**\n• All required fields marked with asterisks\n• Form can't be submitted until all required fields are filled\n• Clear error messages appear below each field\n• Fields highlight in red when there's an error\n\n**User Experience:**\n• Submit button is disabled until form is valid\n• Success message appears after successful submission\n• Form clears after submission for new entries\n\nThe validation follows best practices and provides helpful feedback to guide users through completing the form correctly.",
    },
    {
      role: "user",
      content:
        "This is looking really good! How do I make the page responsive so it works well on mobile devices too?",
    },
    {
      role: "assistant",
      content:
        "Good news - I've already made the page fully responsive! Here's what adapts at different screen sizes:\n\n**Mobile (< 768px):**\n• Single column layout for better readability\n• Larger touch targets (minimum 44px) for buttons and inputs\n• Simplified navigation with hamburger menu\n• Stacked form fields with full-width inputs\n• Adjusted font sizes for mobile viewing\n\n**Tablet (768px - 1024px):**\n• Two-column grid where appropriate\n• Optimized spacing for tablet viewport\n• Touch-friendly interactive elements\n\n**Desktop (> 1024px):**\n• Multi-column layouts for efficient use of space\n• Hover states and detailed interactions\n• Maximum width constraint (1200px) for readability\n\nI've tested the design at common breakpoints and it provides an optimal experience on all devices. You can test it by resizing your browser window or using the device preview toggle in the toolbar!",
    },
  ];
}

export function AiTutorPanel({
  chatMessages,
  setChatMessages,
  chatInput,
  setChatInput,
  showInstructionsDrawer = true,
  instructionsDrawerInitialHeightRatio,
  instructionsDrawerVisualCue = "none",
  autoSeedConversationOnMount = false,
  inputExperiment = "default",
  initialAttachedFiles,
  attachmentMeta,
  onAddFileToProject,
  instructionsContent,
}: AiTutorPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const scrollWrapRef = useRef<HTMLDivElement>(null);
  const dragDepthRef = useRef(0);
  const [maxDrawerHeight, setMaxDrawerHeight] = useState<number | null>(null);
  const [drawerHeight, setDrawerHeight] = useState(0);
  const [drawerIsOpen, setDrawerIsOpen] = useState(true);
  const [isDragOverInput, setIsDragOverInput] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<string[]>(initialAttachedFiles ?? []);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const updateScrollFades = useCallback(() => {
    const el = scrollWrapRef.current?.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (!el) return;
    setCanScrollUp(el.scrollTop > 2);
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 2);
  }, []);

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

  const topPadding =
    showInstructionsDrawer && drawerIsOpen ? drawerHeight + 40 : showInstructionsDrawer ? 40 : 8;

  useEffect(() => {
    if (!showInstructionsDrawer) {
      setMaxDrawerHeight(null);
      return;
    }

    const calculateMaxHeight = () => {
      if (containerRef.current && inputRef.current) {
        const containerHeight = containerRef.current.clientHeight;
        const inputHeight = inputRef.current.clientHeight;
        const calculatedMax = containerHeight - inputHeight - 32;
        setMaxDrawerHeight(calculatedMax);
      }
    };

    calculateMaxHeight();
    window.addEventListener("resize", calculateMaxHeight);
    return () => window.removeEventListener("resize", calculateMaxHeight);
  }, [showInstructionsDrawer]);

  useEffect(() => {
    if (autoSeedConversationOnMount && chatMessages.length === 0) {
      setChatMessages(buildSeededConversation(SEEDED_USER_MESSAGE));
    }
  }, [autoSeedConversationOnMount, chatMessages.length, setChatMessages]);

  // Listen for "Add to AI Tutor Chat" events from the code editor
  useEffect(() => {
    const handler = (e: Event) => {
      const { fileName, startLine, endLine } = (e as CustomEvent).detail;
      const label =
        startLine === endLine
          ? `${fileName}:${startLine}`
          : `${fileName}:${startLine}-${endLine}`;
      setAttachedFiles((prev) =>
        prev.includes(label) ? prev : [...prev, label],
      );
    };
    window.addEventListener("weblab:add-to-tutor", handler);
    return () => window.removeEventListener("weblab:add-to-tutor", handler);
  }, []);

  const fileDropEnabled =
    inputExperiment === "file-drop" ||
    inputExperiment === "file-chip-action" ||
    inputExperiment === "tutor-action-card";

  const isFileDragEvent = (event: React.DragEvent<HTMLElement>) =>
    Array.from(event.dataTransfer.types).includes("application/x-weblab-file");

  const formatUserMessage = () => {
    const trimmedMessage = chatInput.trim();
    if (!trimmedMessage && attachedFiles.length === 0) {
      return null;
    }

    if (attachedFiles.length === 0) {
      return trimmedMessage;
    }

    const attachmentPrefix = `Attached files: ${attachedFiles.join(", ")}`;
    return trimmedMessage ? `${attachmentPrefix}\n\n${trimmedMessage}` : attachmentPrefix;
  };

  const buildAttachmentsForSend = (): ChatAttachment[] | undefined => {
    if (attachedFiles.length === 0) return undefined;
    if (!showFileChipActionsInStream && !showTutorActionCards) return undefined;

    return attachedFiles.map((filePath) => {
      const meta = attachmentMeta?.[filePath];
      return {
        fileName: attachmentDisplayName(filePath),
        path: filePath,
        imageSrc: meta?.imageSrc ?? null,
        timestamp: meta?.timestamp ?? new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        source: meta?.source ?? "upload",
      };
    });
  };

  const buildTutorFollowUp = (sentAttachments: ChatAttachment[] | undefined): ChatMessage | null => {
    if (!sentAttachments || sentAttachments.length === 0) return null;

    const uploads = sentAttachments.filter((a) => a.source === "upload");
    if (uploads.length === 0) return null;

    const uploadNames = uploads.map((a) => a.fileName);

    if (showFileChipActionsInStream) {
      return {
        role: "assistant",
        content: `I can see the files you shared! If you'd like to use these images directly in your project, click the + button on each one above to add them. I also see you referenced index.html for context — once the images are in your project, I'll help you wire them into the breed cards.`,
      };
    }

    if (showTutorActionCards) {
      return {
        role: "assistant",
        content: `Those look great! Before we start coding, would you like me to add these images to your project files? That way we can reference them directly in your HTML.`,
        actionCard: {
          prompt: "Add these files to your project?",
          files: uploadNames,
          status: "pending",
        },
      };
    }

    return null;
  };

  const handleSendMessage = () => {
    const userMessage = formatUserMessage();
    if (userMessage) {
      const sentAttachments = buildAttachmentsForSend();
      const isFirstMessage = chatMessages.length === 0;

      if (isFirstMessage && !showFileChipActionsInStream && !showTutorActionCards) {
        setChatMessages(buildSeededConversation(userMessage));
      } else {
        const newUserMsg: ChatMessage = {
          role: "user",
          content: chatInput.trim() || userMessage,
          attachments: sentAttachments,
        };
        const newMessages = [...chatMessages, newUserMsg];
        const followUp = buildTutorFollowUp(sentAttachments);
        if (followUp) {
          newMessages.push(followUp);
        }
        setChatMessages(newMessages);
      }
      setChatInput("");
      setAttachedFiles([]);
      setIsDragOverInput(false);
      dragDepthRef.current = 0;
    }
  };

  const mergeAttachedFile = (fileLabel: string) => {
    setAttachedFiles((prev) => {
      if (prev.includes(fileLabel)) {
        return prev;
      }
      return [...prev, fileLabel];
    });
  };

  const removeAttachedFile = (fileLabel: string) => {
    setAttachedFiles((prev) => prev.filter((file) => file !== fileLabel));
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

  const isClarified = inputExperiment === "clarified-send";

  const attachmentDisplayName = (pathOrName: string) => {
    const i = pathOrName.lastIndexOf("/");
    return i >= 0 ? pathOrName.slice(i + 1) : pathOrName;
  };

  const showFileChipActionsInStream = inputExperiment === "file-chip-action";
  const showTutorActionCards = inputExperiment === "tutor-action-card";

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

      <div className={styles.scrollWrap} ref={scrollWrapRef}>
        {canScrollUp && <div className={styles.fadeTop} />}
        {canScrollDown && <div className={styles.fadeBottom} />}
        <ScrollArea className={styles.messagesArea}>
          <div className={styles.messagesWrap} style={{ paddingTop: `${topPadding}px` }}>
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={styles.messageBlock}>
              {/* File chips above user message (Level 1: with + action) */}
              {showFileChipActionsInStream && msg.role === "user" && msg.attachments && msg.attachments.length > 0 && (
                <div className={`${styles.messageRow} ${styles.messageRowUser}`}>
                  <div className={styles.streamAttachmentRow}>
                    {msg.attachments.map((att) => {
                      const isUpload = att.source === "upload";
                      return (
                        <FileChip
                          key={att.path}
                          fileName={att.fileName}
                          nameTitle={att.path}
                          extensionLabel={att.timestamp ?? fileExtensionLabelFromName(att.path)}
                          iconName={faIconForFileName(att.path)}
                          imageSrc={att.imageSrc}
                          mode={isUpload ? "add" : "static"}
                          onAdd={isUpload ? () => handleMarkAttachmentAdded(idx, att.path) : undefined}
                          addedToProject={att.addedToProject}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* File chips above user message (Level 2: display only) */}
              {showTutorActionCards && msg.role === "user" && msg.attachments && msg.attachments.length > 0 && (
                <div className={`${styles.messageRow} ${styles.messageRowUser}`}>
                  <div className={styles.streamAttachmentRow}>
                    {msg.attachments.map((att) => (
                      <FileChip
                        key={att.path}
                        fileName={att.fileName}
                        nameTitle={att.path}
                        extensionLabel={att.timestamp ?? fileExtensionLabelFromName(att.path)}
                        iconName={faIconForFileName(att.path)}
                        imageSrc={att.imageSrc}
                        mode="static"
                      />
                    ))}
                  </div>
                </div>
              )}

              {msg.isAlert ? (
                <div className={styles.messageRow}>
                  <div className={`${styles.alertBubble} ${msg.alertVariant === "rejected" ? styles.alertBubbleRejected : ""}`}>
                    <FaIcon
                      name={msg.alertVariant === "rejected" ? "circle-xmark" : "circle-check"}
                      size="s"
                      className={`${styles.alertIcon} ${msg.alertVariant === "rejected" ? styles.alertIconRejected : ""}`}
                    />
                    <p className={styles.alertText}>{msg.content}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className={`${styles.messageRow} ${
                      msg.role === "user" ? styles.messageRowUser : styles.messageRowAssistant
                    }`}
                  >
                    <div
                      className={`${styles.messageBubble} ${
                        msg.role === "user"
                          ? styles.messageBubbleUser
                          : styles.messageBubbleAssistant
                      }`}
                    >
                      {renderMessageContent(msg.content)}

                      {msg.fileChanges && msg.fileChanges.length > 0 && (
                        <FileChangesCard changes={msg.fileChanges} />
                      )}

                      {showTutorActionCards && msg.role === "assistant" && msg.actionCard && (
                        <TutorActionCard
                          prompt={msg.actionCard.prompt}
                          files={msg.actionCard.files}
                          status={msg.actionCard.status}
                          onAdd={() => handleActionCardUpdate(idx, "added")}
                          onDismiss={() => handleActionCardUpdate(idx, "dismissed")}
                        />
                      )}
                    </div>
                  </div>

                  {msg.role === "assistant" && (
                    <div className={styles.actionRowWrap}>
                      <ActionRow
                        onCopy={() => {
                          console.log("Copy message", idx);
                        }}
                        onDownload={() => {
                          console.log("Download message", idx);
                        }}
                        onThumbsUp={() => {
                          console.log("Thumbs up", idx);
                        }}
                        onThumbsDown={() => {
                          console.log("Thumbs down", idx);
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          </div>
        </ScrollArea>
      </div>

      <div
        className={`${styles.inputSection} ${
          isClarified ? styles.inputSectionClarified : ""
        }`}
        ref={inputRef}
      >
        <div className={styles.inputComposer}
          onDragEnter={(event) => {
            if (!fileDropEnabled || !isFileDragEvent(event)) {
              return;
            }
            event.preventDefault();
            dragDepthRef.current += 1;
            setIsDragOverInput(true);
          }}
          onDragOver={(event) => {
            if (!fileDropEnabled || !isFileDragEvent(event)) {
              return;
            }
            event.preventDefault();
            event.stopPropagation();
            event.dataTransfer.dropEffect = "copy";
            setIsDragOverInput(true);
          }}
          onDragLeave={(event) => {
            if (!fileDropEnabled || !isFileDragEvent(event)) {
              return;
            }
            event.preventDefault();
            dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
            if (dragDepthRef.current === 0) {
              setIsDragOverInput(false);
            }
          }}
          onDrop={(event) => {
            if (!fileDropEnabled || !isFileDragEvent(event)) {
              return;
            }
            event.preventDefault();
            dragDepthRef.current = 0;
            setIsDragOverInput(false);

            const rawData = event.dataTransfer.getData("application/x-weblab-file");
            if (!rawData) {
              return;
            }

            try {
              const parsed = JSON.parse(rawData) as { path?: string; name?: string };
              const fileLabel = parsed.path || parsed.name;
              if (fileLabel) {
                mergeAttachedFile(fileLabel);
              }
            } catch (error) {
              console.error("Unable to parse dropped file payload", error);
            }
          }}
        >
          {attachedFiles.length > 0 && (
            <div className={styles.attachmentRow}>
              {attachedFiles.map((fileLabel) => {
                const meta = attachmentMeta?.[fileLabel];
                return (
                  <FileChip
                    key={fileLabel}
                    fileName={attachmentDisplayName(fileLabel)}
                    nameTitle={fileLabel}
                    extensionLabel={meta?.timestamp ?? fileExtensionLabelFromName(fileLabel)}
                    iconName={faIconForFileName(fileLabel)}
                    imageSrc={meta?.imageSrc}
                    onRemove={() => removeAttachedFile(fileLabel)}
                  />
                );
              })}
              {fileDropEnabled && isDragOverInput && (
                <div className={styles.attachmentAddSlot} aria-hidden>
                  <FontAwesomeIcon
                    icon={faPlus}
                    className={styles.attachmentAddSlotIcon}
                  />
                </div>
              )}
            </div>
          )}

          {fileDropEnabled &&
            isDragOverInput &&
            attachedFiles.length === 0 && (
            <div
              className={styles.dropHelperText}
              role="status"
              aria-live="polite"
            >
              <FontAwesomeIcon
                icon={faPaperclip}
                className={styles.dropHelperIcon}
                aria-hidden
              />
              <span>Drop to add file as context</span>
            </div>
          )}

          <div
            className={`${styles.inputCard} ${
              fileDropEnabled && isDragOverInput ? styles.inputCardDropActive : ""
            }`}
          >
          <Textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              isClarified
                ? "Message AI Tutor..."
                : "Type something..."
            }
            className={styles.textarea}
          />
          <div className={styles.inputActions}>
            <AppButton
              variant="secondary"
              tone="gray"
              size="xs"
              icon={<FontAwesomeIcon icon={faPlus} />}
            >
              Add File
            </AppButton>
            <div className={styles.sendButtonRow}>
              {isClarified ? (
                <button
                  type="button"
                  className={`${styles.sendButtonTeal} ${
                    formatUserMessage()
                      ? styles.sendButtonTealEnabled
                      : styles.sendButtonTealDisabled
                  }`}
                  disabled={!formatUserMessage()}
                  onClick={handleSendMessage}
                  aria-label="Send message"
                >
                  <FaIcon name="arrow-up" size="xs" />
                  Send
                </button>
              ) : (
                <AppButton
                  variant="primary"
                  tone="purple"
                  size="xs"
                  icon={<FontAwesomeIcon icon={faArrowUp} className={styles.sendIcon} />}
                  className={`${styles.sendButton} ${
                    formatUserMessage()
                      ? styles.sendButtonEnabled
                      : styles.sendButtonDisabled
                  }`}
                  disabled={!formatUserMessage()}
                  onClick={handleSendMessage}
                  aria-label="Send message"
                />
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
