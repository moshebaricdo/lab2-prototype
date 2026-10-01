import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { Bar } from "@visx/shape";
import { useMemo, useState } from "react";
import { useElementSize } from "../../../../hooks/useElementSize";
import {
  labelFill,
  labelIndexer,
  OTHER_LABEL_INDEX,
} from "./viz/labelPalette";
import styles from "./DataStudio.module.scss";

export interface DistributionEntry {
  label: string;
  count: number;
  isOther?: boolean;
}

interface ColumnDistributionChartProps {
  data: DistributionEntry[];
  /** Spoken summary, e.g. "Bat 1, Bear 1, Other 20". */
  ariaLabel: string;
  /** Natural-sort label list for stable palette indices (Testing viz uses the same order). */
  labelOrder?: string[];
}

/** Matches `--shape-md` (6px) on tall bars; shrinks with height for small pills. */
const BAR_RADIUS = 6;
/** Gap from bar baseline to x-axis labels. */
const AXIS_LABEL_OFFSET = 6;
/** Matches `--leading-body-xxs` on `.chartAxisLabel` (label-4). */
const AXIS_LABEL_LINE_HEIGHT = 16;
const MARGIN = {
  top: 0,
  right: 8,
  bottom: AXIS_LABEL_OFFSET + AXIS_LABEL_LINE_HEIGHT,
  left: 24,
};

function barCornerRadius(barWidth: number, barHeight: number) {
  if (barHeight <= 0) return 0;
  return Math.min(BAR_RADIUS, barWidth / 2, barHeight / 2);
}

interface HoveredBar {
  entry: DistributionEntry;
  fill: string;
  centerX: number;
  topY: number;
}

function truncateLabel(label: string, maxLength = 10) {
  return label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;
}

function barFill(
  entry: DistributionEntry,
  barIndex: number,
  indexOf: ((label: string) => number) | undefined,
) {
  if (entry.isOther) return labelFill(OTHER_LABEL_INDEX);
  if (indexOf) return labelFill(indexOf(entry.label));
  return labelFill(barIndex);
}

function DistributionChart({
  width,
  height,
  data,
  ariaLabel,
  labelOrder,
}: ColumnDistributionChartProps & { width: number; height: number }) {
  const [hovered, setHovered] = useState<HoveredBar | undefined>();
  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerHeight = Math.max(0, height - MARGIN.top - MARGIN.bottom);
  const maxCount = Math.max(1, ...data.map((entry) => entry.count));
  const indexOf = useMemo(
    () => (labelOrder ? labelIndexer(labelOrder) : undefined),
    [labelOrder],
  );

  const xScale = useMemo(
    () =>
      scaleBand<string>({
        domain: data.map((entry) => entry.label),
        range: [0, innerWidth],
        padding: 0.28,
      }),
    [data, innerWidth],
  );

  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [0, maxCount],
        range: [innerHeight, 0],
        nice: true,
      }),
    [innerHeight, maxCount],
  );

  const yTicks = yScale.ticks(Math.min(4, maxCount + 1));

  if (innerWidth <= 0 || innerHeight <= 0 || data.length === 0) {
    return null;
  }

  return (
    <div
      className={styles.distributionChartStage}
      onPointerLeave={() => setHovered(undefined)}
    >
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={ariaLabel}
        className={styles.distributionChartSvg}
      >
        <Group left={MARGIN.left} top={MARGIN.top}>
          {yTicks.map((tick) => {
            const y = yScale(tick) ?? 0;
            return (
              <line
                key={tick}
                x1={0}
                x2={innerWidth}
                y1={y}
                y2={y}
                className={styles.chartGridLine}
              />
            );
          })}

          {data.map((entry, barIndex) => {
            const x = xScale(entry.label) ?? 0;
            const barWidth = xScale.bandwidth();
            const barHeight =
              entry.count > 0
                ? Math.max(
                    0,
                    innerHeight - (yScale(entry.count) ?? innerHeight),
                  )
                : 0;
            const y = innerHeight - barHeight;
            const radius = barCornerRadius(barWidth, barHeight);
            const fill = barFill(entry, barIndex, indexOf);

            return (
              <Group key={entry.label}>
                {barHeight > 0 ? (
                  <Bar
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx={radius}
                    ry={radius}
                    fill={fill}
                  />
                ) : null}
                <rect
                  x={x}
                  y={0}
                  width={barWidth}
                  height={innerHeight}
                  fill="transparent"
                  className={styles.chartBarHit}
                  onPointerEnter={() =>
                    setHovered({
                      entry,
                      fill,
                      centerX: MARGIN.left + x + barWidth / 2,
                      topY: MARGIN.top + y,
                    })
                  }
                />
              </Group>
            );
          })}

          <AxisLeft
            scale={yScale}
            tickValues={yTicks}
            hideAxisLine
            hideTicks
            tickLabelProps={{
              className: styles.chartAxisLabel,
              textAnchor: "end",
              dx: -4,
              dy: 3,
            }}
          />

          <AxisBottom
            top={innerHeight}
            scale={xScale}
            tickLength={0}
            hideAxisLine
            hideTicks
            tickFormat={(value) => truncateLabel(String(value))}
            tickComponent={({ x, formattedValue, className }) => {
              const entry = data.find(
                (item) => truncateLabel(item.label) === formattedValue,
              );
              return (
                <text
                  x={x}
                  y={MARGIN.bottom}
                  dominantBaseline="text-after-edge"
                  textAnchor="middle"
                  className={className}
                >
                  {entry ? <title>{entry.label}</title> : null}
                  {formattedValue}
                </text>
              );
            }}
            tickLabelProps={(_value, index) => {
              const entry = data[index];
              return {
                className: entry?.isOther
                  ? styles.chartAxisLabelMuted
                  : styles.chartAxisLabel,
              };
            }}
          />
        </Group>
      </svg>

      {hovered ? (
        <div
          className={styles.chartTooltipAnchor}
          style={{ left: hovered.centerX, top: hovered.topY }}
        >
          <div
            key={hovered.entry.label}
            className={styles.chartTooltip}
            role="tooltip"
          >
            <span
              className={styles.chartTooltipSwatch}
              style={{ background: hovered.fill }}
              aria-hidden
            />
            <span className={styles.chartTooltipLabel}>{hovered.entry.label}</span>
            <span className={styles.chartTooltipValue}>{hovered.entry.count}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ColumnDistributionChart({
  data,
  ariaLabel,
  labelOrder,
}: ColumnDistributionChartProps) {
  const { ref, size } = useElementSize<HTMLDivElement>();

  if (data.length === 0) return null;

  const width = size.width;
  const height = size.height;

  return (
    <div ref={ref} className={styles.distributionChart}>
      {width > 0 && height > 0 ? (
        <DistributionChart
          width={width}
          height={height}
          data={data}
          ariaLabel={ariaLabel}
          labelOrder={labelOrder}
        />
      ) : null}
    </div>
  );
}
