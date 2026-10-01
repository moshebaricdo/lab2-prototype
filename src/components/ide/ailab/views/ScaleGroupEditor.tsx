import { useEffect, useRef, useState } from "react";
import { Button, TextInput } from "@moshebari/cads-react";
import { countBuckets, scaleColumnId } from "../../../../lib/aiLab";
import type {
  AiLabColumn,
  AiLabDataRow,
  AiLabScale,
} from "../../../../types/aiLab";
import { labelFill } from "./viz/labelPalette";
import styles from "./ScaleGroupEditor.module.scss";

interface ScaleGroupEditorProps {
  column: AiLabColumn;
  rows: AiLabDataRow[];
  min: number;
  max: number;
  existing?: AiLabScale;
  onSave: (scale: AiLabScale) => void;
  onRemove?: (scaleId: string) => void;
}

function defaultCuts(min: number, max: number): [number, number] {
  if (min < 60 && max > 100) return [60, 100];
  const span = Math.max(2, max - min);
  const low = Math.round(min + span / 3);
  const high = Math.round(min + (span * 2) / 3);
  return [Math.max(min + 1, low), Math.min(max - 1, Math.max(low + 1, high))];
}

function defaultNames(columnName: string): [string, string, string] {
  return /temp/i.test(columnName)
    ? ["COLD", "WARM", "HOT"]
    : ["Low", "Middle", "High"];
}

/**
 * Turn one numeric column into three named buckets. The source numbers
 * stay; Apply adds a categorical column the Train rail can use.
 */
export function ScaleGroupEditor({
  column,
  rows,
  min,
  max,
  existing,
  onSave,
  onRemove,
}: ScaleGroupEditorProps) {
  const [cuts, setCuts] = useState<[number, number]>(() =>
    existing ? [existing.cuts[0], existing.cuts[1]] : defaultCuts(min, max),
  );
  const [names, setNames] = useState<[string, string, string]>(() =>
    existing
      ? [existing.labels[0], existing.labels[1], existing.labels[2]]
      : defaultNames(column.name),
  );
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!existing) return;
    setCuts([existing.cuts[0], existing.cuts[1]]);
    setNames([existing.labels[0], existing.labels[1], existing.labels[2]]);
  }, [existing]);

  const span = Math.max(1, max - min);
  const counts = countBuckets(rows, column.id, cuts, names);
  const ready = names.every((name) => name.trim().length > 0);

  function clampCuts(next: [number, number]): [number, number] {
    let [low, high] = next;
    low = Math.round(Math.min(Math.max(low, min + 1), max - 2));
    high = Math.round(Math.min(Math.max(high, low + 1), max - 1));
    return [low, high];
  }

  function valueAt(clientX: number): number {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return min;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(min + ratio * span);
  }

  function moveCut(index: 0 | 1, value: number) {
    setCuts((current) => {
      const next: [number, number] = [current[0], current[1]];
      next[index] = value;
      return clampCuts(next);
    });
  }

  const ranges = [
    `below ${cuts[0]}`,
    `${cuts[0]} to ${cuts[1]}`,
    `above ${cuts[1]}`,
  ];
  const widths = [
    ((cuts[0] - min) / span) * 100,
    ((cuts[1] - cuts[0]) / span) * 100,
    ((max - cuts[1]) / span) * 100,
  ];

  return (
    <div className={styles.root}>
      <div className={styles.copy}>
        <h4 className={styles.title}>Group into categories</h4>
        <p className={styles.hint}>
          The numbers stay in {column.name}. This adds a column of names you
          choose — the model will treat those names as if they were in the data.
        </p>
      </div>
      <div ref={barRef} className={styles.bar}>
        {widths.map((width, index) => (
          <div
            key={ranges[index]}
            className={styles.segment}
            style={{ width: `${width}%`, background: labelFill(index) }}
          />
        ))}
        {([0, 1] as const).map((index) => (
          <button
            key={index}
            type="button"
            className={styles.handle}
            style={{ left: `${widths.slice(0, index + 1).reduce((sum, width) => sum + width, 0)}%` }}
            aria-label={`${names[index] || "Category"} boundary ${cuts[index]}`}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
              moveCut(index, valueAt(event.clientX));
            }}
          />
        ))}
      </div>
      <div className={styles.axis}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
      <div className={styles.buckets}>
        {names.map((name, index) => (
          <div key={index} className={styles.bucket}>
            <span
              className={styles.swatch}
              style={{ background: labelFill(index) }}
              aria-hidden
            />
            <TextInput
              size="small"
              color="secondary"
              label={ranges[index]}
              value={name}
              onChange={(event) => {
                const value = event.target.value;
                setNames((current) => {
                  const next: [string, string, string] = [...current];
                  next[index] = value;
                  return next;
                });
              }}
            />
            <span className={styles.count}>{counts[index]} rows</span>
          </div>
        ))}
      </div>
      <div className={styles.actions}>
        <Button
          size="small"
          variant="contained"
          color="primary"
          disabled={!ready}
          onClick={() =>
            onSave({
              id: scaleColumnId(column.id),
              sourceColumnId: column.id,
              name: `${column.name} (scale)`,
              cuts,
              labels: names.map((name) => name.trim()),
            })
          }
        >
          {existing ? "Update column" : "Add column"}
        </Button>
        {existing && onRemove ? (
          <Button
            size="small"
            variant="text"
            color="tertiary"
            onClick={() => onRemove(existing.id)}
          >
            Remove column
          </Button>
        ) : null}
        {existing ? (
          <p className={styles.note}>
            {existing.name} is on the sheet. Choose it under Using, then Train
            model. The tree will ask your names.
          </p>
        ) : null}
      </div>
    </div>
  );
}
