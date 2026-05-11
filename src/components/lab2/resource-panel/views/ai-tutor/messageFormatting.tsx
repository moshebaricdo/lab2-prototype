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

function renderTextBlocks(text: string, keyPrefix: string): ReactNode[] {
  const blocks: ReactNode[] = [];
  const paragraphLines: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    const paragraph = paragraphLines.join(" ");
    blocks.push(
      <p key={`${keyPrefix}-p-${blocks.length}`} className={styles.messageParagraph}>
        {renderInlineFormatting(paragraph)}
      </p>,
    );
    paragraphLines.length = 0;
  };

  const flushList = () => {
    if (!list) return;
    const ListTag = list.ordered ? "ol" : "ul";
    blocks.push(
      <ListTag key={`${keyPrefix}-list-${blocks.length}`} className={styles.messageList}>
        {list.items.map((item, index) => (
          <li key={index} className={styles.messageListItem}>
            {renderInlineFormatting(item)}
          </li>
        ))}
      </ListTag>,
    );
    list = null;
  };

  const pushParagraph = (paragraph: string) => {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) return;
    blocks.push(
      <p key={`${keyPrefix}-p-${blocks.length}`} className={styles.messageParagraph}>
        {renderInlineFormatting(trimmedParagraph)}
      </p>,
    );
  };

  text.replace(/\r\n/g, "\n").split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      return;
    }

    const inlineOrderedMarkers = [...trimmed.matchAll(/(?:^|\s)(\d+)[.)]\s+/g)];
    if (inlineOrderedMarkers.length >= 2) {
      flushParagraph();
      flushList();

      const prefix = trimmed.slice(0, inlineOrderedMarkers[0].index).trim();
      pushParagraph(prefix);

      const inlineItems: string[] = [];
      const trailingParagraphs: string[] = [];
      inlineOrderedMarkers.forEach((marker, index) => {
        const itemStart = (marker.index ?? 0) + marker[0].length;
        const itemEnd = inlineOrderedMarkers[index + 1]?.index ?? trimmed.length;
        let item = trimmed.slice(itemStart, itemEnd).trim();

        const trailingSentence = item.match(/^(.+?\?)(?:\s+([A-Z].+))$/);
        if (trailingSentence) {
          item = trailingSentence[1].trim();
          trailingParagraphs.push(trailingSentence[2].trim());
        }

        if (item) {
          inlineItems.push(item);
        }
      });

      if (inlineItems.length > 0) {
        blocks.push(
          <ol key={`${keyPrefix}-inline-list-${blocks.length}`} className={styles.messageList}>
            {inlineItems.map((item, index) => (
              <li key={index} className={styles.messageListItem}>
                {renderInlineFormatting(item)}
              </li>
            ))}
          </ol>,
        );
      }
      trailingParagraphs.forEach(pushParagraph);
      return;
    }

    const heading = trimmed.match(/^#{1,3}\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push(
        <h3 key={`${keyPrefix}-heading-${blocks.length}`} className={styles.messageHeading}>
          {renderInlineFormatting(heading[1])}
        </h3>,
      );
      return;
    }

    const unordered = trimmed.match(/^[-*]\s+(.+)$/);
    const ordered = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const nextOrdered = Boolean(ordered);
      if (!list || list.ordered !== nextOrdered) {
        flushList();
        list = { ordered: nextOrdered, items: [] };
      }
      list.items.push((ordered?.[1] ?? unordered?.[1] ?? "").trim());
      return;
    }

    flushList();
    paragraphLines.push(trimmed);
  });

  flushParagraph();
  flushList();
  return blocks;
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
    return (
      <div className={styles.messageContent}>
        {renderTextBlocks(content, "message")}
      </div>
    );
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
        return renderTextBlocks(seg, `segment-${i}`);
      })}
    </div>
  );
}
