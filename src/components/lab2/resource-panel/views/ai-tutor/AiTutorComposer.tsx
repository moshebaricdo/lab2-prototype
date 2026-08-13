import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type MouseEvent,
  type RefObject,
} from "react";
import {
  AiChatInput,
  Button,
  Dropdown,
  Tooltip,
} from "@moshebaricdo/cads-react";
import { FaIcon } from "../../../../ui/icons/FaIcon";
import type { FaIconName } from "../../../../../icons/faProRegularCodepoints";
import type { ChatAttachment } from "../../../../../types/chat";
import type { AiTutorInputExperiment, TutorRequestMode } from "../../../../../types/tutor";
import { attachmentDisplayName } from "./attachmentUtils";
import { TutorChatFileChip, tutorChatChipType } from "./tutorChatFileChip";
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

const TEXTAREA_MAX_HEIGHT = 132;
const SEND_BUTTON_SELECTOR = 'button[aria-label="Send"]';

interface AiTutorComposerProps {
  inputExperiment: AiTutorInputExperiment;
  chatInput: string;
  setChatInput: (input: string) => void;
  attachedFiles: string[];
  attachmentMeta?: Record<string, ChatAttachment>;
  uploadedAttachmentContexts: Record<string, ChatAttachment>;
  uploadProgressByPath?: Record<string, number>;
  codeAttachmentTimestamps: Record<string, string>;
  isDragOverInput: boolean;
  showModelSelector?: boolean;
  placeholder?: string;
  tutorRequestMode: TutorRequestMode;
  setTutorRequestMode: (mode: TutorRequestMode) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  canSend: boolean;
  disabled?: boolean;
  onCheckWork?: () => void;
  checkWorkDisabled?: boolean;
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
  uploadProgressByPath = {},
  codeAttachmentTimestamps,
  isDragOverInput,
  showModelSelector = true,
  placeholder,
  tutorRequestMode,
  setTutorRequestMode,
  fileInputRef,
  canSend,
  disabled = false,
  onCheckWork,
  checkWorkDisabled = false,
  onSend,
  onRemoveAttachedFile,
  onUploadFileSelection,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
}: AiTutorComposerProps) {
  const isClarified = inputExperiment === "clarified-send";
  const composerRef = useRef<HTMLDivElement>(null);
  const shimmerTimeoutRef = useRef<number | null>(null);
  const [isShimmering, setIsShimmering] = useState(false);
  const showDropHelper = isDragOverInput && attachedFiles.length === 0;
  const hasCustomLeftActions = Boolean(onCheckWork || showModelSelector);
  const forceSendEnabled = canSend && !disabled && chatInput.trim().length === 0;

  const textareaEl = () =>
    composerRef.current?.querySelector("textarea") ?? null;

  const syncTextareaOverflow = useCallback(() => {
    const textarea = textareaEl();
    if (!textarea) return;

    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, TEXTAREA_MAX_HEIGHT);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > nextHeight + 1 ? "auto" : "hidden";
  }, []);

  useLayoutEffect(() => {
    syncTextareaOverflow();
  }, [chatInput, attachedFiles.length, syncTextareaOverflow]);

  useLayoutEffect(() => {
    const sendButton = composerRef.current?.querySelector<HTMLButtonElement>(
      SEND_BUTTON_SELECTOR,
    );
    if (!sendButton) return;
    sendButton.disabled = !canSend || disabled;
  }, [canSend, disabled, chatInput, attachedFiles.length]);

  useEffect(() => {
    const focusTutorInput = () => {
      textareaEl()?.focus();
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
  const tutorModeOptions = useMemo(
    () =>
      TUTOR_MODE_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
        iconName: option.iconName,
      })),
    [],
  );

  const openFilePicker = () => fileInputRef.current?.click();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSend || disabled) return;
    onSend();
  };

  const handleComposerClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!forceSendEnabled) return;
    const target = event.target as HTMLElement | null;
    if (!target?.closest(SEND_BUTTON_SELECTOR)) return;
    event.preventDefault();
    event.stopPropagation();
    onSend();
  };

  const attachmentRow = attachedFiles.length > 0 ? (
    <div className={styles.attachmentRow}>
      {attachedFiles.map((fileLabel) => {
        const meta = uploadedAttachmentContexts[fileLabel] ?? attachmentMeta?.[fileLabel];
        const codeTimestamp = codeAttachmentTimestamps[fileLabel];
        const displayName = meta?.fileName ?? attachmentDisplayName(fileLabel);
        const chipType = tutorChatChipType({
          source: meta?.source,
          imageSrc: meta?.imageSrc,
          mimeType: meta?.mimeType,
          isCodeReference: Boolean(codeTimestamp),
        });
        return (
          <TutorChatFileChip
            key={fileLabel}
            fileName={displayName}
            title={fileLabel}
            useCase="inputField"
            type={chipType}
            metadata={codeTimestamp ?? meta?.timestamp}
            imageSrc={meta?.imageSrc}
            uploadProgress={uploadProgressByPath[fileLabel]}
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
  ) : null;

  const leftActions = hasCustomLeftActions ? (
    <div className={styles.composerShortcutGroup}>
      <Tooltip title="Add file" placement="top">
        <span>
          <Button
            variant="outlined"
            color="secondary"
            size="extraSmall"
            startIconName="plus"
            disabled={disabled}
            onClick={openFilePicker}
          >
            Add file
          </Button>
        </span>
      </Tooltip>
      {onCheckWork ? (
        <>
          <span className={styles.composerShortcutDivider} aria-hidden="true" />
          <Tooltip title="Check my work" placement="top">
            <span>
              <Button
                variant="outlined"
                color="secondary"
                size="extraSmall"
                iconOnly
                aria-label={checkWorkDisabled ? "Checking work" : "Check my work"}
                startIconName="clipboard-list"
                loading={checkWorkDisabled}
                onClick={onCheckWork}
                disabled={disabled || checkWorkDisabled}
              />
            </span>
          </Tooltip>
        </>
      ) : null}
      {showModelSelector ? (
        <Dropdown
          role="action"
          size="extraSmall"
          buttonVariant="outlined"
          buttonColor="secondary"
          label={selectedTutorMode.label}
          startIconName={selectedTutorMode.iconName}
          className={styles.modelDropdown}
          aria-label={`Tutor mode: ${selectedTutorMode.label}`}
          disabled={disabled}
          menuPlacement="bottomRight"
          options={tutorModeOptions}
          onAction={(value) => setTutorRequestMode(value as TutorRequestMode)}
        />
      ) : null}
    </div>
  ) : undefined;

  return (
    <div
      className={`${styles.inputSection} ${
        showDropHelper ? styles.inputSectionDropActive : ""
      } ${
        disabled ? styles.inputSectionDisabled : ""
      }`}
    >
      <div
        className={styles.inputComposer}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
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

        {attachmentRow}

        <div
          ref={composerRef}
          className={`${styles.composerFrame} ${
            isDragOverInput ? styles.composerFrameDropActive : ""
          } ${
            isShimmering ? styles.composerFrameShimmer : ""
          }`}
          data-force-send={forceSendEnabled ? "true" : undefined}
          onClickCapture={handleComposerClickCapture}
        >
          <AiChatInput
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            onSubmit={handleSubmit}
            onAddFile={hasCustomLeftActions ? undefined : openFilePicker}
            leftActions={leftActions}
            placeholder={
              placeholder ?? (isClarified ? "Message AI Tutor..." : "Type something...")
            }
            disabled={disabled}
            textareaProps={{
              onInput: syncTextareaOverflow,
              onKeyDown: (event) => {
                if (disabled) return;
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  forceSendEnabled
                ) {
                  event.preventDefault();
                  onSend();
                }
              },
            }}
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className={styles.fileInput}
          onChange={onUploadFileSelection}
        />
      </div>
    </div>
  );
}
