import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type RefObject,
} from "react";
import { Textarea } from "../../../../ui/textarea";
import { AppButton } from "../../../../ui/AppButton";
import { AppActionDropdown } from "../../../../ui/AppDropdown";
import { FileChip } from "../../../../ui/FileChip";
import { faIconForFileName, fileExtensionLabelFromName } from "../../../../ui/fileChipMeta";
import { FaIcon } from "../../../../ui/icons/FaIcon";
import type { FaIconName } from "../../../../../icons/faProRegularCodepoints";
import { useKeyboardFocusWithin } from "../../../../../hooks/useKeyboardFocusWithin";
import type { ChatAttachment } from "../../../../../types/chat";
import type { AiTutorInputExperiment, TutorRequestMode } from "../../../../../types/tutor";
import { attachmentDisplayName } from "./attachmentUtils";
import styles from "./AiTutorPanel.module.scss";

const TUTOR_MODE_OPTIONS = [
  { label: "Auto", value: "auto", iconName: "sparkles" },
  { label: "Build", value: "build", iconName: "wrench" },
  { label: "Plan", value: "plan", iconName: "rectangle-list" },
  { label: "Help", value: "help", iconName: "brain" },
] satisfies Array<{
  label: string;
  value: TutorRequestMode;
  iconName: FaIconName;
}>;

interface AiTutorComposerProps {
  inputExperiment: AiTutorInputExperiment;
  chatInput: string;
  setChatInput: (input: string) => void;
  attachedFiles: string[];
  attachmentMeta?: Record<string, ChatAttachment>;
  uploadedAttachmentContexts: Record<string, ChatAttachment>;
  codeAttachmentTimestamps: Record<string, string>;
  isDragOverInput: boolean;
  showModelSelector?: boolean;
  tutorRequestMode: TutorRequestMode;
  setTutorRequestMode: (mode: TutorRequestMode) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  canSend: boolean;
  onSend: () => void;
  onRemoveAttachedFile: (fileLabel: string) => void;
  onUploadFileSelection: (event: ChangeEvent<HTMLInputElement>) => void;
  onDragEnter: (event: DragEvent<HTMLElement>) => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDragLeave: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
}

export function AiTutorComposer({
  inputExperiment,
  chatInput,
  setChatInput,
  attachedFiles,
  attachmentMeta,
  uploadedAttachmentContexts,
  codeAttachmentTimestamps,
  isDragOverInput,
  showModelSelector = true,
  tutorRequestMode,
  setTutorRequestMode,
  fileInputRef,
  canSend,
  onSend,
  onRemoveAttachedFile,
  onUploadFileSelection,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
}: AiTutorComposerProps) {
  const isClarified = inputExperiment === "clarified-send";
  const { isKeyboardFocusWithin, focusWithinProps } =
    useKeyboardFocusWithin<HTMLDivElement>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shimmerTimeoutRef = useRef<number | null>(null);
  const [isShimmering, setIsShimmering] = useState(false);
  const showDropHelper = isDragOverInput && attachedFiles.length === 0;

  useEffect(() => {
    const focusTutorInput = () => {
      textareaRef.current?.focus();
      setIsShimmering(false);
      window.requestAnimationFrame(() => {
        setIsShimmering(true);
        if (shimmerTimeoutRef.current !== null) {
          window.clearTimeout(shimmerTimeoutRef.current);
        }
        shimmerTimeoutRef.current = window.setTimeout(() => {
          setIsShimmering(false);
          shimmerTimeoutRef.current = null;
        }, 4000);
      });
    };
    window.addEventListener("weblab:focus-tutor-input", focusTutorInput);
    return () => {
      window.removeEventListener("weblab:focus-tutor-input", focusTutorInput);
      if (shimmerTimeoutRef.current !== null) {
        window.clearTimeout(shimmerTimeoutRef.current);
      }
    };
  }, []);

  const selectedTutorMode = TUTOR_MODE_OPTIONS.find(
    (option) => option.value === tutorRequestMode,
  ) ?? TUTOR_MODE_OPTIONS[0];
  const tutorModeItems = useMemo(
    () =>
      TUTOR_MODE_OPTIONS.map((option) => ({
        id: option.value,
        label: option.label,
        iconName: option.iconName,
        onSelect: () => setTutorRequestMode(option.value),
      })),
    [setTutorRequestMode],
  );

  return (
    <div
      className={`${styles.inputSection} ${
        isClarified ? styles.inputSectionClarified : ""
      } ${
        showDropHelper ? styles.inputSectionDropActive : ""
      }`}
    >
      <div
        className={styles.inputComposer}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {attachedFiles.length > 0 && (
          <div className={styles.attachmentRow}>
            {attachedFiles.map((fileLabel) => {
              const meta = uploadedAttachmentContexts[fileLabel] ?? attachmentMeta?.[fileLabel];
              const codeTimestamp = codeAttachmentTimestamps[fileLabel];
              const displayName = meta?.fileName ?? attachmentDisplayName(fileLabel);
              const isFullProjectFile = !codeTimestamp && (!meta || meta.source === "project");
              const metadataLabel = isFullProjectFile
                ? undefined
                : codeTimestamp ?? meta?.timestamp ?? fileExtensionLabelFromName(displayName);
              return (
                <FileChip
                  key={fileLabel}
                  fileName={displayName}
                  nameTitle={fileLabel}
                  extensionLabel={metadataLabel}
                  iconName={faIconForFileName(displayName)}
                  imageSrc={meta?.imageSrc}
                  onRemove={() => onRemoveAttachedFile(fileLabel)}
                />
              );
            })}
            {isDragOverInput && (
              <div className={styles.attachmentAddSlot} aria-hidden>
                <FaIcon
                  name="plus"
                  size="xs"
                  className={styles.attachmentAddSlotIcon}
                />
              </div>
            )}
          </div>
        )}

        {showDropHelper && (
          <div
            className={styles.dropHelperText}
            role="status"
            aria-live="polite"
          >
            <FaIcon
              name="paperclip"
              size="xs"
              className={styles.dropHelperIcon}
              aria-hidden
            />
            <span>Drop to add file as context</span>
          </div>
        )}

        <div
          className={`${styles.inputCard} ${
            isDragOverInput ? styles.inputCardDropActive : ""
          } ${
            isKeyboardFocusWithin ? styles.inputCardKeyboardFocused : ""
          } ${
            isShimmering ? styles.inputCardShimmer : ""
          }`}
          {...focusWithinProps}
        >
          <Textarea
            ref={textareaRef}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder={isClarified ? "Message AI Tutor..." : "Type something..."}
            className={styles.textarea}
          />
          <div className={styles.inputActions}>
            <div>
              <AppButton
                variant="secondary"
                aria-label="Add file"
                tone="gray"
                size="xs"
                iconName="plus"
                onClick={() => fileInputRef.current?.click()}
              >
              </AppButton>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className={styles.fileInput}
                onChange={onUploadFileSelection}
              />
            </div>
            <div className={styles.sendButtonRow}>
              {showModelSelector ? (
                <AppActionDropdown
                  items={tutorModeItems}
                  size="xs"
                  align="end"
                  listLabel="Tutor mode"
                  trigger={
                    <AppButton
                      variant="secondary"
                      tone="gray"
                      size="xs"
                      iconName={selectedTutorMode.iconName}
                      className={styles.modelDropdown}
                      aria-label={`Tutor mode: ${selectedTutorMode.label}`}
                    >
                      <span className={styles.modeTriggerContent}>
                        <span>{selectedTutorMode.label}</span>
                        <FaIcon
                          name="chevron-down"
                          size="xs"
                          className={styles.modeTriggerChevron}
                        />
                      </span>
                    </AppButton>
                  }
                />
              ) : null}
              {isClarified ? (
                <button
                  type="button"
                  className={`${styles.sendButtonTeal} ${
                    canSend
                      ? styles.sendButtonTealEnabled
                      : styles.sendButtonTealDisabled
                  }`}
                  disabled={!canSend}
                  onClick={onSend}
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
                  iconName="arrow-up"
                  className={`${styles.sendButton} ${
                    canSend
                      ? styles.sendButtonEnabled
                      : styles.sendButtonDisabled
                  }`}
                  disabled={!canSend}
                  onClick={onSend}
                  aria-label="Send message"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
