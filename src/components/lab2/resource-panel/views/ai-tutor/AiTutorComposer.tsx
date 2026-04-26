import type { ChangeEvent, DragEvent, RefObject } from "react";
import { Textarea } from "../../../../ui/textarea";
import { AppButton } from "../../../../ui/AppButton";
import { AppNativeSelect } from "../../../../ui/AppDropdown";
import { FileChip } from "../../../../ui/FileChip";
import { faIconForFileName, fileExtensionLabelFromName } from "../../../../ui/fileChipMeta";
import { FaIcon } from "../../../../ui/icons/FaIcon";
import {
  TUTOR_CODE_MODEL_OPTIONS,
  useTutorApiSettings,
} from "../../../../../hooks/useTutorApiSettings";
import { useKeyboardFocusWithin } from "../../../../../hooks/useKeyboardFocusWithin";
import type { ChatAttachment } from "../../../../../types/chat";
import type { AiTutorInputExperiment } from "../../../../../types/tutor";
import { attachmentDisplayName } from "./attachmentUtils";
import styles from "./AiTutorPanel.module.scss";

interface AiTutorComposerProps {
  inputExperiment: AiTutorInputExperiment;
  chatInput: string;
  setChatInput: (input: string) => void;
  attachedFiles: string[];
  attachmentMeta?: Record<string, ChatAttachment>;
  uploadedAttachmentContexts: Record<string, ChatAttachment>;
  codeAttachmentTimestamps: Record<string, string>;
  isDragOverInput: boolean;
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
  const { codeModel, setCodeModel } = useTutorApiSettings();
  const { isKeyboardFocusWithin, focusWithinProps } =
    useKeyboardFocusWithin<HTMLDivElement>();
  const showDropHelper = isDragOverInput && attachedFiles.length === 0;

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
              return (
                <FileChip
                  key={fileLabel}
                  fileName={displayName}
                  nameTitle={fileLabel}
                  extensionLabel={codeTimestamp ?? meta?.timestamp ?? fileExtensionLabelFromName(displayName)}
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
          }`}
          {...focusWithinProps}
        >
          <Textarea
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
              <label className={styles.modelSelectLabel}>
                <AppNativeSelect
                  value={codeModel}
                  onValueChange={setCodeModel}
                  options={TUTOR_CODE_MODEL_OPTIONS}
                  size="xs"
                  tone="gray"
                  className={styles.modelDropdown}
                  aria-label="Tutor code model"
                />
              </label>
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
