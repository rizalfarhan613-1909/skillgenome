"use client";

import { Clock, Newspaper } from "lucide-react";
import BottomTab from "@/components/layout/BottomTab";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

interface Article {
  id: string;
  title: string;
  summary: string;
  readMinutes: number;
  cover: string;
}

const FEATURED: Article = {
  id: "featured",
  title: "Skill apa yang paling menentukan jadi Data Analyst?",
  summary:
    "Menganalisis delapan skill inti Data Analyst dari bobot importance dan gap penguasaan: SQL dan statistik paling menentukan kecocokan role, sementara komunikasi menjadi pembeda saat presentasi hasil.",
  readMinutes: 6,
  cover: "linear-gradient(135deg, #22D3EE 0%, #6366F1 100%)",
};

const ARTICLES: Article[] = [
  {
    id: "a1",
    title: "Kenapa asesmen adaptif lebih singkat dari kuis biasa",
    summary:
      "Soal dipilih berdasarkan informasi Fisher pada kemampuan terkini, sehingga 10 soal sudah cukup untuk memperkirakan penguasaan.",
    readMinutes: 4,
    cover: "linear-gradient(135deg, #22D3EE 0%, #34D399 100%)",
  },
  {
    id: "a2",
    title: "Bedanya mastery, coverage, dan match%",
    summary:
      "Mastery mengukur penguasaan satu skill, coverage mengukur capaian terhadap target, dan match% menggabungkan keduanya.",
    readMinutes: 5,
    cover: "linear-gradient(135deg, #F472B6 0%, #6366F1 100%)",
  },
  {
    id: "a3",
    title: "Urutan belajar yang hemat waktu menurut gap",
    summary:
      "Prioritas dihitung dari gap terhadap mastery 80% dikali importance role, sehingga langkah pertama selalu yang paling berdampak.",
    readMinutes: 4,
    cover: "linear-gradient(135deg, #6366F1 0%, #22D3EE 100%)",
  },
  {
    id: "a4",
    title: "Cara membaca radar genome tanpa salah tafsir",
    summary:
      "Radar membandingkan penguasaan dengan kebutuhan role, bukan peringkat. Bentuk yang rapat di satu arah punya arti berbeda.",
    readMinutes: 3,
    cover: "linear-gradient(135deg, #34D399 0%, #22D3EE 100%)",
  },
];

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
}

/** Kartu artikel dengan cover gradient, judul, ringkasan, waktu baca, dan sumber. */
function ArticleCard({ article, featured = false }: ArticleCardProps) {
  return (
    <article className="glass flex h-full flex-col overflow-hidden rounded-lg">
      <div
        aria-hidden="true"
        className={`w-full ${featured ? "h-40" : "h-28"}`}
        style={{ backgroundImage: article.cover }}
      />
      <div className="flex flex-1 flex-col p-5">
        <h3
          className={`font-heading font-semibold text-text ${
            featured ? "text-xl" : "text-base"
          }`}
        >
          {article.title}
        </h3>
        <p className="mt-2 flex-1 leading-6 text-muted">{article.summary}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
            <Clock aria-hidden="true" size={14} strokeWidth={1.5} />
            {article.readMinutes} menit baca
          </span>
          <span>Sumber: benchmark global</span>
        </div>
      </div>
    </article>
  );
}

/** Halaman insights: artikel contoh berlabel dibuat AI, satu utama dan empat lainnya. */
export default function InsightsPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 pb-72 pt-7 sm:px-6 md:pb-12 md:pt-10 lg:pb-16">
        <header className="mb-6">
          <p className="mb-2 flex items-center gap-2 font-mono text-sm text-cyan">
            <Newspaper aria-hidden="true" size={16} strokeWidth={1.5} />
            TIER 3 - PENDUKUNG
          </p>
          <h1 className="font-heading text-3xl font-semibold text-text sm:text-4xl">
            Insights
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Ringkasan singkat tentang skill dan metode asesmen, ditulis untuk
            membantu kamu membaca hasil dengan benar.
          </p>
        </header>

        <p
          role="note"
          className="glass mb-6 rounded-lg px-4 py-3 text-center text-sm font-medium text-primary-soft"
        >
          Dibuat AI, contoh data
        </p>

        <div className="space-y-6">
          <ArticleCard article={FEATURED} featured />

          <ul className="grid gap-6 sm:grid-cols-2">
            {ARTICLES.map((article) => (
              <li key={article.id} className="h-full">
                <ArticleCard article={article} />
              </li>
            ))}
          </ul>
        </div>
      </main>

      <Footer />
      <BottomTab />
    </>
  );
}
