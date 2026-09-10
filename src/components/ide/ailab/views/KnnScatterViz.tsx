import { AxisBottom, AxisLeft } from "@visx/axis";
import { GlyphCircle } from "@visx/glyph";
import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { scaleLinear, scaleOrdinal } from "@visx/scale";
import { LinePath } from "@visx/shape";
import type {
  AiLabColumn,
  AiLabDataRow,
  AiLabKnnPrediction,
} from "../../../../types/aiLab";
import {
  buildEncodings,
  columnById,
  columnType,
  encodeValue,
  uniqueValues,
} from "../../../../lib/aiLab";
import styles from "./KnnScatterViz.module.scss";

interface ScatterPoint {
  x: number;
  y: number;
  label: string;
  rowIndex?: number;
  kind: "train" | "query" | "neighbor";
}

const LABEL_COLORS = [
  "var(--text-selected-primary)",
  "var(--text-brand-primary)",
  "var(--text-success-primary)",
  "var(--text-warning-primary)",
];

function resolveAxes(
  columns: AiLabColumn[],
  features: string[],
  labelColumn: string,
  axisX?: string,
  axisY?: string,
): [string, string] | null {
  if (axisX && axisY) return [axisX, axisY];
  const numerical = features.filter(
    (feature) => columnType(columns, feature) === "numerical",
  );
  if (numerical.length >= 2) return [numerical[0], numerical[1]];
  if (features.length >= 2) return [features[0], features[1]];
  if (features.length === 1) return [features[0], labelColumn];
  return null;
}

interface KnnScatterVizProps {
  rows: AiLabDataRow[];
  columns: AiLabColumn[];
  features: string[];
  labelColumn: string;
  holdoutIndexes: number[];
  query: AiLabDataRow | undefined;
  prediction: AiLabKnnPrediction | undefined;
  axisX?: string;
  axisY?: string;
}

export function KnnScatterViz(props: KnnScatterVizProps) {
  const axes = resolveAxes(
    props.columns,
    props.features,
    props.labelColumn,
    props.axisX,
    props.axisY,
  );
  if (!axes) {
    return (
      <p className={styles.empty}>
        Add a feature to plot nearest neighbors. Numerical columns are easiest
        to read.
      </p>
    );
  }

  const yIsLabel = axes[1] === props.labelColumn;

  return (
    <div className={styles.root}>
      <p className={styles.empty}>
        {yIsLabel
          ? `Training examples by ${columnById(props.columns, axes[0])?.name} versus the label.`
          : `Training examples by ${columnById(props.columns, axes[0])?.name} and ${columnById(props.columns, axes[1])?.name}.`}{" "}
        The large outlined point is Try it out.
      </p>
      <div className={styles.chart}>
        <ParentSize>
          {({ width, height }) =>
            width > 0 && height > 0 ? (
              <KnnChart {...props} axes={axes} width={width} height={height} />
            ) : null
          }
        </ParentSize>
      </div>
    </div>
  );
}

function KnnChart({
  rows,
  columns,
  features,
  labelColumn,
  holdoutIndexes,
  query,
  prediction,
  axes,
  width,
  height,
}: KnnScatterVizProps & { axes: [string, string]; width: number; height: number }) {
  const [xFeature, yFeature] = axes;
  const holdout = new Set(holdoutIndexes);
  const neighborIndexes = new Set(
    prediction?.neighbors.map((neighbor) => neighbor.rowIndex) ?? [],
  );
  const encodingFeatures = [...new Set([...features, xFeature, yFeature])];
  const encodings = buildEncodings(rows, columns, encodingFeatures);
  const labels = uniqueValues(rows, labelColumn);
  const color = scaleOrdinal<string, string>({
    domain: labels,
    range: LABEL_COLORS,
  });

  const toAxisNumber = (row: AiLabDataRow, feature: string) =>
    encodeValue(feature, row[feature], columns, encodings);

  const trainingPoints: ScatterPoint[] = rows
    .map((row, rowIndex) => ({
      x: toAxisNumber(row, xFeature),
      y: toAxisNumber(row, yFeature),
      label: String(row[labelColumn]),
      rowIndex,
      kind: neighborIndexes.has(rowIndex) ? ("neighbor" as const) : ("train" as const),
    }))
    .filter((point) => point.rowIndex === undefined || !holdout.has(point.rowIndex));

  const axisValue = (feature: string) =>
    feature === labelColumn
      ? (prediction?.prediction ?? labels[0] ?? "")
      : query?.[feature];

  const queryPoint: ScatterPoint | undefined =
    query &&
    String(axisValue(xFeature) ?? "").trim() !== "" &&
    String(axisValue(yFeature) ?? "").trim() !== ""
      ? {
          x: encodeValue(xFeature, axisValue(xFeature) ?? "", columns, encodings),
          y: encodeValue(yFeature, axisValue(yFeature) ?? "", columns, encodings),
          label: prediction?.prediction ?? "query",
          kind: "query",
        }
      : undefined;

  const allPoints = queryPoint ? [...trainingPoints, queryPoint] : trainingPoints;
  const margin = { top: 16, right: 16, bottom: 44, left: 56 };
  const xScale = scaleLinear({
    domain: extent(allPoints.map((point) => point.x)),
    range: [margin.left, width - margin.right],
    nice: columnType(columns, xFeature) === "numerical",
  });
  const yScale = scaleLinear({
    domain: extent(allPoints.map((point) => point.y)),
    range: [height - margin.bottom, margin.top],
    nice: columnType(columns, yFeature) === "numerical",
  });

  return (
    <>
      <svg width={width} height={height} role="img" aria-label="KNN scatter plot">
        <AxisBottom
          top={height - margin.bottom}
          scale={xScale}
          label={columnById(columns, xFeature)?.name ?? xFeature}
          stroke="var(--border-neutral-primary)"
          tickStroke="var(--border-neutral-primary)"
          tickValues={categoricalTicks(rows, xFeature, columns, encodings)}
          tickFormat={categoricalTickFormat(rows, xFeature, columns, encodings)}
          labelProps={{ fill: "var(--text-neutral-tertiary)", fontSize: 11 }}
          tickLabelProps={{ fill: "var(--text-neutral-tertiary)", fontSize: 10 }}
        />
        <AxisLeft
          left={margin.left}
          scale={yScale}
          label={columnById(columns, yFeature)?.name ?? yFeature}
          stroke="var(--border-neutral-primary)"
          tickStroke="var(--border-neutral-primary)"
          tickValues={categoricalTicks(rows, yFeature, columns, encodings)}
          tickFormat={categoricalTickFormat(rows, yFeature, columns, encodings)}
          labelProps={{ fill: "var(--text-neutral-tertiary)", fontSize: 11 }}
          tickLabelProps={{ fill: "var(--text-neutral-tertiary)", fontSize: 10 }}
        />
        <Group>
          {queryPoint
            ? prediction?.neighbors.map((neighbor) => {
                const row = rows[neighbor.rowIndex];
                if (!row) return null;
                return (
                  <LinePath
                    key={neighbor.rowIndex}
                    data={[
                      { x: xScale(queryPoint.x), y: yScale(queryPoint.y) },
                      {
                        x: xScale(toAxisNumber(row, xFeature)),
                        y: yScale(toAxisNumber(row, yFeature)),
                      },
                    ]}
                    x={(point) => point.x}
                    y={(point) => point.y}
                    stroke="var(--border-selected-primary)"
                    strokeWidth={1.5}
                  />
                );
              })
            : null}
          {trainingPoints.map((point) => (
            <GlyphCircle
              key={`${point.rowIndex}-${point.x}-${point.y}`}
              left={xScale(point.x)}
              top={yScale(point.y)}
              size={point.kind === "neighbor" ? 110 : 72}
              fill={color(point.label)}
              stroke={
                point.kind === "neighbor"
                  ? "var(--border-selected-primary)"
                  : "var(--background-neutral-primary)"
              }
              strokeWidth={point.kind === "neighbor" ? 2 : 1}
            />
          ))}
          {queryPoint ? (
            <GlyphCircle
              left={xScale(queryPoint.x)}
              top={yScale(queryPoint.y)}
              size={140}
              fill="var(--background-neutral-primary)"
              stroke="var(--border-selected-primary)"
              strokeWidth={3}
            />
          ) : null}
        </Group>
      </svg>
      <div className={styles.legend}>
        {labels.map((label) => (
          <span key={label} className={styles.legendItem}>
            <span className={styles.swatch} style={{ background: color(label) }} />
            {label}
          </span>
        ))}
        <span className={styles.legendItem}>
          Large outlined point is your try-it-out example.
        </span>
      </div>
    </>
  );
}

function categoricalTicks(
  rows: AiLabDataRow[],
  feature: string,
  columns: AiLabColumn[],
  encodings: ReturnType<typeof buildEncodings>,
): number[] | undefined {
  if (columnType(columns, feature) === "numerical") return undefined;
  return uniqueValues(rows, feature).map((value) =>
    encodeValue(feature, value, columns, encodings),
  );
}

function categoricalTickFormat(
  rows: AiLabDataRow[],
  feature: string,
  columns: AiLabColumn[],
  encodings: ReturnType<typeof buildEncodings>,
) {
  if (columnType(columns, feature) === "numerical") {
    return undefined;
  }
  const labels = Object.fromEntries(
    uniqueValues(rows, feature).map((value) => [
      encodeValue(feature, value, columns, encodings),
      value,
    ]),
  );
  return (value: unknown) => labels[Number(value)] ?? String(value);
}

function extent(values: number[]): [number, number] {
  if (values.length === 0) return [0, 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [min - 1, max + 1];
  const pad = (max - min) * 0.08;
  return [min - pad, max + pad];
}
