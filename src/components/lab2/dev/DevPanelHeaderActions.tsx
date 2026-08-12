import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Button, Dropdown, TextInput, Tooltip } from "@moshebaricdo/cads-react";
import { Dialog } from "../../ui/Dialog";
import { useSavedVariants } from "../../../hooks/useSavedVariants";
import type { PropsOverrideResult } from "../../../hooks/usePropsOverride";
import type { DevPanelShareParamsProvider } from "../resource-panel/Sidebar.types";
import { buildShareLinkDropdownItems } from "../../../lib/shareLinkActions";
import styles from "./DevPanel.module.scss";

interface DevPanelHeaderActionsProps {
  hasShareParams?: boolean;
  devPanelShareParams?: DevPanelShareParamsProvider;
  overrideResult: PropsOverrideResult<Record<string, unknown>>;
}

export function DevPanelHeaderActions({
  hasShareParams = false,
  devPanelShareParams,
  overrideResult,
}: DevPanelHeaderActionsProps) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saved, setSaved] = useState(false);
  const location = useLocation();
  const { saveVariant } = useSavedVariants();
  const getShareParams = () =>
    devPanelShareParams ? devPanelShareParams() : {};
  const shareLinkItems = buildShareLinkDropdownItems({
    onLockedLevel: () => {
      const extraSearchParams = getShareParams();
      if (extraSearchParams === null) return;
      overrideResult.copyShareLink("locked-level", { extraSearchParams });
    },
    onFlow: () => {
      const extraSearchParams = getShareParams();
      if (extraSearchParams === null) return;
      overrideResult.copyShareLink("flow", { extraSearchParams });
    },
  });
  const saveDisabled = !overrideResult.hasOverrides && !hasShareParams;

  const handleSaveAndCopy = () => {
    if (!saveName.trim()) return;
    const extraSearchParams = getShareParams();
    if (extraSearchParams === null) return;
    saveVariant(saveName.trim(), location.pathname, overrideResult.overrides, {
      searchParams: extraSearchParams,
    });
    overrideResult.copyLink({ extraSearchParams });
    setSaveName("");
    setShowSaveModal(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <>
      <Dialog
        open={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title="Save and copy variant"
        footer={
          <>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              onClick={() => setShowSaveModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={handleSaveAndCopy}
              disabled={!saveName.trim()}
            >
              Save and copy
            </Button>
          </>
        }
      >
        <div className={styles.saveFieldGroup}>
          <TextInput
            label="Variant name"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveAndCopy();
            }}
            placeholder="e.g. Shorter stems, 2-col layout"
            autoFocus
            size="small"
            color="secondary"
          />
          <p className={styles.saveFieldHint}>
            Saves this variant to <strong>/levels</strong> and copies the
            current override link.
          </p>
        </div>
      </Dialog>
      <div className="flex gap-1">
        <Tooltip
          title={saved ? "Saved and copied!" : "Save and copy"}
          placement="bottom"
        >
          <span>
            <Button
              variant="text"
              color="tertiary"
              size="extraSmall"
              iconOnly
              startIconName="floppy-disk"
              onClick={() => {
                setSaveName("");
                setShowSaveModal(true);
              }}
              disabled={saveDisabled}
            />
          </span>
        </Tooltip>
        <Dropdown
          role="action"
          size="extraSmall"
          buttonVariant="text"
          buttonColor="tertiary"
          iconOnly
          startIconName="share-nodes"
          aria-label="Share links"
          menuPlacement="bottomRight"
          menuWidth={208}
          options={shareLinkItems.map((item) => ({
            value: item.id,
            label: item.label,
            iconName: item.iconName,
          }))}
          onAction={(actionValue) => {
            shareLinkItems
              .find((item) => item.id === actionValue)
              ?.onSelect();
          }}
        />
        <Tooltip title="Reset all overrides" placement="bottom">
          <span>
            <Button
              variant="text"
              color="tertiary"
              size="extraSmall"
              iconOnly
              startIconName="rotate-left"
              onClick={() => overrideResult.resetAll()}
              disabled={!overrideResult.hasOverrides}
            />
          </span>
        </Tooltip>
      </div>
    </>
  );
}
