import { useMemo, useState } from "react";
import type { PropsOverrideResult } from "../../../hooks/usePropsOverride";
import { AppButton } from "../../ui/AppButton";
import { ScrollArea } from "../../ui/scroll-area";
import type { DevPanelField, DevPanelFieldValues } from "./types";
import { DevPanelFieldRow } from "./DevPanelFields";
import styles from "./DevPanel.module.scss";

interface DevPanelContentProps<T extends Record<string, unknown>> {
  fields: DevPanelField[];
  overrideResult: PropsOverrideResult<T>;
  sessionValues?: Record<string, unknown>;
  onSessionValueChange?: (key: string, value: unknown) => void;
  onSessionValueReset?: (key: string) => void;
}

export function DevPanelContent<T extends Record<string, unknown>>({
  fields,
  overrideResult,
  sessionValues,
  onSessionValueChange,
  onSessionValueReset,
}: DevPanelContentProps<T>) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const overriddenKeys = useMemo(
    () => flattenKeys(overrideResult.overrides),
    [overrideResult.overrides],
  );
  const fieldValues = useMemo<DevPanelFieldValues>(
    () => ({
      ...(overrideResult.props as Record<string, unknown>),
      ...(sessionValues ?? {}),
    }),
    [overrideResult.props, sessionValues],
  );
  const visibleFields = useMemo(
    () => fields.filter((field) => field.visibleWhen?.(fieldValues) ?? true),
    [fieldValues, fields],
  );
  const groups = useMemo(() => {
    const map = new Map<string, DevPanelField[]>();
    for (const field of visibleFields) {
      const group = field.group ?? "General";
      if (!map.has(group)) map.set(group, []);
      map.get(group)!.push(field);
    }
    return Array.from(map.entries()).map(([name, groupFields]) => ({
      name,
      fields: groupFields,
    }));
  }, [visibleFields]);

  const getFieldState = (field: DevPanelField) => {
    if (field.type === "action") {
      return {
        currentValue: undefined,
        isOverridden: false,
        isSessionField: false,
      };
    }

    const isSessionField = field.storage === "session";
    const currentValue = isSessionField
      ? sessionValues?.[field.key]
      : overrideResult.getValue(field.key);
    const isOverridden = isSessionField
      ? Boolean(
          typeof currentValue === "string"
            ? currentValue.trim()
            : currentValue,
        )
      : field.key in overriddenKeys;

    return { currentValue, isOverridden, isSessionField };
  };
  const resetField = (field: DevPanelField) => {
    if (field.type === "action") return;

    if (field.storage === "session") {
      onSessionValueReset?.(field.key);
    } else {
      overrideResult.resetKey(field.key);
    }
  };

  return (
    <ScrollArea className={styles.panelContent} viewportClassName={styles.panelViewport}>
      {visibleFields.length === 0 ? (
        <div className={styles.emptyStateCard}>
          <p className={styles.emptyStateTitle}>No dev controls yet</p>
          <p className={styles.emptyState}>
            No configurable fields registered for this page.
          </p>
        </div>
      ) : (
        <div className={styles.panelInner}>
          <div className={styles.fieldGroups}>
            {groups.map((group) => {
              const isExpanded = expandedGroups[group.name] ?? false;
              const groupFieldsId = `dev-panel-group-${group.name.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

              return (
                <section
                  key={group.name}
                  className={`${styles.groupCard} ${isExpanded ? "" : styles.groupCardCollapsed}`}
                >
                  <div className={styles.groupHeader}>
                    <p className={styles.groupHeading}>{group.name}</p>
                    <AppButton
                      variant="secondary"
                      tone="gray"
                      size="xs"
                      iconName={isExpanded ? "chevron-up" : "chevron-down"}
                      onClick={() => {
                        setExpandedGroups((current) => ({
                          ...current,
                          [group.name]: !isExpanded,
                        }));
                      }}
                      aria-controls={groupFieldsId}
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? "Collapse" : "Expand"} ${group.name} controls`}
                      className={styles.groupToggleButton}
                    />
                  </div>

                  {isExpanded ? (
                    <div className={styles.groupFields} id={groupFieldsId}>
                      {group.fields.map((field) => {
                        const { currentValue, isOverridden, isSessionField } =
                          getFieldState(field);

                        return (
                          <DevPanelFieldRow
                            key={field.key}
                            field={field}
                            value={currentValue}
                            isOverridden={isOverridden}
                            onChange={(value) => {
                              if (isSessionField) {
                                onSessionValueChange?.(field.key, value);
                              } else {
                                overrideResult.setValue(field.key, value);
                              }
                            }}
                            onReset={() => {
                              resetField(field);
                            }}
                          />
                        );
                      })}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        </div>
      )}
    </ScrollArea>
  );
}

function flattenKeys(
  obj: Record<string, unknown>,
  prefix = "",
): Record<string, true> {
  const result: Record<string, true> = {};
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flattenKeys(value as Record<string, unknown>, fullKey));
    } else {
      result[fullKey] = true;
    }
  }
  return result;
}
