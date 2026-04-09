import { useMemo } from "react";
import type { PropsOverrideResult } from "../../../hooks/usePropsOverride";
import type { DevPanelField } from "./types";
import { DevPanelFieldRow } from "./DevPanelFields";
import styles from "./DevPanel.module.scss";

interface DevPanelContentProps<T extends Record<string, unknown>> {
  fields: DevPanelField[];
  overrideResult: PropsOverrideResult<T>;
}

export function DevPanelContent<T extends Record<string, unknown>>({
  fields,
  overrideResult,
}: DevPanelContentProps<T>) {
  const groups = useMemo(() => {
    const map = new Map<string, DevPanelField[]>();
    for (const field of fields) {
      const group = field.group ?? "General";
      if (!map.has(group)) map.set(group, []);
      map.get(group)!.push(field);
    }
    return map;
  }, [fields]);

  return (
    <div className={styles.panelContent}>
      {fields.length === 0 ? (
        <p className={styles.emptyState}>
          No configurable fields registered for this page.
        </p>
      ) : (
        <div className={styles.fieldGroups}>
          {Array.from(groups.entries()).map(([groupName, groupFields]) => (
            <div key={groupName}>
              <p className={styles.groupHeading}>{groupName}</p>
              {groupFields.map((field) => {
                const currentValue = overrideResult.getValue(field.key);
                const isOverridden = field.key in flattenKeys(overrideResult.overrides);
                return (
                  <DevPanelFieldRow
                    key={field.key}
                    field={field}
                    value={currentValue}
                    isOverridden={isOverridden}
                    onChange={(value) => overrideResult.setValue(field.key, value)}
                    onReset={() => overrideResult.resetKey(field.key)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
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
