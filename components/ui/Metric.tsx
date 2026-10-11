import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

export interface MetricProps {
  value: number;
  label: string;
  unit?: string;
  trend?: number;
}

/** Menampilkan nilai metrik dengan label, unit, dan tren opsional. */
export function Metric({ value, label, unit, trend }: MetricProps) {
  const formattedValue = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 1,
  }).format(value);
  const TrendIcon =
    trend === undefined || trend === 0
      ? Minus
      : trend > 0
        ? ArrowUpRight
        : ArrowDownRight;
  const trendColor =
    trend === undefined || trend === 0
      ? "text-muted"
      : trend > 0
        ? "text-green"
        : "text-pink";

  return (
    <section aria-label={label} className="flex flex-col gap-1">
      <p className="font-mono text-4xl font-semibold tabular-nums text-text">
        {formattedValue}
        {unit && <span className="ml-1 text-2xl">{unit}</span>}
      </p>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        {trend !== undefined && (
          <span
            className={`inline-flex items-center gap-1 font-mono text-sm ${trendColor}`}
            aria-label={`Tren ${trend > 0 ? "naik" : trend < 0 ? "turun" : "tetap"} ${Math.abs(trend)}`}
          >
            <TrendIcon aria-hidden="true" className="size-4" />
            {trend > 0 ? "+" : ""}
            {new Intl.NumberFormat("id-ID", {
              maximumFractionDigits: 1,
            }).format(trend)}
          </span>
        )}
      </div>
    </section>
  );
}
