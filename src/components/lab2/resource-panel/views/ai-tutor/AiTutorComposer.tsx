import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type RefObject,
} from "react";
import { Button, Dropdown, TextInput, Tooltip } from "@moshebaricdo/cads-react";
import { FileChip } from "../../../../ui/FileChip";
import { faIconForFileName, fileExtensionLabelFromName, getFileChipIconProps } from "../../../../ui/fileChipMeta";
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

const TEXTAREA_MAX_HEIGHT = 132;

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
  const { isKeyboardFocusWithin, focusWithinProps } =
    useKeyboardFocusWithin<HTMLDivElement>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shimmerTimeoutRef = useRef<number | null>(null);
  const [isShimmering, setIsShimmering] = useState(false);
  const [canTextareaScrollUp, setCanTextareaScrollUp] = useState(false);
  const [canTextareaScrollDown, setCanTextareaScrollDown] = useState(false);
  const showDropHelper = isDragOverInput && attachedFiles.length === 0;

  const updateTextareaScrollFades = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const hasOverflow = textarea.scrollHeight - textarea.clientHeight > 1;
    setCanTextareaScrollUp(hasOverflow && textarea.scrollTop > 1);
    setCanTextareaScrollDown(
      hasOverflow && textarea.scrollTop + textarea.clientHeight < textarea.scrollHeight - 1,
    );
  }, []);

  const syncTextareaOverflow = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, TEXTAREA_MAX_HEIGHT);
    textarea.style.height = `${nextHeight}px`;
    const hasOverflow = textarea.scrollHeight > nextHeight + 1;
    textarea.style.overflowY = hasOverflow ? "auto" : "hidden";

    updateTextareaScrollFades();
  }, [updateTextareaScrollFades]);

  useLayoutEffect(() => {
    syncTextareaOverflow();
  }, [chatInput, syncTextareaOverflow]);

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
  const tutorModeOptions = useMemo(
    () =>
      TUTOR_MODE_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
        iconName: option.iconName,
      })),
    [],
  );

  return (
    <div
      className={`${styles.inputSection} ${
        isClarified ? styles.inputSectionClarified : ""
      } ${
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
              const fileIcon = getFileChipIconProps(displayName);
              return (
                <FileChip
                  key={fileLabel}
                  fileName={displayName}
                  nameTitle={fileLabel}
                  extensionLabel={metadataLabel}
                  iconName={fileIcon.iconName}
                  iconFamily={fileIcon.iconFamily}
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
          <div className={styles.textareaFrame}>
            <TextInput
              ref={(node) => {
                textareaRef.current = node?.querySelector("textarea") ?? null;
              }}
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              onScroll={updateTextareaScrollFades}
              onKeyDown={(event) => {
                if (disabled) return;
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  onSend();
                }
              }}
              placeholder={placeholder ?? (isClarified ? "Message AI Tutor..." : "Type something...")}
              className={styles.textarea}
              disabled={disabled}
              rows={1}
              multiline
              size="small"
              color="secondary"
            />
            {canTextareaScrollUp ? (
              <div className={`${styles.textareaFade} ${styles.textareaFadeTop}`} />
            ) : null}
            {canTextareaScrollDown ? (
              <div className={`${styles.textareaFade} ${styles.textareaFadeBottom}`} />
            ) : null}
          </div>
          <div className={styles.inputActions}>
            <div className={styles.composerShortcutGroup}>
              <Tooltip title="Add file" placement="top">
                <span>
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="extraSmall"
                    iconOnly
                    aria-label="Add file"
                    startIconName="plus"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                  />
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
                <Button
                  variant="contained"
                  color="primary"
                  size="extraSmall"
                  iconOnly
                  startIconName="arrow-up"
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
