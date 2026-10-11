"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { QRCodeSVG } from "qrcode.react";
import { SKILLS, type Mastery, type SkillName } from "@/lib/genome-core";
import { SkillChip } from "@/components/ui/SkillChip";

export interface PassportCardUser {
  alias: string;
  targetRole: string;
}

export interface PassportCardProps {
  user: PassportCardUser;
  mastery: Mastery;
  passportId: string;
  issuedAt: string;
}

/** Label level dari nilai mastery 0–1. Dipakai ulang di halaman verifikasi. */
export function masteryLevel(value: number): string {
  if (value >= 0.8) return "Ahli";
  if (value >= 0.6) return "Mahir";
  if (value >= 0.4) return "Menengah";
  if (value >= 0.2) return "Dasar";
  return "Pemula";
}

/** Mengambil inisial dari alias untuk placeholder avatar. */
function initialsOf(alias: string): string {
  const parts = alias.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SG";
  const letters = parts.slice(0, 2).map((part) => part[0] ?? "");
  return letters.join("").toUpperCase();
}

/** Memformat tanggal terbit dalam format Indonesia, misalnya "11 Okt 2026". */
function formatIssuedAt(issuedAt: string): string {
  const date = new Date(issuedAt);
  if (Number.isNaN(date.getTime())) {
    return "Tanggal tidak valid";
  }
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

const hologramGradient =
  "linear-gradient(115deg, #22D3EE 0%, #6366F1 35%, #F472B6 55%, #22D3EE 80%, #6366F1 100%)";

/** Kartu Skill Passport: identitas, radar mini, kekuatan teratas, QR, dan disclaimer. */
export function PassportCard({
  user,
  mastery,
  passportId,
  issuedAt,
}: PassportCardProps) {
  const reduceMotion = useReducedMotion();

  const topSkills: SkillName[] = SKILLS.map((skill) => skill)
    .sort((left, right) => (mastery[right] ?? 0) - (mastery[left] ?? 0))
    .slice(0, 3);

  const radarData = SKILLS.map((skill) => ({
    skill,
    value: Math.max(0, Math.min(100, (mastery[skill] ?? 0) * 100)),
  }));

  const verifyUrl = `/passport/verify/${passportId}`;
  const displayAlias =
    user.alias.trim() === "" ? "Pengguna SkillGenome" : user.alias;
  const targetRoleLabel = user.targetRole.replaceAll("_", " ");
  const issuedLabel = formatIssuedAt(issuedAt);

  return (
    <article className="relative rounded-lg p-px">
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 rounded-lg"
        style={{
          backgroundImage: hologramGradient,
          backgroundSize: "200% 100%",
        }}
        animate={
          reduceMotion ? undefined : { backgroundPositionX: ["0%", "200%"] }
        }
        transition={
          reduceMotion
            ? undefined
            : { duration: 8, ease: "linear", repeat: Infinity }
        }
      />

      <div className="glass relative flex flex-col gap-5 rounded-lg bg-bg/90 p-5 sm:p-6">
        <header className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-full border border-glass-border bg-glass font-heading text-base font-semibold text-primary-soft"
          >
            {initialsOf(user.alias)}
          </span>

          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs tracking-widest text-cyan">
              SKILL PASSPORT
            </p>
            <h2 className="mt-1 truncate font-heading text-xl font-semibold text-text">
              {displayAlias}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Target Role: {targetRoleLabel}
            </p>
            <p className="mt-1 font-mono text-xs tabular-nums text-muted">
              Terbit {issuedLabel} · {passportId}
            </p>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-5">
          <div
            className="size-28 shrink-0"
            role="img"
            aria-label={`Radar mini penguasaan delapan skill pada ${issuedLabel}`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="rgb(255 255 255 / 0.1)" />
                <PolarAngleAxis
                  dataKey="skill"
                  tick={false}
                  axisLine={false}
                  tickLine={false}
                />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                  tickLine={false}
                />
                <Radar
                  name="Penguasaan"
                  dataKey="value"
                  stroke="#22D3EE"
                  strokeWidth={1.5}
                  fill="#22D3EE"
                  fillOpacity={0.25}
                  isAnimationActive={!reduceMotion}
                  animationDuration={400}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-text">Kekuatan teratas</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {topSkills.map((skill) => (
                <li key={skill}>
                  <SkillChip skill={skill} level={mastery[skill] ?? 0} />
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center gap-3">
              <span className="shrink-0 rounded-md bg-white p-1.5">
                <QRCodeSVG
                  value={verifyUrl}
                  size={64}
                  level="M"
                  bgColor="#FFFFFF"
                  fgColor="#0A0A1A"
                  title={`QR verifikasi passport ${passportId}`}
                />
              </span>
              <a
                href={verifyUrl}
                className="min-h-11 break-all text-xs text-cyan underline underline-offset-4 hover:text-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-soft"
              >
                Verifikasi: {verifyUrl}
              </a>
            </div>
          </div>
        </div>

        <table className="sr-only">
          <caption>Penguasaan delapan skill menurut Passport</caption>
          <thead>
            <tr>
              <th scope="col">Skill</th>
              <th scope="col">Penguasaan</th>
            </tr>
          </thead>
          <tbody>
            {SKILLS.map((skill) => (
              <tr key={skill}>
                <th scope="row">{skill}</th>
                <td>{Math.round((mastery[skill] ?? 0) * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>

        <footer className="border-t border-glass-border pt-4">
          <p className="text-xs leading-5 text-muted">
            Hasil ini estimasi dari 10 soal dan bukan pengganti konselor karier.
          </p>
        </footer>
      </div>
    </article>
  );
}

