import { useState } from "react";
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

interface PreviewPanelProps {
  hasContent?: boolean;
}

export function PreviewPanel({ hasContent = true }: PreviewPanelProps) {
  const [previewMode, setPreviewMode] = useState<
    "desktop" | "mobile"
  >("desktop");
  const [isUrlFocused, setIsUrlFocused] = useState(false);
  const [urlValue, setUrlValue] = useState("index.html");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleCloseFullscreen = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsFullscreen(false);
      setIsClosing(false);
    }, 200); // Match animation duration
  };

  // Render the website preview content
  const renderWebsitePreview = () => (
    <div className="w-full h-full">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .preview-body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f0f0f0;
            }
            .preview-header {
              background-color: #333;
              color: white;
              padding: 1rem;
              text-align: center;
            }
            .preview-nav {
              background-color: #444;
              padding: 0.75rem;
              display: flex;
              justify-content: center;
              gap: 1.5rem;
              flex-wrap: wrap;
            }
            .preview-nav a {
              color: white;
              text-decoration: none;
              padding: 0.5rem 1rem;
              border-radius: 4px;
              transition: background-color 0.2s;
            }
            .preview-nav a:hover {
              background-color: #555;
            }
            .preview-container {
              max-width: 1200px;
              margin: 2rem auto;
              padding: 0 1rem;
            }
            .preview-hero {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 3rem 2rem;
              border-radius: 8px;
              text-align: center;
              margin-bottom: 2rem;
            }
            .preview-hero h1 {
              margin: 0 0 1rem 0;
              font-size: 2.5rem;
            }
            .preview-hero p {
              font-size: 1.2rem;
              margin: 0 0 1.5rem 0;
            }
            .preview-button {
              background-color: white;
              color: #667eea;
              border: none;
              padding: 0.75rem 2rem;
              font-size: 1rem;
              font-weight: bold;
              border-radius: 4px;
              cursor: pointer;
              transition: transform 0.2s;
            }
            .preview-button:hover {
              transform: scale(1.05);
            }
            .preview-cards {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 1.5rem;
              margin-bottom: 2rem;
            }
            .preview-card {
              background-color: white;
              padding: 1.5rem;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .preview-card h3 {
              margin: 0 0 1rem 0;
              color: #333;
            }
            .preview-card p {
              margin: 0;
              color: #666;
              line-height: 1.6;
            }
            .preview-footer {
              background-color: #333;
              color: white;
              text-align: center;
              padding: 2rem 1rem;
              margin-top: 2rem;
            }
            @media (max-width: 768px) {
              .preview-hero h1 {
                font-size: 2rem;
              }
              .preview-hero p {
                font-size: 1rem;
              }
              .preview-cards {
                grid-template-columns: 1fr;
              }
            }
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
            <p>
              Building amazing web experiences with HTML
              and CSS
            </p>
            <button className="preview-button">
              Get Started
            </button>
          </div>
          <div className="preview-cards">
            <div className="preview-card">
              <h3>Responsive Design</h3>
              <p>
                This website looks great on all devices,
                from mobile phones to desktop computers.
              </p>
            </div>
            <div className="preview-card">
              <h3>Modern Layout</h3>
              <p>
                Built with modern CSS techniques including
                flexbox and grid for flexible layouts.
              </p>
            </div>
            <div className="preview-card">
              <h3>Clean Code</h3>
              <p>
                Semantic HTML and well-organized CSS make
                this code easy to understand and maintain.
              </p>
            </div>
          </div>
        </div>
        <footer className="preview-footer">
          <p>&copy; 2025 My First Webpage. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );

  // URL Bar Component
  const renderUrlBar = () => (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0">
      <div className="basis-0 bg-white grow h-[24px] min-h-px min-w-px relative rounded-[4px] shrink-0">
        <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
          <div className="box-border content-stretch flex gap-[6px] h-[24px] items-center pl-[2px] pr-[2px] py-0 relative w-full">
            {/* Back/Forward Buttons */}
            <div className="content-stretch flex gap-[2px] items-center relative shrink-0">
              <button className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[4px] shrink-0 p-1 hover:bg-[#f0f2f5] transition-colors">
                <div
                  className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[13px] text-center w-[16px]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <FontAwesomeIcon
                    icon={faChevronLeft}
                    className="leading-[1.25]"
                  />
                </div>
              </button>
              <button className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[4px] shrink-0 p-1 hover:bg-[#f0f2f5] transition-colors">
                <div
                  className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[13px] text-center w-[16px]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <FontAwesomeIcon
                    icon={faChevronRight}
                    className="leading-[1.25]"
                  />
                </div>
              </button>
            </div>

            {/* Path / URL Input */}
            {isUrlFocused ? (
              <input
                type="text"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                onBlur={() => setIsUrlFocused(false)}
                autoFocus
                className="basis-0 grow min-h-px min-w-px h-full px-[8px] rounded-[2px] border-2 border-[#0093a4] bg-white text-[#292f36] text-[12px] outline-none"
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: "var(--font-weight-normal)",
                }}
              />
            ) : (
              <button
                onClick={() => setIsUrlFocused(true)}
                className="basis-0 content-stretch flex grow items-center min-h-px min-w-px not-italic relative shrink-0 text-center text-nowrap whitespace-pre px-[6px] hover:bg-[#f0f2f5] rounded-[2px] transition-colors"
              >
                <p
                  className="leading-[19.68px] relative shrink-0 text-[#292f36] text-[12px]"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: "var(--font-weight-normal)",
                  }}
                >
                  {urlValue}
                </p>
              </button>
            )}

            {/* Refresh Button */}
            <button className="content-stretch flex gap-[4px] items-center justify-center relative rounded-[4px] shrink-0 p-1 hover:bg-[#f0f2f5] transition-colors">
              <div
                className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[13px] text-center w-[16px]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <FontAwesomeIcon
                  icon={faRotate}
                  className="leading-[1.25]"
                />
              </div>
            </button>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="absolute border border-[#b7c1cb] border-solid inset-0 pointer-events-none rounded-[4px]"
        />
      </div>
    </div>
  );

  return (
    <>
      <div className="content-stretch flex flex-col items-start relative size-full">
        {/* Web Lab Control Bar */}
        <div className="bg-[#f0f2f5] h-[40px] min-h-[32px] relative shrink-0 w-full">
          <div
            aria-hidden="true"
            className="absolute border-[#d4dae1] border-[0px_0px_1px] border-solid inset-0 pointer-events-none"
          />
          <div className="flex flex-row items-center min-h-inherit size-full">
            <div className="box-border content-stretch flex gap-[8px] h-[40px] items-center min-h-inherit px-[8px] py-0 relative w-full">
              {/* URL Bar Wrapper */}
              {renderUrlBar()}

              {/* Action Group Right */}
              <div className="content-stretch flex gap-[8px] h-[24px] items-center relative shrink-0">
                {/* Segmented Button Group - Desktop/Mobile */}
                <div className="box-border content-stretch flex items-center pl-0 pr-px py-0 relative shrink-0">
                  <button
                    onClick={() => setPreviewMode("desktop")}
                    className={`box-border content-stretch flex items-center justify-center mr-[-1px] p-[4px] h-[24px] relative rounded-bl-[4px] rounded-tl-[4px] shrink-0 transition-colors ${
                      previewMode === "desktop"
                        ? "bg-[#0093a4]"
                        : "bg-white hover:bg-[#dfe3e9]"
                    }`}
                  >
                    <div
                      aria-hidden="true"
                      className={`absolute border border-solid inset-0 pointer-events-none rounded-bl-[4px] rounded-tl-[4px] ${
                        previewMode === "desktop"
                          ? "border-[#0093a4]"
                          : "border-[#b7c1cb]"
                      }`}
                    />
                    <div
                      className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[13px] text-center w-[16px]"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      <FontAwesomeIcon
                        icon={faDesktop}
                        className={`leading-[1.25] ${
                          previewMode === "desktop"
                            ? "text-white"
                            : "text-[#292f36]"
                        }`}
                      />
                    </div>
                  </button>
                  <button
                    onClick={() => setPreviewMode("mobile")}
                    className={`box-border content-stretch flex items-center justify-center mr-[-1px] p-[4px] h-[24px] relative rounded-br-[4px] rounded-tr-[4px] shrink-0 transition-colors ${
                      previewMode === "mobile"
                        ? "bg-[#0093a4]"
                        : "bg-white hover:bg-[#dfe3e9]"
                    }`}
                  >
                    <div
                      aria-hidden="true"
                      className={`absolute border border-solid inset-0 pointer-events-none rounded-br-[4px] rounded-tr-[4px] ${
                        previewMode === "mobile"
                          ? "border-[#0093a4]"
                          : "border-[#b7c1cb]"
                      }`}
                    />
                    <div
                      className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[13px] text-center w-[16px]"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      <FontAwesomeIcon
                        icon={faMobileScreen}
                        className={`leading-[1.25] ${
                          previewMode === "mobile"
                            ? "text-white"
                            : "text-[#292f36]"
                        }`}
                      />
                    </div>
                  </button>
                </div>

                {/* Expand Button */}
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="box-border content-stretch flex gap-[4px] items-center justify-center p-[4px] h-[24px] relative rounded-[4px] shrink-0 hover:bg-[#dfe3e9] transition-colors"
                >
                  <div
                    className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[14px] text-center w-[16px]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    <FontAwesomeIcon
                      icon={faExpand}
                      className="leading-[1.25]"
                    />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full bg-white overflow-auto">
          {!hasContent ? (
            <EmptyState
              type="preview"
              heading="Nothing to preview"
              description="Your project preview will appear here once you've created or opened a page with content."
            />
          ) : (
            <div className="flex justify-center w-full h-full">
              <div
                className={`w-full h-full transition-all ${
                  previewMode === "mobile" ? "max-w-[375px]" : ""
                }`}
              >
                {renderWebsitePreview()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Preview Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-[rgba(41,47,54,0.8)] flex items-center justify-center p-4 z-50">
          <div className={`bg-white rounded-[4px] w-full h-full max-w-[calc(100vw-32px)] max-h-[calc(100vh-32px)] flex flex-col overflow-hidden ${isClosing ? 'animate-scale-down' : 'animate-scale-up'}`}>
            {/* Fullscreen Control Bar */}
            <div className="bg-[#f0f2f5] h-[40px] min-h-[32px] relative shrink-0 w-full">
              <div
                aria-hidden="true"
                className="absolute border-[#d4dae1] border-[0px_0px_1px] border-solid inset-0 pointer-events-none"
              />
              <div className="flex flex-row items-center min-h-inherit size-full">
                <div className="box-border content-stretch flex gap-[8px] h-[40px] items-center min-h-inherit px-[8px] py-0 relative w-full">
                  {/* URL Bar Wrapper */}
                  {renderUrlBar()}

                  {/* Action Group Right */}
                  <div className="content-stretch flex gap-[8px] h-[24px] items-center relative shrink-0">
                    {/* Segmented Button Group - Desktop/Mobile */}
                    <div className="box-border content-stretch flex items-center pl-0 pr-px py-0 relative shrink-0">
                      <button
                        onClick={() => setPreviewMode("desktop")}
                        className={`box-border content-stretch flex items-center justify-center mr-[-1px] p-[4px] h-[24px] relative rounded-bl-[4px] rounded-tl-[4px] shrink-0 transition-colors ${
                          previewMode === "desktop"
                            ? "bg-[#0093a4]"
                            : "bg-white hover:bg-[#dfe3e9]"
                        }`}
                      >
                        <div
                          aria-hidden="true"
                          className={`absolute border border-solid inset-0 pointer-events-none rounded-bl-[4px] rounded-tl-[4px] ${
                            previewMode === "desktop"
                              ? "border-[#0093a4]"
                              : "border-[#b7c1cb]"
                          }`}
                        />
                        <div
                          className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[13px] text-center w-[16px]"
                          style={{ fontFamily: "var(--font-body)" }}
                        >
                          <FontAwesomeIcon
                            icon={faDesktop}
                            className={`leading-[1.25] ${
                              previewMode === "desktop"
                                ? "text-white"
                                : "text-[#292f36]"
                            }`}
                          />
                        </div>
                      </button>
                      <button
                        onClick={() => setPreviewMode("mobile")}
                        className={`box-border content-stretch flex items-center justify-center mr-[-1px] p-[4px] h-[24px] relative rounded-br-[4px] rounded-tr-[4px] shrink-0 transition-colors ${
                          previewMode === "mobile"
                            ? "bg-[#0093a4]"
                            : "bg-white hover:bg-[#dfe3e9]"
                        }`}
                      >
                        <div
                          aria-hidden="true"
                          className={`absolute border border-solid inset-0 pointer-events-none rounded-br-[4px] rounded-tr-[4px] ${
                            previewMode === "mobile"
                              ? "border-[#0093a4]"
                              : "border-[#b7c1cb]"
                          }`}
                        />
                        <div
                          className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[13px] text-center w-[16px]"
                          style={{ fontFamily: "var(--font-body)" }}
                        >
                          <FontAwesomeIcon
                            icon={faMobileScreen}
                            className={`leading-[1.25] ${
                              previewMode === "mobile"
                                ? "text-white"
                                : "text-[#292f36]"
                            }`}
                          />
                        </div>
                      </button>
                    </div>

                    {/* Compress Button */}
                    <button
                      onClick={handleCloseFullscreen}
                      className="box-border content-stretch flex gap-[4px] items-center justify-center p-[4px] h-[24px] relative rounded-[4px] shrink-0 hover:bg-[#dfe3e9] transition-colors"
                    >
                      <div
                        className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#69788a] text-[14px] text-center w-[16px]"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        <FontAwesomeIcon
                          icon={faCompress}
                          className="leading-[1.25]"
                        />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Fullscreen Live Preview */}
            <div className="flex-1 overflow-auto bg-white">
              <div className="flex justify-center w-full h-full">
                <div
                  className={`w-full h-full transition-all ${
                    previewMode === "mobile" ? "max-w-[375px]" : ""
                  }`}
                >
                  {renderWebsitePreview()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
