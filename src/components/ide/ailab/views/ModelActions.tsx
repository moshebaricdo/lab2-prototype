import { Button } from "@moshebaricdo/cads-react";
import type { AiLabController } from "../../../../hooks/useAiLabState";
import type { ModelInspectorTab } from "./ModelInspector";

interface ModelActionsProps {
  lab: AiLabController;
  onOpen?: (tab: ModelInspectorTab) => void;
  /** Control height; Data's Results card uses `small`, Test's strip `extraSmall`. */
  size?: "small" | "extraSmall";
  /** Test's strip emphasizes Save; Data's Results card keeps both outlined. */
  saveVariant?: "outlined" | "contained";
}

/**
 * Scorecard / Save model entry points. Rendered in the same spot on Data
 * (Results card) and Test (metrics strip) so the controls never move or
 * appear late — they are simply disabled until a model exists.
 */
export function ModelActions({
  lab,
  onOpen,
  size = "extraSmall",
  saveVariant = "outlined",
}: ModelActionsProps) {
  const showScorecard = Boolean(lab.config.showModelDetails);
  const showExport = Boolean(lab.config.showExport);
  if (!showScorecard && !showExport) return null;
  const disabled = !lab.model || !onOpen;

  return (
    <>
      {showScorecard ? (
        <Button
          size={size}
          variant="outlined"
          color="secondary"
          startIconName="table-list"
          disabled={disabled}
          onClick={() => onOpen?.("scorecard")}
        >
          Scorecard
        </Button>
      ) : null}
      {showExport ? (
        <Button
          size={size}
          variant={saveVariant}
          color={saveVariant === "contained" ? "primary" : "secondary"}
          startIconName="floppy-disk"
          disabled={disabled}
          onClick={() => onOpen?.("card")}
        >
          Save model
        </Button>
      ) : null}
    </>
  );
}
