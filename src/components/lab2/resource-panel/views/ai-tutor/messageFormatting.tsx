import type { ReactNode } from "react";
import { AppButton } from "../../../../ui/AppButton";
import { FaIcon } from "../../../../ui/icons/FaIcon";
import type { FileChange } from "../../../../../types/chat";
import styles from "./AiTutorPanel.module.scss";

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

const FILE_STATUS_ICON: Record<FileChange["status"], { name: "circle-plus" | "pen-circle" | "circle-trash"; className: string }> = {
  new: { name: "circle-plus", className: styles.fileChangesIconNew },
  modified: { name: "pen-circle", className: styles.fileChangesIconModified },
  deleted: { name: "circle-trash", className: styles.fileChangesIconDeleted },
};

function pathBasename(path: string) {
  const normalized = path.replace(/\\/g, "/");
  return normalized.split("/").filter(Boolean).at(-1) ?? path;
}

export async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall back for browsers that expose clipboard but deny the async API.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

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
          onClick={() => void copyTextToClipboard(code)}
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

function canOpenFileChangeInPreview(change: FileChange) {
  return /\.(?:html|htm)$/i.test(change.fileName);
}

interface FileChangesCardProps {
  changes: FileChange[];
  onOpenFileInEditor?: (change: FileChange) => void;
  onOpenFileInPreview?: (change: FileChange) => void;
}

export function FileChangesCard({
  changes,
  onOpenFileInEditor,
  onOpenFileInPreview,
}: FileChangesCardProps) {
  return (
    <div className={styles.fileChangesCard}>
      <div className={styles.fileChangesHeader}>Files modified</div>
      {changes.map((fc) => {
        const icon = FILE_STATUS_ICON[fc.status];
        const canOpenInPreview = canOpenFileChangeInPreview(fc);
        const displayFileName = pathBasename(fc.fileName);
        const showActions = fc.status !== "deleted" && Boolean(
          onOpenFileInEditor || (onOpenFileInPreview && canOpenInPreview),
        );
        return (
          <div
            key={fc.fileName}
            className={`${styles.fileChangesRow} ${showActions ? styles.fileChangesRowInteractive : ""}`}
            tabIndex={showActions ? 0 : undefined}
          >
            <FaIcon name={icon.name} size="xs" className={icon.className} />
            <span className={styles.fileChangesName} title={fc.fileName}>
              {displayFileName}
            </span>
            <span className={styles.fileChangesMeta}>
              <span className={styles.fileChangesStatWrap}>
                <FileChangeDiffStat fc={fc} />
              </span>
              {showActions && (
                <span className={styles.fileChangesActions}>
                  {onOpenFileInEditor && (
                    <AppButton
                      variant="tertiary"
                      tone="gray"
                      size="xs"
                      iconName="code"
                      aria-label={`Open ${displayFileName} in code editor`}
                      title={`Open ${displayFileName} in code editor`}
                      onClick={() => onOpenFileInEditor(fc)}
                    />
                  )}
                  {onOpenFileInPreview && canOpenInPreview && (
                    <AppButton
                      variant="tertiary"
                      tone="gray"
                      size="xs"
                      iconName="eye"
                      aria-label={`Open ${displayFileName} in preview`}
                      title={`Open ${displayFileName} in preview`}
                      onClick={() => onOpenFileInPreview(fc)}
                    />
                  )}
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function renderMessageContent(content: string): ReactNode {
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
