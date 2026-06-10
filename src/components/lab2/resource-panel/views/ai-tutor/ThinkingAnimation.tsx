import { useState, useEffect, useMemo } from "react";
import robotGif from "../../../../../assets/thinking-state/thinking-state-light.gif";
import styles from "./ThinkingAnimation.module.scss";

const SPINNER_TERMS = [
  "Thinking",
  "Analyzing",
  "Reading",
  "Scanning",
  "Reviewing",
  "Checking",
  "Parsing",
  "Processing",
  "Understanding",
  "Examining",
  "Building",
  "Creating",
  "Generating",
  "Forming",
  "Crafting",
  "Assembling",
  "Structuring",
  "Shaping",
  "Composing",
  "Mapping",
  "Solving",
  "Figuring",
  "Caramelizing",
  "Connecting",
  "Refining",
  "Iterating",
  "Adjusting",
  "Tuning",
  "Aligning",
  "Organizing",
  "Tracking",
  "Tracing",
  "Following",
  "Inspecting",
  "Evaluating",
  "Exploring",
  "Probing",
  "Decoding",
  "Interpreting",
  "Measuring",
  "Cooking",
  "Collecting",
  "Combobulating",
  "Filtering",
  "Selecting",
  "Whisking",
  "Comparing",
  "Balancing",
  "Simplifying",
  "Clarifying",
  "Reading Code",
  "Scanning Page",
  "Checking Boxes",
  "Considering",
  "Tracing Logic",
  "Manifesting",
  "Building Response",
  "Crafting Answer",
  "Thinkmaxxing",
  "Connecting Dots",
  "Focusing",
  "Computing",
  "Precipitating",
  "Perusing",
  "Figuring Out",
  "Inferring",
  "Formulating",
  "Taking Shape",
  "Pulling Together",
  "Lining Up",
  "Crystallizing",
  "Marinating",
  "Gears Turning",
  "Seasoning",
  "Forging",
  "Grokking",
  "Waffling",
  "Canoodling",
  "Kerfuffling",
  "Hedging",
];

const AUTO_COMPLETE_STEPS = 4;
const STEP_DURATION_MS = 3000;

function pickRandomTerms(count: number): string[] {
  const shuffled = [...SPINNER_TERMS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

interface ThinkingAnimationProps {
  onComplete?: () => void;
  autoComplete?: boolean;
  /** Static label that replaces the cycling terms (stops the animation cycle). */
  label?: string;
  /** Prefix prepended to the cycling terms (keeps cycling, e.g. agent name). */
  labelPrefix?: string;
}

export function ThinkingAnimation({
  onComplete,
  autoComplete = true,
  label,
  labelPrefix,
}: ThinkingAnimationProps) {
  const steps = useMemo(() => pickRandomTerms(SPINNER_TERMS.length), []);
  const [stepIndex, setStepIndex] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (label) return undefined;
    const interval = setInterval(() => {
      setStepIndex((prev) => {
        const next = prev + 1;
        if (autoComplete && next >= AUTO_COMPLETE_STEPS) {
          clearInterval(interval);
          if (onComplete) setTimeout(onComplete, 100);
          return prev;
        }
        return next % steps.length;
      });
      setAnimKey((prev) => prev + 1);
    }, STEP_DURATION_MS);
    return () => clearInterval(interval);
  }, [autoComplete, label, onComplete, steps.length]);

  return (
    <div className={styles.container}>
      <div
        key={animKey}
        className={`${styles.iconWrap} ${stepIndex > 0 ? styles.iconPop : ""}`}
      >
        <img src={robotGif} alt="" className={styles.icon} />
      </div>
      <span key={`label-${stepIndex}`} className={styles.label}>
        {label ??
          `${labelPrefix ? `${labelPrefix} · ` : ""}${steps[stepIndex]}...`}
      </span>
    </div>
  );
}
