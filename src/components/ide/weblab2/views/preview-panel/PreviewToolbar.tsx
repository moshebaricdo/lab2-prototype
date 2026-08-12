import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Button, SegmentedButton, Tooltip } from "@moshebaricdo/cads-react";
import {
  findPreviewHtmlFile,
  normalizePreviewPath,
  resolvePreviewHref,
  type PreviewHtmlFile,
} from "../buildPreviewSrcDoc";
import type { PreviewMode } from "./types";
import styles from "./PreviewPanel.module.scss";

interface FileNavigationProps {
  path: string;
  htmlFiles: PreviewHtmlFile[];
  onPathChange: (path: string) => void;
}

interface PreviewToolbarProps {
  previewMode: PreviewMode;
  onPreviewModeChange: (mode: PreviewMode) => void;
  fileNavigation?: FileNavigationProps;
  isDesignMode: boolean;
  onToggleDesignMode: () => void;
  showDesignModeControl?: boolean;
  designModeDisabled?: boolean;
  designModeDisabledReason?: string;
  suppressDesignModeTooltip?: boolean;
  previewModeDisabled?: boolean;
  isDebugPanelOpen?: boolean;
  hasDebugActivity?: boolean;
  debugPanelDisabled?: boolean;
  onToggleDebugPanel?: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onStop: () => void;
  onReload: () => void;
  isPreviewStopped?: boolean;
}

const PREVIEW_MODE_OPTIONS = [
  {
    value: "desktop",
    label: "Desktop preview",
    iconName: "desktop" as const,
    tooltip: "Desktop preview",
  },
  {
    value: "mobile",
    label: "Mobile preview",
    iconName: "mobile-screen" as const,
    tooltip: "Mobile preview",
  },
];

function getFileNameHighlightQuery(value: string) {
  const pathSegments = value.trim().split("/").filter(Boolean);
  return pathSegments.at(-1) ?? "";
}

function renderHighlightedFileName(name: string, query: string): ReactNode {
  if (!query) return name;

  const lowerName = name.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchStart = lowerName.indexOf(lowerQuery);

  if (matchStart < 0) return name;

  const matchEnd = matchStart + query.length;
  return (
    <>
      {name.slice(0, matchStart)}
      <span className={styles.suggestionNameMatch}>
        {name.slice(matchStart, matchEnd)}
      </span>
      {name.slice(matchEnd)}
    </>
  );
}

export function PreviewToolbar({
  previewMode,
  onPreviewModeChange,
  fileNavigation,
  isDesignMode,
  onToggleDesignMode,
  showDesignModeControl = true,
  designModeDisabled = false,
  designModeDisabledReason,
  suppressDesignModeTooltip = false,
  previewModeDisabled = false,
  isDebugPanelOpen = false,
  hasDebugActivity = false,
  debugPanelDisabled = false,
  onToggleDebugPanel,
  isFullscreen,
  onToggleFullscreen,
  onStop,
  onReload,
  isPreviewStopped = false,
}: PreviewToolbarProps) {
  const isPreviewUnavailable = previewModeDisabled;
  const currentPath = isPreviewUnavailable ? "" : fileNavigation?.path ?? "index.html";
  const [isUrlFocused, setIsUrlFocused] = useState(false);
  const [urlValue, setUrlValue] = useState(currentPath);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [history, setHistory] = useState<string[]>([currentPath]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const canGoBack = Boolean(fileNavigation) && historyIndex > 0;
  const canGoForward = Boolean(fileNavigation) && historyIndex < history.length - 1;
  const fileNameHighlightQuery = getFileNameHighlightQuery(urlValue);

  const filteredSuggestions = useMemo(() => {
    if (!isUrlFocused || !fileNavigation || fileNavigation.htmlFiles.length === 0) return [];
    const query = urlValue.trim().toLowerCase();
    const matches = query
      ? fileNavigation.htmlFiles.filter(
          (file) =>
            file.name.toLowerCase().includes(query) ||
            file.path.toLowerCase().includes(query),
        )
      : fileNavigation.htmlFiles;
    return matches.slice(0, 6);
  }, [fileNavigation, isUrlFocused, urlValue]);

  useEffect(() => {
    if (isUrlFocused) return;
    setUrlValue(currentPath);
  }, [currentPath, isUrlFocused]);

  useEffect(() => {
    setActiveSuggestionIndex(0);
  }, [filteredSuggestions.length, urlValue]);

  useEffect(() => {
    const currentHistoryPath = history[historyIndex];
    if (currentPath === currentHistoryPath) return;

    setHistory((current) => {
      const next = [...current];
      next[historyIndex] = currentPath;
      return next.length > 0 ? next : [currentPath];
    });
  }, [currentPath, history, historyIndex]);

  const commitPreviewPath = useCallback((path: string, options: { pushHistory?: boolean } = {}) => {
    if (!fileNavigation) return false;
    const htmlFile = findPreviewHtmlFile(fileNavigation.htmlFiles, path);

    if (!htmlFile) {
      setUrlValue(fileNavigation.path);
      setUrlError("Choose an HTML file in this project.");
      return false;
    }

    setUrlError(null);
    setUrlValue(htmlFile.path);
    fileNavigation.onPathChange(htmlFile.path);

    if (options.pushHistory === false) return true;

    const truncated = history.slice(0, historyIndex + 1);
    if (truncated.at(-1) !== htmlFile.path) {
      const next = [...truncated, htmlFile.path];
      setHistory(next);
      setHistoryIndex(next.length - 1);
    }

    return true;
  }, [fileNavigation, history, historyIndex]);

  const handleUrlSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPreviewUnavailable) {
      setIsUrlFocused(false);
      return;
    }
    if (!fileNavigation) {
      setUrlValue((current) => normalizePreviewPath(current) ?? "index.html");
      setIsUrlFocused(false);
      return;
    }

    if (commitPreviewPath(urlValue)) {
      setIsUrlFocused(false);
    }
  };

  const handleUrlInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && filteredSuggestions.length > 0) {
      event.preventDefault();
      setActiveSuggestionIndex((current) =>
        Math.min(current + 1, filteredSuggestions.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp" && filteredSuggestions.length > 0) {
      event.preventDefault();
      setActiveSuggestionIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter" && filteredSuggestions[activeSuggestionIndex]) {
      event.preventDefault();
      if (commitPreviewPath(filteredSuggestions[activeSuggestionIndex].path)) {
        setIsUrlFocused(false);
      }
      return;
    }

    if (event.key === "Escape") {
      setUrlValue(currentPath);
      setUrlError(null);
      setIsUrlFocused(false);
      event.currentTarget.blur();
    }
  };

  const handleBack = () => {
    if (!canGoBack) return;
    const nextIndex = historyIndex - 1;
    const nextPath = history[nextIndex];
    setHistoryIndex(nextIndex);
    commitPreviewPath(nextPath, { pushHistory: false });
  };

  const handleForward = () => {
    if (!canGoForward) return;
    const nextIndex = historyIndex + 1;
    const nextPath = history[nextIndex];
    setHistoryIndex(nextIndex);
    commitPreviewPath(nextPath, { pushHistory: false });
  };

  useEffect(() => {
    if (!fileNavigation) return undefined;

    const handlePreviewMessage = (event: MessageEvent) => {
      const data = event.data as { type?: unknown; href?: unknown } | null;
      if (
        !data ||
        data.type !== "weblab-preview:navigate" ||
        typeof data.href !== "string"
      ) {
        return;
      }

      const targetPath = resolvePreviewHref(data.href, fileNavigation.path);
      if (targetPath) {
        commitPreviewPath(targetPath);
      }
    };

    window.addEventListener("message", handlePreviewMessage);
    return () => window.removeEventListener("message", handlePreviewMessage);
  }, [commitPreviewPath, fileNavigation]);

  const renderUrlBar = () => (
    <div className={styles.urlWrap}>
      <div className={`${styles.urlBox} ${isPreviewUnavailable ? styles.urlBoxDisabled : ""}`}>
        <Button
          variant="text"
          color="tertiary"
          size="extraSmall"
          iconOnly
          startIconName="chevron-left"
          aria-label="Back"
          title="Back"
          className={styles.urlBarButton}
          onClick={handleBack}
          disabled={isPreviewUnavailable || !canGoBack}
        />
        <Button
          variant="text"
          color="tertiary"
          size="extraSmall"
          iconOnly
          startIconName="chevron-right"
          aria-label="Forward"
          title="Forward"
          className={styles.urlBarButton}
          onClick={handleForward}
          disabled={isPreviewUnavailable || !canGoForward}
        />

        <form className={styles.urlForm} onSubmit={handleUrlSubmit}>
          <input
            type="text"
            value={urlValue}
            onChange={(event) => {
              setUrlValue(event.target.value);
              setUrlError(null);
            }}
            onFocus={() => {
              if (fileNavigation && !isPreviewUnavailable) setIsUrlFocused(true);
            }}
            onBlur={() => {
              setUrlValue(currentPath);
              setUrlError(null);
              setIsUrlFocused(false);
            }}
            onKeyDown={handleUrlInputKeyDown}
            placeholder={isPreviewUnavailable ? "No files to preview" : "Enter a local path"}
            readOnly={!fileNavigation || isPreviewUnavailable}
            disabled={isPreviewUnavailable}
            className={`${styles.urlInput} ${
              isUrlFocused ? styles.urlInputEditing : ""
            } ${!fileNavigation || isPreviewUnavailable ? styles.urlInputReadOnly : ""} ${
              isPreviewUnavailable ? styles.urlInputDisabled : ""
            }`}
            aria-label={
              isPreviewUnavailable
                ? "No files to preview"
                : fileNavigation
                  ? "Edit preview path"
                  : "Preview path"
            }
            title={
              isPreviewUnavailable
                ? "No files to preview"
                : fileNavigation
                  ? "Edit preview path"
                  : "Preview path"
            }
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={filteredSuggestions.length > 0}
            aria-controls="preview-path-suggestions"
            aria-activedescendant={
              filteredSuggestions[activeSuggestionIndex]
                ? `preview-path-option-${activeSuggestionIndex}`
                : undefined
            }
          />
          {filteredSuggestions.length > 0 || urlError ? (
            <div className={styles.suggestionPopover}>
              {filteredSuggestions.length > 0 ? (
                <div
                  id="preview-path-suggestions"
                  role="listbox"
                  className={styles.suggestionList}
                >
                  {filteredSuggestions.map((file, index) => (
                    <button
                      key={file.path}
                      id={`preview-path-option-${index}`}
                      type="button"
                      role="option"
                      aria-selected={index === activeSuggestionIndex}
                      className={`${styles.suggestionOption} ${
                        index === activeSuggestionIndex ? styles.suggestionOptionActive : ""
                      }`}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setActiveSuggestionIndex(index)}
                      onClick={() => {
                        commitPreviewPath(file.path);
                        setIsUrlFocused(false);
                      }}
                    >
                      <span className={styles.suggestionName}>
                        {renderHighlightedFileName(file.name, fileNameHighlightQuery)}
                      </span>
                      <span className={styles.suggestionPath}>{file.path}</span>
                    </button>
                  ))}
                </div>
              ) : null}
              {urlError ? (
                <p className={styles.urlError} role="status">
                  {urlError}
                </p>
              ) : null}
            </div>
          ) : null}
        </form>

        <Tooltip
          title={
            isPreviewUnavailable
              ? "Stop preview is unavailable without preview content"
              : isPreviewStopped
                ? "Preview already stopped"
                : "Stop preview"
          }
          placement="bottom"
        >
          <span className={styles.urlBarButtonWrap}>
            <Button
              variant="text"
              color="tertiary"
              size="extraSmall"
              iconOnly
              startIconName="stop"
              onClick={onStop}
              aria-label="Stop preview"
              className={styles.urlBarButton}
              disabled={isPreviewUnavailable || isPreviewStopped}
            />
          </span>
        </Tooltip>
        <Tooltip
          title={
            isPreviewUnavailable
              ? "Reload preview is unavailable without preview content"
              : "Reload preview"
          }
          placement="bottom"
        >
          <span className={styles.urlBarButtonWrap}>
            <Button
              variant="text"
              color="tertiary"
              size="extraSmall"
              iconOnly
              startIconName="rotate"
              onClick={onReload}
              aria-label="Reload preview"
              className={styles.urlBarButton}
              disabled={isPreviewUnavailable}
            />
          </span>
        </Tooltip>
      </div>
    </div>
  );

  const renderDesignModeButton = () => (
    <Button
      variant="outlined"
      color="secondary"
      size="extraSmall"
      iconOnly
      startIconName="palette"
      onClick={onToggleDesignMode}
      aria-label={isDesignMode ? "Turn off design select mode" : "Turn on design select mode"}
      aria-pressed={isDesignMode}
      disabled={designModeDisabled}
      className={isDesignMode ? styles.designModeButtonActive : ""}
    />
  );

  const renderDebugPanelButton = () => {
    if (!onToggleDebugPanel) return null;
    const isDebugPanelUnavailable = isPreviewUnavailable || debugPanelDisabled;

    return (
      <Tooltip
        title={
          isDebugPanelUnavailable
            ? "Debug panel is unavailable without preview content"
            : isDebugPanelOpen
              ? "Hide debug panel"
              : "Debug panel"
        }
        placement="bottom"
      >
        <span className={styles.debugToggleWrap}>
          <Button
            variant="outlined"
            color="secondary"
            size="extraSmall"
            iconOnly
            startIconName="bug"
            onClick={onToggleDebugPanel}
            aria-label={isDebugPanelOpen ? "Hide debug panel" : "Show debug panel"}
            aria-pressed={isDebugPanelOpen}
            disabled={isDebugPanelUnavailable}
            className={isDebugPanelOpen ? styles.designModeButtonActive : ""}
          />
          {!isDebugPanelOpen && hasDebugActivity ? (
            <span className={styles.debugActivityDot} aria-hidden="true" />
          ) : null}
        </span>
      </Tooltip>
    );
  };

  return (
    <div className={styles.controlBar}>
      <div className={styles.controlInner}>
        {renderUrlBar()}
        <div className={styles.rightActions}>
          {renderDebugPanelButton()}
          {showDesignModeControl ? (
            suppressDesignModeTooltip ? (
              renderDesignModeButton()
            ) : (
              <Tooltip
                title={
                  designModeDisabled
                    ? designModeDisabledReason ?? "Design select mode is unavailable"
                    : isDesignMode
                      ? "Exit design mode"
                      : "Design mode"
                }
                placement="bottom"
              >
                {designModeDisabled ? (
                  <span>{renderDesignModeButton()}</span>
                ) : (
                  renderDesignModeButton()
                )}
              </Tooltip>
            )
          ) : null}
          <div className={styles.segmentWrap}>
            <SegmentedButton
              size="extraSmall"
              iconOnly
              options={PREVIEW_MODE_OPTIONS}
              value={previewMode}
              onChange={(nextValue) => onPreviewModeChange(nextValue as PreviewMode)}
              disabled={previewModeDisabled}
              aria-label="Preview mode"
            />
          </div>
          <Button
            variant="text"
            color="tertiary"
            size="extraSmall"
            iconOnly
            startIconName={isFullscreen ? "compress" : "expand"}
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen preview" : "Open fullscreen preview"}
            title={isFullscreen ? "Exit fullscreen preview" : "Open fullscreen preview"}
          />
        </div>
      </div>
    </div>
  );
}

