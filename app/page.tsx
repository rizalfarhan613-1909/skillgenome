"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import BottomTab from "@/components/layout/BottomTab";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { BobGuideDialog } from "@/components/agent/BobGuideDialog";
import { rise, stagger } from "@/lib/motion";

const DNAHelix = dynamic(() => import("@/components/DNAHelix"), {
  ssr: false,
  loading: () => (
    <div
      className="h-full w-full animate-pulse rounded-full bg-primary/10"
      aria-hidden="true"
    />
  ),
});

const genomeExample = [
  { skill: "SQL", penguasaan: 40, target: 76 },
  { skill: "Python", penguasaan: 24, target: 60 },
  { skill: "Statistics", penguasaan: 24, target: 64 },
  { skill: "Excel", penguasaan: 94, target: 56 },
  { skill: "DataViz", penguasaan: 73, target: 64 },
  { skill: "Business Acumen", penguasaan: 24, target: 52 },
  { skill: "Communication", penguasaan: 73, target: 56 },
  { skill: "Domain Knowledge", penguasaan: 24, target: 40 },
];

const responsiblePrinciples = [
  {
    title: "Hasil berbasis bukti",
    description:
      "Skor berasal dari jawaban asesmen, bukan nama, gender, atau kampus.",
  },
  {
    title: "Faktor yang transparan",
    description:
      "Penguasaan, gap, dan bobot skill menjelaskan dasar rekomendasi.",
  },
  {
    title: "Kendali tetap di tanganmu",
    description:
      "Data dapat diekspor atau dihapus. Aksi eksternal menunggu persetujuan.",
  },
];

/** Menampilkan landing page SkillGenome dan contoh genome statis. */
export default function Home() {
  const [bobOpen, setBobOpen] = useState(false);

  return (
    <>
      <Navbar />
      <motion.main
        className="mx-auto flex w-full max-w-7xl flex-col gap-24 px-6 pb-24 pt-12 lg:gap-32 lg:px-10 lg:pb-16 lg:pt-20"
        initial="hidden"
        animate="show"
        variants={stagger}
      >
        <motion.section
          variants={rise}
          className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
        >
          <div className="flex flex-col items-start gap-6">
            <p className="rounded-full border border-glass-border px-3 py-1 text-sm text-primary-soft">
              Peta skill untuk langkah karier berikutnya
            </p>
            <h1 className="max-w-2xl font-heading text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-primary-soft to-cyan bg-clip-text text-transparent">
                Your skill DNA, decoded.
              </span>
            </h1>
            <p className="max-w-[68ch] text-lg leading-8 text-muted">
              Jawab 10 soal adaptif. Lihat skill yang sudah kamu kuasai dan
              langkah belajar berikutnya.
            </p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/onboarding"
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-primary-strong px-6 font-medium text-white transition-colors hover:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-soft"
              >
                Mulai asesmen
              </Link>
              <button
                type="button"
                onClick={() => setBobOpen(true)}
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-glass-border px-6 font-medium text-text transition-colors hover:bg-glass focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-soft"
              >
                Coba lewat IBM Bob
              </button>
            </div>
          </div>

          <div className="mx-auto h-72 w-full max-w-md sm:h-96" aria-hidden="true">
            <DNAHelix />
          </div>
        </motion.section>

        <motion.section variants={rise} className="flex flex-col gap-8">
          <div className="max-w-2xl">
            <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Cara kerja
            </h2>
            <p className="mt-3 text-muted">
              Dari asesmen berbasis bukti menuju langkah belajar yang terarah.
            </p>
          </div>
          <ol className="grid gap-4 md:grid-cols-3">
            {[
              {
                number: "1",
                title: "Jawab",
                description: "Selesaikan 10 soal yang dipilih secara adaptif.",
              },
              {
                number: "2",
                title: "Lihat genome",
                description: "Pahami penguasaan pada delapan skill.",
              },
              {
                number: "3",
                title: "Ikuti jalur",
                description: "Dapatkan prioritas belajar untuk role target.",
              },
            ].map((step) => (
              <li
                key={step.number}
                className="glass rounded-lg p-6"
              >
                <span className="font-mono text-sm text-primary-soft">
                  {step.number}
                </span>
                <h3 className="mt-3 font-heading text-xl font-semibold">
                  {step.title}
                </h3>
                <p className="mt-2 leading-7 text-muted">{step.description}</p>
              </li>
            ))}
          </ol>
        </motion.section>

        <motion.section
          variants={rise}
          className="grid items-center gap-8 lg:grid-cols-2"
        >
          <div className="max-w-xl">
            <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Contoh genome
            </h2>
            <p className="mt-3 leading-7 text-muted">
              Contoh penguasaan per skill. Hasil asesmen adalah estimasi dari
              jawaban, bukan penilaian permanen.
            </p>
          </div>
          <div className="glass h-80 rounded-lg p-4 sm:p-6">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={genomeExample} outerRadius="72%">
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis
                  dataKey="skill"
                  tick={{ fill: "#94A3B8", fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="Genome contoh"
                  dataKey="penguasaan"
                  stroke="#6366F1"
                  fill="#6366F1"
                  fillOpacity={0.3}
                />
                <Radar
                  name="Target role"
                  dataKey="target"
                  stroke="#22D3EE"
                  fill="#22D3EE"
                  fillOpacity={0.08}
                />
              </RadarChart>
            </ResponsiveContainer>
            <table
              className="sr-only h-px w-px overflow-hidden"
              style={{ tableLayout: "fixed", width: 1, height: 1 }}
            >
              <caption>Contoh penguasaan skill dan target peran</caption>
              <thead>
                <tr>
                  <th scope="col">Skill</th>
                  <th scope="col">Penguasaan</th>
                  <th scope="col">Target role</th>
                </tr>
              </thead>
              <tbody>
                {genomeExample.map((item) => (
                  <tr key={item.skill}>
                    <th scope="row">{item.skill}</th>
                    <td>{item.penguasaan}%</td>
                    <td>{item.target}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        <motion.section variants={rise} className="flex flex-col gap-8">
          <div className="max-w-2xl">
            <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              AI yang bertanggung jawab
            </h2>
            <p className="mt-3 text-muted">
              Teknologi membantu menjelaskan hasil; keputusan belajar tetap
              milikmu.
            </p>
          </div>
          <ul className="grid gap-4 md:grid-cols-3">
            {responsiblePrinciples.map((principle) => (
              <li key={principle.title} className="glass rounded-lg p-6">
                <h3 className="font-heading text-lg font-semibold">
                  {principle.title}
                </h3>
                <p className="mt-2 leading-7 text-muted">
                  {principle.description}
                </p>
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.section variants={rise} className="flex flex-col gap-8">
          <div className="max-w-2xl">
            <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Pilih cara mulai
            </h2>
            <p className="mt-3 text-muted">
              Mulai dengan fitur inti, lalu tentukan apakah kamu membutuhkan
              fitur belajar tambahan.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="glass rounded-lg p-6">
              <h3 className="font-heading text-xl font-semibold">Free</h3>
              <p className="mt-2 text-muted">
                Satu asesmen per bulan untuk melihat genome dan jalur belajarmu.
              </p>
              <Link
                href="/onboarding"
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md border border-glass-border px-5 font-medium hover:bg-glass focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-soft"
              >
                Mulai asesmen
              </Link>
            </article>
            <article className="glass rounded-lg border-primary/35 p-6">
              <h3 className="font-heading text-xl font-semibold">Premium</h3>
              <p className="mt-2 font-mono text-3xl tabular-nums text-primary-soft">
                Rp 79.000
                <span className="font-body text-base text-muted">/bulan</span>
              </p>
              <p className="mt-2 text-muted">
                Asesmen tanpa batas dan roadmap yang diperbarui otomatis.
              </p>
              <p className="mt-4 text-sm text-muted">
                Harga ilustratif sesuai hipotesis model bisnis.
              </p>
            </article>
          </div>
        </motion.section>
      </motion.main>
      <Footer />
      <BottomTab />

      <BobGuideDialog open={bobOpen} onOpenChange={setBobOpen} />
    </>
  );
}
