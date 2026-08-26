import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Dialog } from "@moshebaricdo/cads-react";
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
  deserializeAgentBackpackItem,
  isAgentBackpackItem,
} from "../../../../lib/backpack/agentBackpack";
import {
  BACKPACK_TYPE_FILTER_ALL,
  filterBackpackItems,
  filterBackpackItemsByType,
  getBackpackFilterOptions,
  getBackpackTypeFilterOptions,
  partitionBackpackItemsByAvailability,
  sortBackpackItems,
  type BackpackFilterId,
  type BackpackSortMode,
  type BackpackTypeFilterId,
} from "../../../../lib/backpack/backpackFilters";
import { BackpackFilterDropdown } from "./backpack/BackpackFilterDropdown";
import { BackpackFilterPills } from "./backpack/BackpackFilterPills";
import { BackpackTypeFilterControls } from "./backpack/BackpackTypeFilterControls";
import { BackpackSupportedToggle } from "./backpack/BackpackSupportedToggle";
import { NameInputModal } from "../../../ide/weblab2/views/NameInputModal";
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
      <Button
        type="button"
        variant="text"
        color="secondary"
        size="extraSmall"
        onClick={onReset}
      >
        Show all files
      </Button>
    </div>
  );
}

export function BackpackPanel({
  importLab,
  onImportItem,
  filterExperiment = "type-availability",
}: BackpackPanelProps) {
  const {
    items,
    removeItem,
    renameItem,
    showImportErrorAlert,
    setShowImportErrorAlert,
    reportImportError,
    clearImportError,
  } = useBackpack();
  const [importedItemIds, setImportedItemIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [renameTarget, setRenameTarget] = useState<BackpackItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BackpackItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<BackpackFilterId>("all");
  const [activeTypeFilter, setActiveTypeFilter] = useState<BackpackTypeFilterId>(
    BACKPACK_TYPE_FILTER_ALL,
  );
  const [sortMode, setSortMode] = useState<BackpackSortMode>("name-asc");
  const [showSupportedOnly, setShowSupportedOnly] = useState(false);
  const [isUnsupportedExpanded, setIsUnsupportedExpanded] = useState(false);

  const filterOptions = useMemo(
    () => getBackpackFilterOptions(items, importLab),
    [items, importLab],
  );

  const typeFilterOptions = useMemo(
    () =>
      filterExperiment === "type-availability"
        ? getBackpackTypeFilterOptions(items)
        : [],
    [filterExperiment, items],
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
    if (filterExperiment === "type-availability") {
      return sortBackpackItems(
        filterBackpackItemsByType(items, activeTypeFilter),
        sortMode,
      );
    }
    return items;
  }, [
    activeFilter,
    activeTypeFilter,
    filterExperiment,
    importLab,
    items,
    showSupportedOnly,
    sortMode,
  ]);

  const { generalItems, sketchLabItems } = useMemo(
    () => partitionBackpackItems(filteredItems),
    [filteredItems],
  );

  const availabilityPartition = useMemo(
    () =>
      filterExperiment === "type-availability"
        ? partitionBackpackItemsByAvailability(filteredItems, importLab)
        : null,
    [filterExperiment, filteredItems, importLab],
  );

  useEffect(() => {
    if (!filterOptions.some((option) => option.id === activeFilter)) {
      setActiveFilter("all");
    }
  }, [activeFilter, filterOptions]);

  useEffect(() => {
    if (
      filterExperiment === "type-availability" &&
      !typeFilterOptions.some((option) => option.id === activeTypeFilter)
    ) {
      setActiveTypeFilter(BACKPACK_TYPE_FILTER_ALL);
    }
  }, [activeTypeFilter, filterExperiment, typeFilterOptions]);

  useEffect(() => {
    if (!showImportErrorAlert) return undefined;
    const timeoutId = window.setTimeout(() => setShowImportErrorAlert(false), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [showImportErrorAlert, setShowImportErrorAlert]);

  const importActionTooltip =
    importLab === "aichatlab" ? "Add to chat" : "Add to project";

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
    window.setTimeout(() => {
      setImportedItemIds((current) => {
        if (!current.has(item.id)) return current;
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
    }, 2000);
  };

  const renderItem = (item: BackpackItem) => {
    // Saved agents recall into the roster, not the file tree — render them with
    // the agent glyph + "AGENT" label and no add-to-project affordance.
    if (isAgentBackpackItem(item)) {
      const specialist = deserializeAgentBackpackItem(item);
      return (
        <BackpackFileChip
          key={item.id}
          item={item}
          iconNameOverride={specialist?.iconName}
          metaLabelOverride="AGENT"
          onDownload={() => downloadBackpackItem(item)}
          onRename={() => setRenameTarget(item)}
          onDelete={() => setDeleteTarget(item)}
        />
      );
    }

    const importAllowedByLab = importLab
      ? canImportBackpackItemToLab(item, importLab)
      : false;
    const canPerformImport = Boolean(onImportItem && importAllowedByLab);

    return (
      <BackpackFileChip
        key={item.id}
        item={item}
        addedToProject={importedItemIds.has(item.id)}
        showImportButton={Boolean(importLab)}
        importSupported={importAllowedByLab}
        importDisabledTooltip={BACKPACK_IMPORT_UNSUPPORTED_TOOLTIP}
        importActionTooltip={importActionTooltip}
        onAddToProject={
          canPerformImport ? () => handleAddToProject(item) : undefined
        }
        onDownload={() => downloadBackpackItem(item)}
        onRename={() => setRenameTarget(item)}
        onDelete={() => setDeleteTarget(item)}
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

  const renderAvailabilitySortedList = () => {
    if (!availabilityPartition) return null;
    const { supported, unsupported } = availabilityPartition;

    return (
      <>
        {supported.length > 0 ? renderFlatItemList(supported) : null}
        {unsupported.length > 0 ? (
          <>
            <div className={styles.sectionDivider}>
              <span className={styles.sectionDividerLine} aria-hidden="true" />
              <div className={styles.unsupportedToggle}>
                <Button
                  type="button"
                  variant="text"
                  color="secondary"
                  size="extraSmall"
                  endIconName={
                    isUnsupportedExpanded ? "chevron-up" : "chevron-down"
                  }
                  aria-expanded={isUnsupportedExpanded}
                  aria-controls="backpack-unsupported-list"
                  onClick={() =>
                    setIsUnsupportedExpanded((previous) => !previous)
                  }
                >
                  Not supported in this lab ({unsupported.length})
                </Button>
              </div>
              <span className={styles.sectionDividerLine} aria-hidden="true" />
            </div>
            {isUnsupportedExpanded ? (
              <div
                id="backpack-unsupported-list"
                className={styles.itemList}
              >
                {unsupported.map(renderItem)}
              </div>
            ) : null}
          </>
        ) : null}
      </>
    );
  };

  const renderFilteredItems = () => {
    if (filteredItems.length === 0) {
      const activeFilterLabel =
        filterExperiment === "type-availability"
          ? (typeFilterOptions.find((option) => option.id === activeTypeFilter)
              ?.label ?? "current filter")
          : (filterOptions.find((option) => option.id === activeFilter)
              ?.label ?? "current filter");

      return (
        <FilteredEmptyState
          message={
            filterExperiment === "compatibility-toggle" && showSupportedOnly
              ? "No files in your backpack are supported in this lab."
              : `No files match the ${activeFilterLabel.toLowerCase()} filter.`
          }
          onReset={() => {
            setActiveFilter("all");
            setActiveTypeFilter(BACKPACK_TYPE_FILTER_ALL);
            setShowSupportedOnly(false);
          }}
        />
      );
    }

    if (filterExperiment === "default") {
      return renderSectionedItemList();
    }

    if (filterExperiment === "type-availability" && availabilityPartition) {
      return renderAvailabilitySortedList();
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
          onChange={(next) => setActiveFilter(next)}
        />
      );
    }

    if (filterExperiment === "type-availability") {
      return (
        <BackpackTypeFilterControls
          options={typeFilterOptions}
          value={activeTypeFilter}
          onChange={(next) => setActiveTypeFilter(next)}
          sortMode={sortMode}
          onSortModeChange={setSortMode}
        />
      );
    }

    if (filterExperiment === "filter-dropdown") {
      return (
        <BackpackFilterDropdown
          options={filterOptions}
          value={activeFilter}
          onChange={(next) => setActiveFilter(next)}
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

  const hasToasts = showImportErrorAlert;

  return (
    <>
    <div className={styles.root}>
      <ScrollArea
        className={styles.scrollArea}
        viewportClassName={styles.scrollViewport}
      >
        {items.length === 0 ? (
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
            {(() => {
              const filterControls = renderFilterControls();
              if (!filterControls) return null;
              const rowClassName =
                filterExperiment === "type-availability"
                  ? `${styles.filterRow} ${styles.filterRowFixed}`
                  : styles.filterRow;
              return <div className={rowClassName}>{filterControls}</div>;
            })()}
            {renderFilteredItems()}
          </div>
        )}
      </ScrollArea>

      {hasToasts ? (
        <div className={styles.toastWrap}>
          {showImportErrorAlert ? (
            <Alert
              sentiment="error"
              size="extraSmall"
              isDismissible
              onClose={() => setShowImportErrorAlert(false)}
            >
              An error occurred while adding the file to your project, please try again.
            </Alert>
          ) : null}
        </div>
      ) : null}
    </div>
    <Dialog
      type="iconTop"
      topIconName="trash-can"
      open={deleteTarget !== null}
      title="Are you sure?"
      description={
        deleteTarget ? (
          <>
            You are about to delete <strong>{deleteTarget.name}</strong> from
            your Backpack.
          </>
        ) : null
      }
      primaryActionLabel="Delete file"
      secondaryActionLabel="Cancel"
      isDismissable
      maxWidth={400}
      onPrimaryAction={() => {
        if (!deleteTarget) return;
        const itemId = deleteTarget.id;
        setDeleteTarget(null);
        removeItem(itemId);
      }}
      onSecondaryAction={() => setDeleteTarget(null)}
      onClose={() => setDeleteTarget(null)}
    />
    <NameInputModal
      isOpen={renameTarget !== null}
      title="Rename file"
      description="Choose a new name for this backpack file."
      fieldLabel="File name"
      placeholder="Enter file name"
      confirmLabel="Rename file"
      initialValue={renameTarget?.name}
      onClose={() => setRenameTarget(null)}
      onSubmit={(value) => {
        if (!renameTarget) return "No file selected.";
        return renameItem(renameTarget.id, value);
      }}
    />
    </>
  );
}
