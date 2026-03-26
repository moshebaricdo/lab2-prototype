import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleInfo,
  faChevronDown,
  faChevronUp,
  faCaretUp,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./InstructionsDrawer.module.scss";

interface InstructionsDrawerProps {
  maxHeight?: number | null;
  onHeightChange?: (height: number) => void;
  onOpenChange?: (isOpen: boolean) => void;
}

export function InstructionsDrawer({
  maxHeight: propMaxHeight,
  onHeightChange,
  onOpenChange,
}: InstructionsDrawerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [height, setHeight] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [isHoveringHandle, setIsHoveringHandle] = useState(false);
  const [contentMaxHeight, setContentMaxHeight] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    if (isOpen) {
      onHeightChange?.(height);
    }
  }, [height, isOpen, onHeightChange]);

  useEffect(() => {
    if (isOpen && contentRef.current && contentMaxHeight === null) {
      const measuredHeight = contentRef.current.scrollHeight + 16;
      setContentMaxHeight(measuredHeight);
    }
  }, [isOpen, contentMaxHeight]);

  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
    setIsResizing(true);
    const startY = event.clientY;
    const startHeight = height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const containerMax = propMaxHeight || window.innerHeight - 200;
      const contentMax = contentMaxHeight || window.innerHeight - 200;
      const upperLimit = Math.min(containerMax, contentMax);
      const nextHeight = Math.max(150, Math.min(startHeight + deltaY, upperLimit));
      setHeight(nextHeight);
      onHeightChange?.(nextHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div className={styles.root}>
      {isOpen ? (
        <div className={styles.drawerWrap}>
          <div className={styles.drawerContent} style={{ height: `${height}px` }}>
            <div className={styles.scrollFrame}>
              <div ref={contentRef} className={styles.scrollContent}>
                <section className={styles.card}>
                  <h2 className={styles.heading}>
                    Style Your Webpage to Match Your Brand Identity
                  </h2>
                  <p className={styles.text}>
                    Your goal is to apply your brand&apos;s colors and fonts to create a
                    consistent, professional look across the entire page.
                  </p>
                  <p className={styles.text}>Make sure to:</p>
                  <ul className={styles.list}>
                    <li className={styles.listItem}>
                      Add the html file as context and prompt the AI to update the file with a
                      link to the stylesheet.
                    </li>
                    <li className={styles.listItem}>
                      Fine-tune specific elements of your webpage so every detail aligns with
                      your brand&apos;s look and feel.
                    </li>
                  </ul>
                  <p className={`${styles.text} ${styles.textStrong}`}>
                    Don&apos;t have your own brand identity kit?{" "}
                    <span className={styles.text}>
                      Attach one from the sample_brand_kits folder to your chat with AI.
                    </span>
                  </p>
                </section>

                <section className={styles.card}>
                  <div className={styles.stepHeader}>
                    <span className={styles.stepIcon}>
                      <FontAwesomeIcon icon={faCaretUp} />
                    </span>
                    <p className={styles.stepTitle}>Helpful Steps</p>
                  </div>
                  <ol className={styles.list}>
                    <li className={styles.listItem}>Generate the Initial Style and save as V1.</li>
                    <li className={styles.listItem}>
                      Make Specific Refinement Prompts. Use targeted prompts to give the AI clear
                      styling instructions, such as:
                      <ul className={styles.nestedList}>
                        <li className={styles.listItem}>
                          &quot;Style the main heading with font [X].&quot;
                        </li>
                        <li className={styles.listItem}>
                          &quot;Change the button background to our secondary color and add a hover
                          effect.&quot;
                        </li>
                        <li className={styles.listItem}>
                          &quot;Make the footer text smaller and light gray.&quot;
                        </li>
                      </ul>
                    </li>
                    <li className={styles.listItem}>Save as Version 2.</li>
                  </ol>
                </section>

                <section className={styles.card}>
                  <p className={styles.stepTitle}>Pro Tips</p>
                  <ul className={styles.list}>
                    <li className={styles.listItem}>
                      Test your styles in the preview panel to see changes in real-time.
                    </li>
                    <li className={styles.listItem}>
                      Use version history to compare different styling approaches.
                    </li>
                    <li className={styles.listItem}>
                      Remember: consistency across all elements creates a professional appearance.
                    </li>
                  </ul>
                </section>
              </div>
            </div>

            <div
              onMouseDown={handleMouseDown}
              onMouseEnter={() => setIsHoveringHandle(true)}
              onMouseLeave={() => setIsHoveringHandle(false)}
              className={styles.resizeHandle}
            >
              <div
                className={`${styles.resizeBar} ${
                  isHoveringHandle || isResizing
                    ? styles.resizeBarActive
                    : styles.resizeBarIdle
                }`}
              />
            </div>
            <div className={styles.bottomBorder} />
          </div>
        </div>
      ) : null}

      <div className={`${styles.toggleWrap} ${isOpen ? styles.toggleWrapOpen : ""}`}>
        <div aria-hidden="true" className={styles.toggleBorder} />
        <button onClick={() => setIsOpen((prev) => !prev)} className={styles.toggleButton}>
          <span className={styles.toggleIcon}>
            <FontAwesomeIcon icon={faCircleInfo} />
          </span>
          <p className={styles.toggleLabel}>{isOpen ? "Hide Instructions" : "Show Instructions"}</p>
          <span className={styles.toggleIcon}>
            <FontAwesomeIcon icon={isOpen ? faChevronUp : faChevronDown} />
          </span>
        </button>
      </div>
    </div>
  );
}
