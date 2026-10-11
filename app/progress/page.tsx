"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Award, Flame, IdCard, Medal, Repeat2, Target, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BottomTab from "@/components/layout/BottomTab";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { ActivityHeatmap, type ActivityDay } from "@/components/progress/ActivityHeatmap";
import { StreakCounter } from "@/components/progress/StreakCounter";
import { Metric } from "@/components/ui/Metric";
import { useGenomeStore } from "@/store/genome";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const PASSPORT_STORAGE_KEY = "skillgenome-passports";

type PageStatus = "loading" | "ready" | "error";

interface MatchPoint {
  at: string;
  date: string;
  match_pct: number;
}

/** Membentuk kunci tanggal lokal YYYY-MM-DD. */
function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Menghitung streak berturut-turut berakhir hari ini dari data aktivitas. */
function computeStreak(data: ActivityDay[]): number {
  const active = new Set(data.filter((day) => day.count > 0).map((day) => day.date));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let cursor = today;

  if (!active.has(toIsoDate(cursor))) {
    cursor = new Date(cursor.getTime() - DAY_IN_MS);
    if (!active.has(toIsoDate(cursor))) {
      return 0;
    }
  }

  while (active.has(toIsoDate(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - DAY_IN_MS);
  }

  return streak;
}

/** Menyusun 90 hari aktivitas: hari asesmen nyata aktif, sisanya dummy deterministik. */
function buildActivityData(assessedDates: string[]): ActivityDay[] {
  const assessed = new Set(assessedDates);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const data: ActivityDay[] = [];
  for (let offset = 89; offset >= 0; offset -= 1) {
    const date = new Date(today.getTime() - offset * DAY_IN_MS);
    const iso = toIsoDate(date);
    if (assessed.has(iso)) {
      data.push({ date: iso, count: 3 });
      continue;
    }
    const seed = (offset * 2654435761) % 97;
    const isActive = seed % 3 === 0;
    data.push({ date: iso, count: isActive ? (seed % 3) + 1 : 0 });
  }

  return data;
}

interface BadgeDefinition {
  id: string;
  label: string;
  description: string;
  Icon: typeof Award;
}

const BADGES: BadgeDefinition[] = [
  {
    id: "first-assessment",
    label: "First Assessment",
    description: "Selesaikan asesmen pertamamu",
    Icon: Medal,
  },
  {
    id: "seven-day-streak",
    label: "7-day Streak",
    description: "Belajar 7 hari berturut-turut",
    Icon: Flame,
  },
  {
    id: "skill-master",
    label: "Skill Master",
    description: "Capai level Ahli pada satu skill",
    Icon: Trophy,
  },
  {
    id: "consistent-learner",
    label: "Consistent Learner",
    description: "Selesaikan tiga asesmen",
    Icon: Repeat2,
  },
  {
    id: "passport-created",
    label: "Passport Created",
    description: "Buat Skill Passport pertamamu",
    Icon: IdCard,
  },
];

/** Menampilkan progres belajar: statistik, heatmap, riwayat match, dan badge. */
export default function ProgressPage() {
  const [pageStatus, setPageStatus] = useState<PageStatus>("loading");
  const mastery = useGenomeStore((state) => state.mastery);
  const matchScore = useGenomeStore((state) => state.matchScore);
  const history = useGenomeStore((state) => state.history);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve()
      .then(() => useGenomeStore.persist.rehydrate())
      .then(() => {
        if (isMounted) {
          setPageStatus("ready");
        }
      })
      .catch(() => {
        if (isMounted) {
          setPageStatus("error");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const assessedDates = useMemo(
    () =>
      history
        .filter((entry) => Number.isFinite(Date.parse(entry.at)))
        .map((entry) => toIsoDate(new Date(entry.at))),
    [history],
  );

  const activityData = useMemo(
    () => (pageStatus === "ready" ? buildActivityData(assessedDates) : []),
    [assessedDates, pageStatus],
  );

  const streak = useMemo(
    () => (pageStatus === "ready" ? computeStreak(activityData) : 0),
    [activityData, pageStatus],
  );

  const matchPoints: MatchPoint[] = useMemo(
    () =>
      history
        .filter((entry) => Number.isFinite(Date.parse(entry.at)))
        .slice()
        .sort((left, right) => Date.parse(left.at) - Date.parse(right.at))
        .map((entry) => ({
          at: entry.at,
          date: new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "short",
          }).format(new Date(entry.at)),
          match_pct: entry.match_pct,
        })),
    [history],
  );

  const unlocked = useMemo(() => {
    if (pageStatus !== "ready") {
      return new Set<string>();
    }

    const hasSkillMaster =
      mastery !== null && Object.values(mastery).some((value) => value >= 0.8);
    const hasPassport = Object.keys(window.localStorage).some((key) =>
      key.startsWith(`${PASSPORT_STORAGE_KEY}:`),
    );
    return new Set([
      ...(history.length >= 1 ? ["first-assessment"] : []),
      ...(streak >= 7 ? ["seven-day-streak"] : []),
      ...(hasSkillMaster ? ["skill-master"] : []),
      ...(history.length >= 3 ? ["consistent-learner"] : []),
      ...(hasPassport ? ["passport-created"] : []),
    ]);
  }, [history.length, mastery, streak, pageStatus]);

  const matchTrend =
    matchPoints.length >= 2
      ? matchPoints[matchPoints.length - 1].match_pct -
        matchPoints[matchPoints.length - 2].match_pct
      : undefined;

  if (pageStatus === "loading") {
    return (
      <>
        <Navbar />
        <main className="mx-auto min-h-screen max-w-7xl space-y-6 px-4 py-8 sm:px-6">
          <div className="h-10 w-64 animate-pulse rounded bg-glass" />
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="h-24 animate-pulse rounded-lg bg-glass" />
            <div className="h-24 animate-pulse rounded-lg bg-glass" />
            <div className="h-24 animate-pulse rounded-lg bg-glass" />
          </div>
          <div className="h-48 animate-pulse rounded-lg bg-glass" />
          <p className="sr-only" role="status">
            Memuat progres...
          </p>
        </main>
        <Footer />
        <BottomTab />
      </>
    );
  }

  if (pageStatus === "error") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-pink" role="alert">
          Progres tidak dapat dimuat dari penyimpanan lokal.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="min-h-11 rounded-md bg-primary-strong px-5 text-sm font-medium text-white"
        >
          Muat ulang
        </button>
      </main>
    );
  }

  if (history.length === 0) {
    return (
      <>
        <Navbar />
        <main className="mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center px-6 py-16 text-center">
          <p className="mb-3 font-mono text-sm text-cyan">PROGRES KOSONG</p>
          <h1 className="font-heading text-3xl font-semibold text-text sm:text-4xl">
            Selesaikan asesmen dulu
          </h1>
          <p className="mt-4 max-w-xl leading-7 text-muted">
            Riwayat asesmen akan muncul di sini: streak harian, heatmap
            aktivitas, dan perkembangan match% antar asesmen.
          </p>
          <Link
            href="/onboarding"
            className="mt-7 inline-flex min-h-12 items-center rounded-md bg-primary-strong px-6 font-semibold text-white transition-colors hover:bg-primary"
          >
            Mulai asesmen
          </Link>
        </main>
        <Footer />
        <BottomTab />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 pb-72 pt-7 sm:px-6 md:pb-12 md:pt-10 lg:pb-16">
        <header className="mb-8">
          <p className="mb-2 font-mono text-sm text-cyan">PERKEMBANGAN BELAJAR</p>
          <h1 className="font-heading text-3xl font-semibold text-text sm:text-4xl">
            Progress
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Streak, aktivitas harian, dan perkembangan kecocokan role antar
            asesmen.
          </p>
        </header>

        <section
          aria-label="Ringkasan statistik"
          className="grid gap-5 sm:grid-cols-3"
        >
          <StreakCounter streak={streak} />

          <article className="glass rounded-lg p-5">
            <Metric value={history.length} label="Total asesmen" />
          </article>

          <article className="glass rounded-lg p-5">
            <Metric
              value={matchScore?.match_pct ?? 0}
              label="Match% saat ini"
              unit="%"
              trend={matchTrend}
            />
          </article>
        </section>

        <div className="mt-6">
          <ActivityHeatmap data={activityData} />
        </div>

        <section
          aria-label="Riwayat kecocokan"
          className="glass mt-6 rounded-lg p-5 sm:p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <Target aria-hidden="true" size={18} strokeWidth={1.5} className="text-cyan" />
            <h2 className="font-heading text-lg font-semibold text-text">
              Match% antar asesmen
            </h2>
          </div>

          {matchPoints.length >= 2 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={matchPoints}>
                  <CartesianGrid stroke="rgb(255 255 255 / 0.08)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#94A3B8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#94A3B8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <ReferenceLine
                    y={80}
                    stroke="#94A3B8"
                    strokeDasharray="5 5"
                    label={{
                      value: "Target 80%",
                      fill: "#94A3B8",
                      position: "insideTopRight",
                    }}
                  />
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Match"]}
                    contentStyle={{
                      background: "#0A0A1A",
                      border: "1px solid rgb(255 255 255 / 0.08)",
                      borderRadius: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="match_pct"
                    name="Match"
                    stroke="#22D3EE"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#22D3EE" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>

              <table className="sr-only">
                <caption>Riwayat match% antar asesmen</caption>
                <thead>
                  <tr>
                    <th scope="col">Tanggal</th>
                    <th scope="col">Match</th>
                  </tr>
                </thead>
                <tbody>
                  {matchPoints.map((point) => (
                    <tr key={point.at}>
                      <th scope="row">{point.date}</th>
                      <td>{point.match_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="leading-7 text-muted">
              Ulangi asesmen untuk melihat perkembangan match%. Grafik muncul
              setelah dua asesmen atau lebih.
            </p>
          )}
        </section>

        <section aria-label="Pencapaian" className="mt-6">
          <h2 className="mb-4 font-heading text-lg font-semibold text-text">
            Pencapaian
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BADGES.map(({ id, label, description, Icon }) => {
              const isUnlocked = unlocked.has(id);
              return (
                <li
                  key={id}
                  className={`glass flex items-center gap-4 rounded-lg p-4 ${
                    isUnlocked ? "" : "opacity-50"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                      isUnlocked
                        ? "bg-primary/15 text-primary-soft"
                        : "border border-glass-border text-muted"
                    }`}
                  >
                    <Icon size={20} strokeWidth={1.5} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text">{label}</p>
                    <p className="mt-0.5 text-xs text-muted">{description}</p>
                    <p className="mt-1 font-mono text-xs text-primary-soft">
                      {isUnlocked ? "Terbuka" : "Terkunci"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </main>

      <Footer />
      <BottomTab />
    </>
  );
}


