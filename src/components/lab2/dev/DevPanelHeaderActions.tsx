import { useState } from "react";
import { useLocation } from "react-router-dom";
import { AppActionDropdown } from "../../ui/AppDropdown";
import { AppButton } from "../../ui/AppButton";
import { AppTextField } from "../../ui/AppTextField";
import { Dialog } from "../../ui/Dialog";
import dialogStyles from "../../ui/Dialog.module.scss";
import { Tooltip } from "../../ui/Tooltip";
import { useSavedVariants } from "../../../hooks/useSavedVariants";
import type { PropsOverrideResult } from "../../../hooks/usePropsOverride";
import type { DevPanelShareParamsProvider } from "../resource-panel/Sidebar.types";
import { isProgressionLevelPath } from "../../../lib/levelShareLinks";
import { buildShareLinkDropdownItems } from "../../../lib/shareLinkActions";

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
  const showLockedProgression = isProgressionLevelPath(location.pathname);
  const shareLinkItems = buildShareLinkDropdownItems(
    { showLockedProgression },
    {
      onLockedLevel: () => {
        const extraSearchParams = getShareParams();
        if (extraSearchParams === null) return;
        overrideResult.copyShareLink("locked-level", { extraSearchParams });
      },
      onLockedProgression: () => {
        const extraSearchParams = getShareParams();
        if (extraSearchParams === null) return;
        overrideResult.copyShareLink("locked-progression", { extraSearchParams });
      },
      onFlow: () => {
        const extraSearchParams = getShareParams();
        if (extraSearchParams === null) return;
        overrideResult.copyShareLink("flow", { extraSearchParams });
      },
    },
  );

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
            <AppButton
              variant="secondary"
              tone="black"
              size="s"
              onClick={() => setShowSaveModal(false)}
            >
              Cancel
            </AppButton>
            <AppButton
              variant="primary"
              tone="purple"
              size="s"
              onClick={handleSaveAndCopy}
              disabled={!saveName.trim()}
            >
              Save and copy
            </AppButton>
          </>
        }
      >
        <div className={dialogStyles.fieldGroup}>
          <AppTextField
            label="Variant name"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveAndCopy();
            }}
            placeholder="e.g. Shorter stems, 2-col layout"
            autoFocus
            size="s"
            tone="gray"
          />
          <p className={dialogStyles.fieldHint}>
            Saves this variant to <strong>/levels</strong> and copies the
            current override link.
          </p>
        </div>
      </Dialog>
      <div className="flex gap-1">
        <Tooltip
          content={saved ? "Saved and copied!" : "Save and copy"}
          position="bottom"
        >
          <AppButton
            variant="tertiary"
            tone="gray"
            size="xs"
            iconName="floppy-disk"
            onClick={() => {
              setSaveName("");
              setShowSaveModal(true);
            }}
            disabled={!overrideResult.hasOverrides && !hasShareParams}
          />
        </Tooltip>
        <AppActionDropdown
          size="xs"
          align="end"
          side="bottom"
          sideOffset={6}
          menuWidth={208}
          listLabel="Share links"
          trigger={
            <AppButton
              variant="tertiary"
              tone="gray"
              size="xs"
              iconName="share-nodes"
              aria-label="Share links"
              title="Share links"
            />
          }
          items={shareLinkItems}
        />
        <Tooltip content="Reset all overrides" position="bottom">
          <AppButton
            variant="tertiary"
            tone="gray"
            size="xs"
            iconName="rotate-left"
            onClick={() => overrideResult.resetAll()}
            disabled={!overrideResult.hasOverrides}
          />
        </Tooltip>
      </div>
    </>
  );
}
