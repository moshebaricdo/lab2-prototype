import { useState } from "react";
import { AppActionDropdown } from "../../../../ui/AppDropdown";
import { AppButton } from "../../../../ui/AppButton";
import { FaIcon } from "../../../../ui/icons/FaIcon";
import { Tooltip } from "../../../../ui/Tooltip";
import { getFileTypeIconConfigForExtension } from "../../../../../lib/fileTypeIcons";
import {
  BACKPACK_TYPE_FILTER_ALL,
  BACKPACK_TYPE_FILTER_MEDIA,
  type BackpackSortDirection,
  type BackpackTypeFilterId,
  type BackpackTypeFilterOption,
} from "../../../../../lib/backpack/backpackFilters";
import type { FileTypeIconConfig } from "../../../../../lib/fileTypeIcons";
import styles from "./BackpackTypeFilterControls.module.scss";

interface BackpackTypeFilterControlsProps {
  options: BackpackTypeFilterOption[];
  value: BackpackTypeFilterId;
  onChange: (value: BackpackTypeFilterId) => void;
  sortDirection: BackpackSortDirection;
  onToggleSort: () => void;
}

function iconConfigForType(typeId: BackpackTypeFilterId): FileTypeIconConfig {
  if (typeId === BACKPACK_TYPE_FILTER_ALL) {
    return { family: "solid", name: "files" };
  }
  if (typeId === BACKPACK_TYPE_FILTER_MEDIA) {
    return { family: "solid", name: "image" };
  }
  if (typeId === "other") {
    return { family: "solid", name: "file" };
  }
  return getFileTypeIconConfigForExtension(typeId);
}

export function BackpackTypeFilterControls({
  options,
  value,
  onChange,
  sortDirection,
  onToggleSort,
}: BackpackTypeFilterControlsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption =
    options.find((option) => option.id === value) ?? options[0];
  const selectedIcon = iconConfigForType(selectedOption?.id ?? BACKPACK_TYPE_FILTER_ALL);

  return (
    <div className={styles.root}>
      {options.length > 1 ? (
        <div className={styles.field}>
          <span className={styles.label}>File type</span>
          <AppActionDropdown
            open={isOpen}
            onOpenChange={setIsOpen}
            align="start"
            size="xs"
            menuWidth="var(--radix-popover-trigger-width)"
            listLabel="File type"
            trigger={
              <AppButton
                type="button"
                variant="secondary"
                tone="gray"
                size="xs"
                fullWidth
                className={styles.dropdownTrigger}
                icon={
                  <FaIcon
                    family={selectedIcon.family}
                    name={selectedIcon.name}
                    size="xs"
                  />
                }
              >
                <span className={styles.dropdownValue}>
                  <span className={styles.dropdownText}>
                    {selectedOption?.label ?? "All types"}
                  </span>
                  <FaIcon
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size="xs"
                    className={styles.chevron}
                  />
                </span>
              </AppButton>
            }
            items={options.map((option) => {
              const icon = iconConfigForType(option.id);
              return {
                id: option.id,
                label: `${option.label} (${option.count})`,
                icon: <FaIcon family={icon.family} name={icon.name} size="xs" />,
                onSelect: () => onChange(option.id),
              };
            })}
          />
        </div>
      ) : null}

      <Tooltip
        content={
          sortDirection === "asc" ? "Sorted A–Z — sort Z–A" : "Sorted Z–A — sort A–Z"
        }
        position="top"
      >
        <AppButton
          type="button"
          variant="secondary"
          tone="gray"
          size="xs"
          className={styles.sortButton}
          aria-label="Toggle file name sort order"
          iconName={sortDirection === "asc" ? "arrow-down-a-z" : "arrow-down-z-a"}
          onClick={onToggleSort}
        />
      </Tooltip>
    </div>
  );
}
