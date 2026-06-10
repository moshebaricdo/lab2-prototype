import { useEffect, useMemo, useState } from "react";
import { AlertBanner } from "../../../ui/AlertBanner";
import { AppButton } from "../../../ui/AppButton";
import { FaIcon } from "../../../ui/icons/FaIcon";
import { ScrollArea } from "../../../ui/scroll-area";
import { useBackpack } from "../../../../hooks/BackpackContext";
import type {
  BackpackFilterExperiment,
  BackpackImportLab,
  BackpackItem,
} from "../../../../types/backpack";
import {
  BACKPACK_IMPORT_UNSUPPORTED_TOOLTIP,
  canImportBackpackItemToLab,
} from "../../../../lib/backpack/backpackImportAllowlist";
import {
  filterBackpackItems,
  getBackpackFilterOptions,
  type BackpackFilterId,
} from "../../../../lib/backpack/backpackFilters";
import { BackpackFilterDropdown } from "./backpack/BackpackFilterDropdown";
import { BackpackFilterPills } from "./backpack/BackpackFilterPills";
import { BackpackSupportedToggle } from "./backpack/BackpackSupportedToggle";
import { BackpackFileChip } from "./backpack/BackpackFileChip";
import styles from "./BackpackPanel.module.scss";

interface BackpackPanelProps {
  importLab?: BackpackImportLab;
  onImportItem?: (item: BackpackItem) => true | string | void;
  filterExperiment?: BackpackFilterExperiment;
}

function downloadBackpackItem(item: BackpackItem) {
  const blob = item.thumbnailSrc?.startsWith("data:")
    ? undefined
    : new Blob([item.content], { type: "text/plain;charset=utf-8" });
  const url = item.thumbnailSrc?.startsWith("data:")
    ? item.thumbnailSrc
    : blob
      ? URL.createObjectURL(blob)
      : "";
  if (!url) return;

  const link = document.createElement("a");
  link.href = url;
  link.download = item.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  if (blob) URL.revokeObjectURL(url);
}

function partitionBackpackItems(items: BackpackItem[]) {
  const generalItems: BackpackItem[] = [];
  const sketchLabItems: BackpackItem[] = [];

  for (const item of items) {
    if (item.sourceLab === "sketch-lab") {
      sketchLabItems.push(item);
    } else {
      generalItems.push(item);
    }
  }

  return { generalItems, sketchLabItems };
}

function FilteredEmptyState({
  message,
  onReset,
}: {
  message: string;
  onReset: () => void;
}) {
  return (
    <div className={styles.filteredEmpty}>
      <p className={styles.filteredEmptyText}>{message}</p>
      <AppButton
        type="button"
        variant="tertiary"
        tone="gray"
        size="xs"
        onClick={onReset}
      >
        Show all files
      </AppButton>
    </div>
  );
}

export function BackpackPanel({
  importLab,
  onImportItem,
  filterExperiment = "default",
}: BackpackPanelProps) {
  const {
    items,
    removeItem,
    showSaveSuccessAlert,
    setShowSaveSuccessAlert,
    showSaveErrorAlert,
    setShowSaveErrorAlert,
    showImportErrorAlert,
    setShowImportErrorAlert,
    reportImportError,
    clearImportError,
  } = useBackpack();
  const [importedItemIds, setImportedItemIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [activeFilter, setActiveFilter] = useState<BackpackFilterId>("all");
  const [showSupportedOnly, setShowSupportedOnly] = useState(false);

  const filterOptions = useMemo(
    () => getBackpackFilterOptions(items, importLab),
    [items, importLab],
  );

  const supportedCount = useMemo(
    () =>
      importLab
        ? items.filter((item) => canImportBackpackItemToLab(item, importLab)).length
        : items.length,
    [importLab, items],
  );

  const filteredItems = useMemo(() => {
    if (filterExperiment === "compatibility-toggle" && showSupportedOnly) {
      return filterBackpackItems(items, "supported", importLab);
    }
    if (
      filterExperiment === "content-pills" ||
      filterExperiment === "filter-dropdown"
    ) {
      return filterBackpackItems(items, activeFilter, importLab);
    }
    return items;
  }, [
    activeFilter,
    filterExperiment,
    importLab,
    items,
    showSupportedOnly,
  ]);

  const { generalItems, sketchLabItems } = useMemo(
    () => partitionBackpackItems(filteredItems),
    [filteredItems],
  );

  useEffect(() => {
    if (!filterOptions.some((option) => option.id === activeFilter)) {
      setActiveFilter("all");
    }
  }, [activeFilter, filterOptions]);

  const handleAddToProject = (item: BackpackItem) => {
    if (!onImportItem || !importLab) return;
    if (!canImportBackpackItemToLab(item, importLab)) return;
    clearImportError();
    const result = onImportItem(item);
    if (typeof result === "string") {
      reportImportError();
      return;
    }
    setImportedItemIds((current) => new Set(current).add(item.id));
  };

  const renderItem = (item: BackpackItem) => {
    const canImport = Boolean(
      onImportItem &&
        importLab &&
        canImportBackpackItemToLab(item, importLab),
    );

    return (
      <BackpackFileChip
        key={item.id}
        item={item}
        addedToProject={importedItemIds.has(item.id)}
        importSupported={canImport}
        importDisabledTooltip={BACKPACK_IMPORT_UNSUPPORTED_TOOLTIP}
        onAddToProject={
          onImportItem && importLab ? () => handleAddToProject(item) : undefined
        }
        onDownload={() => downloadBackpackItem(item)}
        onDelete={() => removeItem(item.id)}
      />
    );
  };

  const renderFlatItemList = (listItems: BackpackItem[]) => (
    <div className={styles.itemList}>{listItems.map(renderItem)}</div>
  );

  const renderSectionedItemList = () => (
    <>
      {generalItems.length > 0 ? renderFlatItemList(generalItems) : null}
      {sketchLabItems.length > 0 ? (
        <>
          {generalItems.length > 0 ? (
            <div className={styles.sectionDivider}>
              <span className={styles.sectionDividerLine} aria-hidden="true" />
              <p className={styles.sectionDividerLabel}>Sketch Lab</p>
              <span className={styles.sectionDividerLine} aria-hidden="true" />
            </div>
          ) : null}
          {renderFlatItemList(sketchLabItems)}
        </>
      ) : null}
    </>
  );

  const renderFilteredItems = () => {
    if (filteredItems.length === 0) {
      const activeFilterLabel =
        filterOptions.find((option) => option.id === activeFilter)?.label ??
        "current filter";

      return (
        <FilteredEmptyState
          message={
            filterExperiment === "compatibility-toggle" && showSupportedOnly
              ? "No files in your backpack are supported in this lab."
              : `No files match the ${activeFilterLabel.toLowerCase()} filter.`
          }
          onReset={() => {
            setActiveFilter("all");
            setShowSupportedOnly(false);
          }}
        />
      );
    }

    if (filterExperiment === "default") {
      return renderSectionedItemList();
    }

    return renderFlatItemList(filteredItems);
  };

  const renderFilterControls = () => {
    if (items.length === 0) {
      return null;
    }

    if (filterExperiment === "content-pills") {
      return (
        <BackpackFilterPills
          options={filterOptions}
          value={activeFilter}
          onChange={setActiveFilter}
        />
      );
    }

    if (filterExperiment === "filter-dropdown") {
      return (
        <BackpackFilterDropdown
          options={filterOptions}
          value={activeFilter}
          onChange={setActiveFilter}
        />
      );
    }

    if (filterExperiment === "compatibility-toggle") {
      return (
        <BackpackSupportedToggle
          checked={showSupportedOnly}
          onChange={setShowSupportedOnly}
          supportedCount={supportedCount}
          totalCount={items.length}
        />
      );
    }

    return null;
  };

  const hasAlerts =
    showSaveSuccessAlert || showSaveErrorAlert || showImportErrorAlert;

  return (
    <div className={styles.root}>
      <ScrollArea
        className={styles.scrollArea}
        viewportClassName={styles.scrollViewport}
      >
        {items.length === 0 && !hasAlerts ? (
          <div className={styles.emptyWrap}>
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>
                <FaIcon name="backpack" size="l" />
              </div>
              <h2 className={styles.emptyStateTitle}>Your backpack is empty</h2>
              <p className={styles.emptyStateText}>
                Files you save to your backpack will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className={styles.content}>
            {hasAlerts ? (
              <div className={styles.alertStack}>
                {showSaveSuccessAlert ? (
                  <AlertBanner
                    sentiment="success"
                    size="s"
                    showIcon
                    dismissible
                    onDismiss={() => setShowSaveSuccessAlert(false)}
                  >
                    File successfully saved to Backpack!
                  </AlertBanner>
                ) : null}
                {showSaveErrorAlert ? (
                  <AlertBanner
                    sentiment="danger"
                    size="s"
                    showIcon
                    dismissible
                    onDismiss={() => setShowSaveErrorAlert(false)}
                  >
                    An error occurred while saving to the Backpack, please try again.
                  </AlertBanner>
                ) : null}
                {showImportErrorAlert ? (
                  <AlertBanner
                    sentiment="danger"
                    size="s"
                    showIcon
                    dismissible
                    onDismiss={() => setShowImportErrorAlert(false)}
                  >
                    An error occurred while adding the file to your project, please try again.
                  </AlertBanner>
                ) : null}
              </div>
            ) : null}

            {renderFilterControls()}
            {renderFilteredItems()}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
