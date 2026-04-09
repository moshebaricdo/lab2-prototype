import { useState, type FormEvent, type KeyboardEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faRotate,
  faDesktop,
  faMobileScreen,
  faExpand,
  faCompress,
} from "@fortawesome/free-solid-svg-icons";
import { EmptyState } from "./EmptyState";
import { AppButton } from "../../ui/AppButton";
import { SegmentedControl, type SegmentedOption } from "./SegmentedControl";
import styles from "./PreviewPanel.module.scss";

interface PreviewPanelProps {
  hasContent?: boolean;
}

type PreviewMode = "desktop" | "mobile";

export function PreviewPanel({ hasContent = true }: PreviewPanelProps) {
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [isUrlFocused, setIsUrlFocused] = useState(false);
  const [urlValue, setUrlValue] = useState("index.html");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const isNavigationAvailable = false;

  const previewModeOptions: SegmentedOption<PreviewMode>[] = [
    {
      value: "desktop",
      label: "",
      icon: faDesktop,
      ariaLabel: "Desktop preview",
      title: "Desktop preview",
    },
    {
      value: "mobile",
      label: "",
      icon: faMobileScreen,
      ariaLabel: "Mobile preview",
      title: "Mobile preview",
    },
  ];

  const handleCloseFullscreen = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsFullscreen(false);
      setIsClosing(false);
    }, 200);
  };

  const normalizeUrlValue = (value: string) => value.trim() || "index.html";

  const handleUrlSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUrlValue((current) => normalizeUrlValue(current));
    setIsUrlFocused(false);
  };

  const handleUrlInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Escape") {
      return;
    }
    setUrlValue((current) => normalizeUrlValue(current));
    setIsUrlFocused(false);
    event.currentTarget.blur();
  };

  const handleRefresh = () => {
    setUrlValue((current) => normalizeUrlValue(current));
  };

  const renderUrlBar = () => (
    <div className={styles.urlWrap}>
      <div className={styles.urlBox}>
        <AppButton
          variant="tertiary"
          tone="gray"
          aria-label="Back"
          title="Back"
          icon={<FontAwesomeIcon icon={faChevronLeft} />}
          size="xs"
          disabled={!isNavigationAvailable}
        />
        <AppButton
          variant="tertiary"
          tone="gray"
          aria-label="Forward"
          title="Forward"
          icon={<FontAwesomeIcon icon={faChevronRight} />}
          size="xs"
          disabled={!isNavigationAvailable}
        />

        {isUrlFocused ? (
          <form className={styles.urlForm} onSubmit={handleUrlSubmit}>
            <input
              type="text"
              value={urlValue}
              onChange={(event) => setUrlValue(event.target.value)}
              onBlur={() => {
                setUrlValue((current) => normalizeUrlValue(current));
                setIsUrlFocused(false);
              }}
              onKeyDown={handleUrlInputKeyDown}
              autoFocus
              className={styles.urlInput}
              aria-label="Preview path"
            />
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsUrlFocused(true)}
            className={styles.urlDisplay}
            aria-label="Edit preview path"
            title="Edit preview path"
          >
            {urlValue}
          </button>
        )}

        <AppButton
          variant="tertiary"
          tone="gray"
          onClick={handleRefresh}
          aria-label="Refresh preview"
          title="Refresh preview"
          icon={<FontAwesomeIcon icon={faRotate} />}
          size="xs"
        />
      </div>
    </div>
  );

  const renderModeToggle = () => (
    <div className={styles.segmentWrap}>
      <SegmentedControl<PreviewMode>
        options={previewModeOptions}
        value={previewMode}
        onChange={(mode) => setPreviewMode(mode)}
      />
    </div>
  );

  const renderControls = (isInFullscreen: boolean) => (
    <div className={styles.controlBar}>
      <div className={styles.controlInner}>
        {renderUrlBar()}
        <div className={styles.rightActions}>
          {renderModeToggle()}
          <AppButton
            variant="tertiary"
            tone="gray"
            onClick={isInFullscreen ? handleCloseFullscreen : () => setIsFullscreen(true)}
            aria-label={
              isInFullscreen ? "Exit fullscreen preview" : "Open fullscreen preview"
            }
            title={
              isInFullscreen ? "Exit fullscreen preview" : "Open fullscreen preview"
            }
            icon={
              <FontAwesomeIcon icon={isInFullscreen ? faCompress : faExpand} />
            }
            size="xs"
          />
        </div>
      </div>
    </div>
  );

  const renderPreviewContent = () => (
    <div className={styles.previewBody}>
      {!hasContent ? (
        <EmptyState
          type="preview"
          heading="Nothing to preview"
          description="Your project preview will appear here once you've created or opened a page with content."
        />
      ) : (
        <div className={styles.previewCenter}>
          <div
            className={`${styles.previewFrame} ${
              previewMode === "mobile" ? styles.mobileFrame : ""
            }`}
          >
            {renderWebsitePreview()}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className={styles.root}>
        {renderControls(false)}
        {renderPreviewContent()}
      </div>

      {isFullscreen ? (
        <div className={styles.overlay}>
          <div className={`${styles.modal} ${isClosing ? styles.scaleDown : styles.scaleUp}`}>
            {renderControls(true)}
            {renderPreviewContent()}
          </div>
        </div>
      ) : null}
    </>
  );
}

function renderWebsitePreview() {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .preview-body{font-family:Arial,sans-serif;margin:0;padding:0;background-color:#f0f0f0}
            .preview-header{background-color:#333;color:#fff;padding:1rem;text-align:center}
            .preview-nav{background-color:#444;padding:.75rem;display:flex;justify-content:center;gap:1.5rem;flex-wrap:wrap}
            .preview-nav a{color:#fff;text-decoration:none;padding:.5rem 1rem;border-radius:4px;transition:background-color .2s}
            .preview-nav a:hover{background-color:#555}
            .preview-container{max-width:1200px;margin:2rem auto;padding:0 1rem}
            .preview-hero{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:3rem 2rem;border-radius:8px;text-align:center;margin-bottom:2rem}
            .preview-hero h1{margin:0 0 1rem 0;font-size:2.5rem}
            .preview-hero p{font-size:1.2rem;margin:0 0 1.5rem 0}
            .preview-button{background-color:#fff;color:#667eea;border:none;padding:.75rem 2rem;font-size:1rem;font-weight:bold;border-radius:4px;cursor:pointer;transition:transform .2s}
            .preview-button:hover{transform:scale(1.05)}
            .preview-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1.5rem;margin-bottom:2rem}
            .preview-card{background-color:#fff;padding:1.5rem;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,.1)}
            .preview-card h3{margin:0 0 1rem 0;color:#333}
            .preview-card p{margin:0;color:#666;line-height:1.6}
            .preview-footer{background-color:#333;color:#fff;text-align:center;padding:2rem 1rem;margin-top:2rem}
            @media (max-width:768px){.preview-hero h1{font-size:2rem}.preview-hero p{font-size:1rem}.preview-cards{grid-template-columns:1fr}}
          `,
        }}
      />
      <div className="preview-body">
        <header className="preview-header">
          <h1>My First Webpage</h1>
        </header>
        <nav className="preview-nav">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a href="#contact">Contact</a>
        </nav>
        <div className="preview-container">
          <div className="preview-hero">
            <h1>Welcome to My Website</h1>
            <p>Building amazing web experiences with HTML and CSS</p>
            <button className="preview-button">Get Started</button>
          </div>
          <div className="preview-cards">
            <div className="preview-card">
              <h3>Responsive Design</h3>
              <p>This website looks great on all devices, from mobile phones to desktop computers.</p>
            </div>
            <div className="preview-card">
              <h3>Modern Layout</h3>
              <p>Built with modern CSS techniques including flexbox and grid for flexible layouts.</p>
            </div>
            <div className="preview-card">
              <h3>Clean Code</h3>
              <p>Semantic HTML and well-organized CSS make this code easy to understand and maintain.</p>
            </div>
          </div>
        </div>
        <footer className="preview-footer">
          <p>&copy; 2025 My First Webpage. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
