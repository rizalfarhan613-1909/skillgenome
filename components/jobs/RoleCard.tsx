"use client";

import Link from "next/link";
import {
  matchScore,
  roleRequirement,
  SKILLS,
  type Mastery,
  type RoleName,
  type SkillName,
} from "@/lib/genome-core";
import type { JobMarket } from "@/lib/types";

export interface RoleCardProps {
  role: JobMarket;
  mastery: Mastery;
  isActive: boolean;
}

const percentFormat = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 1,
});

/** Mengubah nama role teknis (snake_case) menjadi label yang mudah dibaca. */
function formatRoleName(name: string): string {
  return name
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Mengubah rentang gaji menjadi teks. Nilai null ditampilkan sebagai belum tersedia. */
function formatSalary(role: JobMarket): string {
  const { min, max, currency } = role.salary_range;
  if (min === null || max === null) {
    return "Belum tersedia";
  }
  const formatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  return `${formatter.format(min)} – ${formatter.format(max)}`;
}

/** Menampilkan satu role, kecocokan genome, rentang gaji agregat, dan perbandingan skill. */
export function RoleCard({ role, mastery, isActive }: RoleCardProps) {
  const roleName = role.name as RoleName;
  const headingId = `role-${role._id}`;
  const canScore = isActive && roleName === "data_analyst";
  const score = canScore ? matchScore(mastery, roleName) : null;
  const requirement = canScore ? roleRequirement(roleName) : null;

  return (
    <article
      aria-labelledby={headingId}
      aria-disabled={!isActive}
      className={`glass flex flex-col gap-5 rounded-lg p-5 sm:p-6 ${
        isActive ? "glow-primary" : "opacity-60"
      }`}
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <h3
            id={headingId}
            className="font-heading text-xl font-semibold text-text"
          >
            {formatRoleName(role.name)}
          </h3>
          {!isActive && (
            <p className="mt-1 text-sm text-primary-soft">Segera hadir</p>
          )}
        </div>

        {score !== null && mastery !== null ? (
          <div className="text-right">
            <p className="font-mono text-4xl font-semibold tabular-nums text-primary-soft">
              {percentFormat.format(score.match_pct)}
              <span className="ml-1 text-2xl">%</span>
            </p>
            <p className="text-xs text-muted">Kecocokan</p>
          </div>
        ) : (
          <p className="text-sm text-muted">Belum dihitung</p>
        )}
      </header>

      <section aria-label="Rentang gaji" className="text-sm">
        <p className="text-muted">
          Rentang gaji{" "}
          <span className="text-xs">(benchmark global)</span>
        </p>
        <p className="mt-1 font-mono tabular-nums text-text">
          {formatSalary(role)}
        </p>
        <p className="mt-1 text-xs leading-5 text-muted">
          Sumber: {role.salary_range.source}
        </p>
      </section>

      {score !== null && (
        <section aria-label="Perbandingan skill" className="space-y-4">
          <div className="flex flex-wrap gap-4 text-xs text-muted">
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-6 rounded-sm bg-[repeating-linear-gradient(45deg,rgb(165_180_252)_0_3px,transparent_3px_6px)]"
              />
              Kebutuhan role
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-6 rounded-sm bg-gradient-to-r from-primary to-cyan"
              />
              Genome kamu
            </span>
          </div>

          <ul className="space-y-3">
            {SKILLS.map((skill: SkillName, index) => {
              const required = Math.round((requirement?.[index] ?? 0) * 100);
              const owned = Math.round(mastery[skill] * 100);

              return (
                <li key={skill} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-text">{skill}</span>
                    <span className="font-mono tabular-nums text-muted">
                      {owned}% / {required}%
                    </span>
                  </div>
                  <div
                    role="img"
                    aria-label={`${skill}: genome ${owned}%, kebutuhan ${required}%`}
                    className="space-y-1"
                  >
                    <div className="h-2 rounded-full bg-glass">
                      <div
                        className="h-full rounded-full bg-
                          [repeating-linear-gradient(45deg,rgb(165_180_252)_0_3px,transparent_3px_6px)]"
                        style={{ width: `${Math.min(100, required)}%` }}
                      />
                    </div>
                    <div className="h-2 rounded-full bg-glass">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-cyan"
                        style={{ width: `${Math.min(100, owned)}%` }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <footer className="mt-auto">
        {isActive ? (
          <Link
            href="/roadmap"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary-strong px-4 font-medium text-white transition-colors hover:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-soft"
          >
            Lihat roadmap untuk role ini
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex min-h-11 w-full cursor-not-allowed items-center justify-center rounded-md border border-glass-border px-4 font-medium text-muted"
          >
            Segera hadir
          </button>
        )}
      </footer>
    </article>
  );
}
