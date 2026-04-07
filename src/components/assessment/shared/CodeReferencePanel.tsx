import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileCode } from "@fortawesome/free-solid-svg-icons";
import type { CodePanelFile } from "../../../data/assessment/codePanel";
import styles from "./CodeReferencePanel.module.scss";

interface CodeReferencePanelProps {
  files: CodePanelFile[];
  /** Short label above the tabs, matching the question card eyebrow. Defaults to "Reference code". */
  eyebrow?: string;
  /** Optional action buttons rendered in the panel header's right side. */
  headerActions?: ReactNode;
  /** When true, the code area becomes an editable textarea instead of read-only. */
  editable?: boolean;
  /** Called with the updated file content when the user edits code. */
  onContentChange?: (fileIndex: number, content: string) => void;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function applySyntaxHighlighting(line: string, language: string) {
  let result = line;

  if (language === "java" || language === "javascript" || language === "js") {
    result = result
      .replace(
        /\b(public|private|protected|static|final|void|class|interface|extends|implements|return|if|else|for|while|do|switch|case|break|continue|new|this|super|import|package|try|catch|finally|throw|throws|boolean|int|long|double|float|char|byte|short|String|null|true|false|var|let|const|function|instanceof|typeof)\b/g,
        '<span class="syntax-keyword">$1</span>',
      )
      .replace(
        /(\/\/.*$)/,
        '<span class="syntax-comment">$1</span>',
      )
      .replace(
        /(&quot;[^&]*?&quot;|&#x27;[^&]*?&#x27;)/g,
        '<span class="syntax-string">$1</span>',
      )
      .replace(
        /\b(\d+)\b/g,
        '<span class="syntax-number">$1</span>',
      );
  }

  if (language === "python") {
    result = result
      .replace(
        /\b(def|class|return|if|elif|else|for|while|in|not|and|or|is|import|from|as|with|try|except|finally|raise|pass|break|continue|True|False|None|self|print|range|len)\b/g,
        '<span class="syntax-keyword">$1</span>',
      )
      .replace(
        /(#.*$)/,
        '<span class="syntax-comment">$1</span>',
      )
      .replace(
        /(&quot;[^&]*?&quot;|&#x27;[^&]*?&#x27;)/g,
        '<span class="syntax-string">$1</span>',
      );
  }

  return result;
}

function FileTab({
  file,
  active,
  onClick,
}: {
  file: CodePanelFile;
  active: boolean;
  onClick?: () => void;
}) {
  const isButton = onClick != null;
  const Tag = isButton ? "button" : "div";

  return (
    <Tag
      type={isButton ? "button" : undefined}
      className={`${styles.tab} ${active ? styles.tabActive : styles.tabIdle}`}
      onClick={onClick}
    >
      <div className={styles.tabIconWrap}>
        <FontAwesomeIcon
          icon={faFileCode}
          className={`${styles.tabIcon} ${active ? styles.tabIconActive : styles.tabIconInactive}`}
        />
      </div>
      <p
        className={`${styles.tabName} ${active ? styles.tabNameActive : styles.tabNameInactive}`}
      >
        {file.name}
      </p>
    </Tag>
  );
}

export function CodeReferencePanel({
  files,
  eyebrow = "Reference code",
  headerActions,
  editable = false,
  onContentChange,
}: CodeReferencePanelProps) {
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const codeScrollRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const codeTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [showOverflowFade, setShowOverflowFade] = useState(false);

  const activeFile = files[activeFileIndex] ?? files[0];
  if (!activeFile) return null;

  const escapedContent = escapeHtml(activeFile.content);
  const lines = escapedContent.split("\n");

  const syncOverflowFade = useCallback((el: HTMLElement | null) => {
    if (!el) {
      setShowOverflowFade(false);
      return;
    }
    const hasOverflow = el.scrollHeight - el.clientHeight > 1;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
    setShowOverflowFade(hasOverflow && !atBottom);
  }, []);

  const handleCodeScroll = () => {
    if (codeScrollRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = codeScrollRef.current.scrollTop;
      syncOverflowFade(codeScrollRef.current);
    }
  };

  const handleTextareaScroll = () => {
    if (codeTextareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = codeTextareaRef.current.scrollTop;
      syncOverflowFade(codeTextareaRef.current);
    }
  };

  useEffect(() => {
    const activeScrollEl = editable ? codeTextareaRef.current : codeScrollRef.current;
    syncOverflowFade(activeScrollEl);

    const rafId = requestAnimationFrame(() => {
      syncOverflowFade(editable ? codeTextareaRef.current : codeScrollRef.current);
    });
    const handleWindowResize = () => {
      syncOverflowFade(editable ? codeTextareaRef.current : codeScrollRef.current);
    };

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", handleWindowResize);
      return () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener("resize", handleWindowResize);
      };
    }

    const observer = new ResizeObserver(() => {
      syncOverflowFade(editable ? codeTextareaRef.current : codeScrollRef.current);
    });
    if (activeScrollEl) {
      observer.observe(activeScrollEl);
    }
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [activeFileIndex, editable, syncOverflowFade, files]);

  return (
    <div className={styles.root}>
      <div className={styles.eyebrowRow}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        {headerActions ? (
          <div className={styles.eyebrowActions}>{headerActions}</div>
        ) : null}
      </div>

      <div className={styles.tabsRow}>
        {files.length > 1
          ? files.map((file, index) => (
              <FileTab
                key={file.name}
                file={file}
                active={index === activeFileIndex}
                onClick={() => setActiveFileIndex(index)}
              />
            ))
          : <FileTab file={activeFile} active />}
      </div>

      <div className={`${styles.codeArea} ${showOverflowFade ? styles.codeAreaFadeVisible : ""}`}>
        <div
          ref={lineNumbersRef}
          className={styles.lineNumbers}
          style={{ overflowY: "hidden" }}
        >
          <div className={styles.lineNumbersInner}>
            {lines.map((_, i) => (
              <div key={i} className={styles.lineNumberCell}>
                <p className={styles.lineNumberText}>{i + 1}</p>
              </div>
            ))}
          </div>
        </div>

        {editable ? (
          <textarea
            ref={codeTextareaRef}
            className={styles.codeTextarea}
            value={activeFile.content}
            onChange={(e) => onContentChange?.(activeFileIndex, e.target.value)}
            onScroll={handleTextareaScroll}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
          />
        ) : (
          <div
            ref={codeScrollRef}
            className={styles.codeScroll}
            onScroll={handleCodeScroll}
          >
            <div className={styles.codeScrollInner}>
              {lines.map((line, i) => (
                <div key={i} className={styles.codeLine}>
                  <p
                    className={styles.codeLineText}
                    dangerouslySetInnerHTML={{
                      __html:
                        applySyntaxHighlighting(line, activeFile.language) ||
                        " ",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
