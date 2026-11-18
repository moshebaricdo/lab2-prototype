import { useCallback, useState } from "react";
import Dialog from "@mui/material/Dialog";
import type { TrainingRowWalkProps } from "../TrainingModalShell";
import { useTrainingWalk } from "../trainingWalk";
import { SplitIntroStage } from "./SplitIntroStage";
import { SPLIT_INTRO_TIMELINE } from "./splitIntroTimeline";
import { useStoryClock } from "./useStoryClock";

/** The scrim behind a CADS Modal (`Modal.js`), so this one sits on the same dark. */
const SCRIM = "color-mix(in srgb, var(--background-neutral-black-fixed) 80%, transparent)";
/** The stage's width (Figma Training/Testing modal). */
const WIDTH = 800;

/**
 * The lab's decision-tree training modal (default `trainingAnimation`,
 * `"split"`): the data becomes a cluster, parts into training and test
 * rows, the training rows sort into the tree, and the test rows are run
 * through it (`SplitIntroStage`).
 *
 * The stage is the whole surface: its steps are the header and it draws
 * the action row, so this is a bare dialog rather than a CADS Modal
 * (which always draws its own title bar and footer). It plays from the
 * tuned timeline on a plain clock; the DialKit dock stays in the sandbox
 * (`/experiments/ailab-split`).
 */
export function TrainingSplitModal(props: TrainingRowWalkProps) {
  const { open, onClose, onTest, canTest } = props;
  const walk = useTrainingWalk(props, "split");
  /* The story's length depends on the tree and the test rows: the stage works it out. */
  const [storyEnd, setStoryEnd] = useState<number | null>(null);
  const clock = useStoryClock(open, storyEnd);
  const onDuration = useCallback((seconds: number) => setStoryEnd(seconds), []);
  return (
    <Dialog
      open={open}
      /* As the sort-and-quiz modal: Cancel is always there, so the scrim and Escape close it too. */
      onClose={onClose}
      aria-label="Training your model"
      maxWidth={false}
      fullWidth
      disableEnforceFocus
      slotProps={{
        backdrop: { sx: { backgroundColor: SCRIM } },
        paper: {
          sx: {
            background: "transparent",
            boxShadow: "none",
            maxWidth: WIDTH,
            maxHeight: "calc(100% - 48px)",
            margin: "24px",
            /* A short window scrolls the modal rather than squeezing the canvas. */
            overflowY: "auto",
          },
        },
      }}
    >
      <SplitIntroStage
        data={props}
        walk={walk}
        tuning={SPLIT_INTRO_TIMELINE}
        time={clock.time}
        playing={!clock.paused && !clock.done}
        actions={{
          paused: clock.paused,
          onTogglePause: clock.togglePause,
          onRestart: clock.restart,
          onSkip: clock.skip,
          onBack: onClose,
          onContinue: canTest ? onTest : onClose,
        }}
        onDuration={onDuration}
      />
    </Dialog>
  );
}
