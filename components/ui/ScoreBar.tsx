export interface ScoreBarProps {
  value: number;
  target?: number;
  label: string;
}

/** Menampilkan progres, dengan penanda target bila target diberikan. */
export function ScoreBar({ value, target, label }: ScoreBarProps) {
  const boundedValue = Math.max(0, Math.min(100, value));
  const hasTarget = target !== undefined;
  const boundedTarget = hasTarget ? Math.max(0, Math.min(100, target)) : 0;

  return (
    <div className="w-full">
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-text">{label}</span>
        <span className="font-mono text-sm tabular-nums text-muted">
          {Math.round(boundedValue)}%
        </span>
      </div>
      <div
        className="relative h-3 rounded-full bg-glass"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={boundedValue}
        aria-valuetext={`${Math.round(boundedValue)}%`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-cyan transition-[width] duration-300"
          style={{ width: `${boundedValue}%` }}
        />
                {hasTarget && (
          <span
            aria-hidden="true"
            className="absolute -top-1 h-5 w-0.5 rounded-full bg-text shadow-[0_0_6px_rgb(241_245_249_/_0.7)]"
            style={{ left: `${boundedTarget}%` }}
          />
        )}
      </div>
      {hasTarget && (
        <p className="mt-1 text-right text-xs text-muted">
          Target {Math.round(boundedTarget)}%
        </p>
      )}
    </div>
  );
}
