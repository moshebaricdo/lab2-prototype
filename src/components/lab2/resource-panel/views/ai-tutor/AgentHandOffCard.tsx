import { Button } from "@moshebaricdo/cads-react";
import { FaIcon } from "../../../../ui/icons/FaIcon";
import type { FaIconName } from "../../../../../icons/faProRegularCodepoints";
import type { AgentHandOffCardData } from "../../../../../types/chat";
import styles from "./AgentHandOffCard.module.scss";

interface AgentHandOffCardProps {
  handOff: AgentHandOffCardData;
  disabled?: boolean;
  onAction?: () => void;
}

export function AgentHandOffCard({
  handOff,
  disabled = false,
  onAction,
}: AgentHandOffCardProps) {
  const dispatched = handOff.status === "dispatched";
  const hasBrief = Boolean(handOff.brief?.trim());
  const headerLabel = hasBrief
    ? `Send to ${handOff.label}`
    : `Switch to ${handOff.label}`;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <FaIcon
          name={(handOff.iconName ?? "robot") as FaIconName}
          size="xs"
          className={styles.headerIcon}
        />
        {headerLabel}
      </div>
      <div className={styles.body}>
        {handOff.reason ? (
          <p className={styles.reason}>{handOff.reason}</p>
        ) : null}
        {hasBrief ? <p className={styles.brief}>{handOff.brief}</p> : null}
        <Button
          variant="contained"
          color="primary"
          size="small"
          fullWidth
          startIconName={dispatched ? "check" : hasBrief ? "play" : "arrow-right"}
          disabled={disabled || dispatched || !onAction}
          onClick={onAction}
        >
          {dispatched ? "Sent" : hasBrief ? "Run" : "Switch"}
        </Button>
      </div>
    </div>
  );
}
