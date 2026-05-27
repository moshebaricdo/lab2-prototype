import styles from "./UploadProgressRing.module.scss";

export interface UploadProgressRingProps {
  /** Progress from 0 to 100. */
  progress: number;
  /** Outer diameter in pixels. */
  size?: number;
  /** Stroke width in pixels. */
  strokeWidth?: number;
  className?: string;
}

export function UploadProgressRing({
  progress,
  size = 18,
  strokeWidth = 2.5,
  className,
}: UploadProgressRingProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clampedProgress / 100);

  return (
    <svg
      className={[styles.ring, className].filter(Boolean).join(" ")}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clampedProgress)}
      aria-label="Uploading file"
    >
      <circle
        className={styles.track}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
      />
      <circle
        className={styles.fill}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
      />
    </svg>
  );
}
