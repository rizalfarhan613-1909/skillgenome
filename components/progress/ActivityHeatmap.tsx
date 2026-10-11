export interface ActivityDay {
  date: string;
  count: number;
}

export interface ActivityHeatmapProps {
  data: ActivityDay[];
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const WEEKS = 12;
const DAYS_PER_WEEK = 7;

const dayFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
});

const weekdayFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
});

/** Menentukan tingkat intensitas 0–4 dari jumlah aktivitas harian. */
function intensityOf(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

/** Kelas warna dan pola untuk setiap tingkat intensitas (skala cyan). */
const intensityClasses: Record<number, string> = {
  0: "bg-glass border-glass-border",
  1: "bg-cyan/15 border-cyan/20",
  2: "bg-cyan/35 border-cyan/40",
  3: "bg-cyan/60 border-cyan/70",
  4: "bg-cyan border-cyan",
};

const patternClasses: Record<number, string> = {
  0: "",
  1: "[background-image:repeating-linear-gradient(45deg,rgb(255_255_255/0.10)_0_2px,transparent_2px_4px)]",
  2: "[background-image:repeating-linear-gradient(45deg,rgb(255_255_255/0.14)_0_2px,transparent_2px_4px)]",
  3: "[background-image:repeating-linear-gradient(45deg,rgb(255_255_255/0.18)_0_2px,transparent_2px_4px)]",
  4: "",
};

/** Heatmap aktivitas ala GitHub: 7 hari per kolom, 12 kolom minggu, 5 tingkat. */
export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const countByDate = new Map<string, number>();
  for (const entry of data) {
    countByDate.set(entry.date, (countByDate.get(entry.date) ?? 0) + entry.count);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const columns: { date: Date; iso: string; count: number }[][] = [];
  for (let week = WEEKS - 1; week >= 0; week -= 1) {
    const column: { date: Date; iso: string; count: number }[] = [];
    for (let day = 0; day < DAYS_PER_WEEK; day += 1) {
      const offset = week * DAYS_PER_WEEK + (DAYS_PER_WEEK - 1 - day);
      const date = new Date(today.getTime() - offset * DAY_IN_MS);
      const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      column.push({ date, iso, count: countByDate.get(iso) ?? 0 });
    }
    columns.push(column);
  }

  const activeDays = columns
    .flat()
    .filter((cell) => cell.count > 0).length;

  return (
    <section aria-label="Heatmap aktivitas" className="glass rounded-lg p-5 sm:p-6">
      <h2 className="font-heading text-lg font-semibold text-text">
        Aktivitas belajar
      </h2>

      <div className="mt-4 overflow-x-auto">
        <div
          className="grid w-max grid-flow-col gap-1"
          style={{ gridTemplateRows: `repeat(${DAYS_PER_WEEK}, minmax(0, 1fr))` }}
        >
          {columns.map((column) =>
            column.map((cell) => {
              const intensity = intensityOf(cell.count);
              return (
                <span
                  key={cell.iso}
                  className={`size-3.5 rounded-sm border ${intensityClasses[intensity]} ${patternClasses[intensity]}`}
                  role="img"
                  aria-label={`${weekdayFormatter.format(cell.date)} ${dayFormatter.format(cell.date)}: ${cell.count} aktivitas`}
                  data-intensity={intensity}
                />
              );
            }),
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          <span className="font-mono tabular-nums text-text">{activeDays}</span>{" "}
          hari aktif dalam {WEEKS} minggu terakhir
        </p>

        <div className="flex items-center gap-1.5">
          <span className="mr-1 text-xs text-muted">Sedikit</span>
          {[0, 1, 2, 3, 4].map((intensity) => (
            <span
              key={intensity}
              className={`size-3 rounded-sm border ${intensityClasses[intensity]}`}
              aria-hidden="true"
            />
          ))}
          <span className="ml-1 text-xs text-muted">Banyak</span>
        </div>
      </div>
    </section>
  );
}
