import { Button, SegmentedButton } from "@moshebari/cads-react";
import { useState } from "react";
import type { AiLabController } from "../../../../hooks/useAiLabState";
import type { AiLabSection } from "../../../../types/aiLab";
import { PanelHeader } from "../../../ui/PanelHeader";
import { GuidedExplorePanel } from "./GuidedDatasetPanel";
import { GuidedTestPanel } from "./GuidedTestPanel";
import {
  ModelInspector,
  type ModelInspectorTab,
} from "./ModelInspector";
import {
  DatasetPickerModal,
  type DatasetPickerController,
} from "./DatasetPickerModal";
import { AiLabStartOverDialog } from "./AiLabStartOverDialog";
import { SetupModal } from "./SetupModal";
import styles from "./AiLabGuidedWorkspace.module.scss";

const ALGORITHM_NAMES = {
  knn: "K-Nearest Neighbors",
  decisionTree: "Decision Tree",
} as const;

const ALGORITHM_ICONS = {
  knn: "chart-scatter",
  decisionTree: "sitemap",
} as const;

const SECTION_TABS: Record<
  AiLabSection,
  { label: string; iconName: "table" | "sitemap" | "gears" | "flask" }
> = {
  dataset: { label: "Data Set", iconName: "table" },
  algorithm: { label: "Algorithm", iconName: "sitemap" },
  train: { label: "Train", iconName: "gears" },
  test: { label: "Testing", iconName: "flask" },
};

interface AiLabGuidedWorkspaceProps {
  lab: AiLabController;
  /** Upload level: sample datasets and CSV upload, instead of the setup modal. */
  datasetPicker?: DatasetPickerController;
  /**
   * Clears the chosen sheet so the dataset start shows again.
   * Passed when the student can pick a dataset.
   */
  onReturnToDatasetStart?: () => void;
}

export function AiLabGuidedWorkspace({
  lab,
  datasetPicker,
  onReturnToDatasetStart,
}: AiLabGuidedWorkspaceProps) {
  const needsDataset = lab.needsDataset;
  const needsAlgorithm =
    !lab.selectedAlgorithm && !lab.config.algorithmLock;
  const needsSetup = needsDataset || needsAlgorithm;
  const awaitingUpload = Boolean(lab.config.emptyDataset) && needsDataset;
  const canChangeSetup = datasetPicker
    ? lab.canPickDataset && !awaitingUpload
    : !awaitingUpload && (lab.canPickDataset || !lab.config.algorithmLock);
  const [setupOpen, setSetupOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorTab, setInspectorTab] =
    useState<ModelInspectorTab>("scorecard");
  const [confirmReset, setConfirmReset] = useState(false);
  const setupModalOpen =
    !datasetPicker && !awaitingUpload && (needsSetup || setupOpen);
  const canInspect = Boolean(
    lab.config.showModelDetails || lab.config.showExport,
  );

  const openSetup = () => {
    if (datasetPicker) {
      if (!lab.canPickDataset) return;
      setPickerOpen(true);
      return;
    }
    if (!canChangeSetup) return;
    setSetupOpen(true);
  };

  const closeSetup = () => {
    setSetupOpen(false);
  };

  const openInspector = (tab: ModelInspectorTab = "scorecard") => {
    if (!lab.model) return;
    if (tab === "scorecard" && !lab.config.showModelDetails) return;
    if (tab === "card" && !lab.config.showExport) return;
    setInspectorTab(tab);
    setInspectorOpen(true);
  };

  // The header chip owns the algorithm; the dataset chip in the Data header
  // uses the same button pattern. Both open the same setup modal.
  const canChangeAlgorithm = !lab.config.algorithmLock;
  const algorithmLabel = lab.selectedAlgorithm
    ? ALGORITHM_NAMES[lab.selectedAlgorithm]
    : "Choose algorithm";
  const algorithmIcon = lab.selectedAlgorithm
    ? ALGORITHM_ICONS[lab.selectedAlgorithm]
    : "sitemap";

  const returnToDatasetPicker = Boolean(
    datasetPicker && lab.canPickDataset && onReturnToDatasetStart && lab.datasetId,
  );
  const showStartOver =
    !awaitingUpload &&
    (returnToDatasetPicker ||
      lab.trainingRuns.length > 0 ||
      Boolean(lab.shownTest) ||
      Boolean(lab.model && !lab.config.pretrained));

  const confirmStartOver = () => {
    setConfirmReset(false);
    setSetupOpen(false);
    setPickerOpen(false);
    setInspectorOpen(false);
    if (returnToDatasetPicker) {
      onReturnToDatasetStart?.();
      return;
    }
    lab.startOver();
  };

  const showWorkspaceHeader = !(datasetPicker && awaitingUpload);

  return (
    <div className={styles.root}>
      {showWorkspaceHeader ? (
        <PanelHeader
          label="WORKSPACE"
          left={
            lab.visibleSections.length > 1 ? (
              <SegmentedButton
                size="extraSmall"
                aria-label="AI Lab sections"
                value={lab.section === "algorithm" ? "dataset" : lab.section}
                onChange={(value) => {
                  const section = value as AiLabSection;
                  if (lab.canVisit(section)) lab.setSection(section);
                }}
                options={lab.visibleSections.map((section) => {
                  const disabled = !lab.canVisit(section);
                  const tab = SECTION_TABS[section];
                  return {
                    value: section,
                    label: tab.label,
                    iconName: tab.iconName,
                    disabled,
                    tooltip:
                      section === "test" && disabled
                        ? "Testing unlocks once a model is trained"
                        : undefined,
                  };
                })}
              />
            ) : (
              <div />
            )
          }
          right={
            <div className={styles.headerActions}>
              {showStartOver ? (
                <Button
                  variant="outlined"
                  color="secondary"
                  size="extraSmall"
                  startIconName="arrow-rotate-left"
                  onClick={() => setConfirmReset(true)}
                >
                  Start over
                </Button>
              ) : null}
              {canChangeAlgorithm ? (
                <Button
                  variant="outlined"
                  color="secondary"
                  size="extraSmall"
                  className={styles.setupChip}
                  startIconName={algorithmIcon}
                  endIconName="right-left"
                  aria-haspopup="dialog"
                  aria-expanded={setupModalOpen}
                  onClick={openSetup}
                >
                  {algorithmLabel}
                </Button>
              ) : null}
            </div>
          }
        />
      ) : null}

      <div className={styles.body}>
        {lab.section === "test" ? (
          <GuidedTestPanel
            lab={lab}
            onOpenModel={canInspect ? openInspector : undefined}
          />
        ) : (
          <GuidedExplorePanel
            lab={lab}
            onOpenModel={canInspect ? openInspector : undefined}
            onOpenSetup={canChangeSetup ? openSetup : undefined}
            datasetStart={datasetPicker}
          />
        )}
      </div>

      <SetupModal
        lab={lab}
        open={setupModalOpen}
        required={needsSetup}
        onClose={closeSetup}
      />

      {datasetPicker ? (
        <DatasetPickerModal
          {...datasetPicker}
          open={pickerOpen}
          selectedId={lab.datasetId}
          hasModel={Boolean(lab.model)}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}

      {canInspect && lab.model ? (
        <ModelInspector
          lab={lab}
          open={inspectorOpen}
          tab={inspectorTab}
          onClose={() => setInspectorOpen(false)}
          onTryRow={(rowIndex) => {
            lab.loadHoldoutRow(rowIndex);
            if (!lab.config.hideTestTab) lab.setSection("test");
            setInspectorOpen(false);
          }}
        />
      ) : null}

      <AiLabStartOverDialog
        open={confirmReset}
        onConfirm={confirmStartOver}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
