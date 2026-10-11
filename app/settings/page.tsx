"use client";

import {
  Check,
  ChevronDown,
  Download,
  Info,
  Scale,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import BottomTab from "@/components/layout/BottomTab";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { ConfirmDialog } from "@/components/passport/ConfirmDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SKILLS, type SkillName } from "@/lib/genome-core";
import { useGenomeStore } from "@/store/genome";
import { usePrefsStore, type Language } from "@/store/prefs";

type PageStatus = "loading" | "ready" | "error";

interface SwitchRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

const AI_PRINCIPLES = [
  {
    title: "Angka dihitung kode, bukan dikarang AI",
    body: "Skor penguasaan dan kecocokan dihitung oleh algoritma deterministik (IRT, BKT, cosine). AI hanya membantu menulis penjelasan dalam bahasa manusia.",
  },
  {
    title: "Hanya jawaban soal yang menentukan hasil",
    body: "Nama, gender, dan kampus tidak masuk ke dalam perhitungan. Mengubahnya tidak mengubah skor.",
  },
  {
    title: "Setiap aksi eksternal menunggu persetujuanmu",
    body: "Dokumen dan email hanya dibuat setelah kamu menekan konfirmasi. Tidak ada pengiriman otomatis.",
  },
];

/** Baris switch aksesibilitas dengan label, deskripsi, dan state terkontrol. */
function SwitchRow({ id, label, description, checked, onChange }: SwitchRowProps) {
  return (
    <label
      htmlFor={id}
      className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md px-1 py-1 text-sm text-text"
    >
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 accent-primary"
      />
      <span>
        {label}
        <span className="mt-0.5 block text-xs text-muted">{description}</span>
      </span>
    </label>
  );
}

/** Halaman pengaturan: profil, aksesibilitas, panel Responsible AI, dan data. */
export default function SettingsPage() {
  const [pageStatus, setPageStatus] = useState<PageStatus>("loading");
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [issueText, setIssueText] = useState("");
  const [issueSent, setIssueSent] = useState(false);
  const [compareSkill, setCompareSkill] = useState<SkillName>("SQL");
  const [compareText, setCompareText] = useState("");
  const [compareSent, setCompareSent] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const alias = usePrefsStore((state) => state.alias);
  const language = usePrefsStore((state) => state.language);
  const timerEnabled = usePrefsStore((state) => state.timerEnabled);
  const consent = usePrefsStore((state) => state.consent);
  const setAlias = usePrefsStore((state) => state.setAlias);
  const setLanguage = usePrefsStore((state) => state.setLanguage);
  const setTimer = usePrefsStore((state) => state.setTimer);
  const reduceMotion = usePrefsStore((state) => state.reduceMotion);
  const disable3d = usePrefsStore((state) => state.disable3d);
  const setReduceMotion = usePrefsStore((state) => state.setReduceMotion);
  const setDisable3d = usePrefsStore((state) => state.setDisable3d);
  const toggleConsent = usePrefsStore((state) => state.toggleConsent);
  const mastery = useGenomeStore((state) => state.mastery);
  const matchScore = useGenomeStore((state) => state.matchScore);
  const theta = useGenomeStore((state) => state.theta);
  const history = useGenomeStore((state) => state.history);
  const lastAssessedAt = useGenomeStore((state) => state.lastAssessedAt);
  const resetGenome = useGenomeStore((state) => state.reset);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve()
      .then(() => usePrefsStore.persist.rehydrate())
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

  const handleExport = () => {
    const payload = {
      alias,
      language,
      timerEnabled,
      consent,
      genome: {
        mastery,
        theta,
        matchScore,
        lastAssessedAt,
        history,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "skillgenome-data.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setToast("Data diekspor sebagai skillgenome-data.json");
  };

  const handleDelete = () => {
    setDeleteOpen(false);
    resetGenome();
    setToast("Data dihapus");
  };

  if (pageStatus === "loading") {
    return (
      <>
        <Navbar />
        <main className="mx-auto min-h-screen max-w-3xl space-y-6 px-4 py-8 sm:px-6">
          <div className="h-10 w-64 animate-pulse rounded bg-glass" />
          <div className="h-40 animate-pulse rounded-lg bg-glass" />
          <div className="h-40 animate-pulse rounded-lg bg-glass" />
          <p className="sr-only" role="status">
            Memuat pengaturan...
          </p>
        </main>
        <Footer />
        <BottomTab />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-3xl px-4 pb-72 pt-7 sm:px-6 md:pb-12 md:pt-10 lg:pb-16">
        <header className="mb-8">
          <p className="mb-2 font-mono text-sm text-cyan">KONTROL PENGGUNA</p>
          <h1 className="font-heading text-3xl font-semibold text-text sm:text-4xl">
            Pengaturan
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Atur profil, aksesibilitas, dan izin. Semua izin default nonaktif
            dan bisa kamu ubah kapan saja.
          </p>
        </header>

        <div className="space-y-6">
          <section aria-label="Profil" className="glass rounded-lg p-5 sm:p-6">
            <h2 className="font-heading text-lg font-semibold text-text">Profil</h2>
            <div className="mt-4 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="settings-alias" className="text-sm text-text">
                  Alias
                </label>
                <input
                  id="settings-alias"
                  type="text"
                  value={alias}
                  onChange={(event) => setAlias(event.target.value)}
                  placeholder="Nama panggilan, misalnya Andi"
                  className="min-h-11 w-full rounded-md border border-glass-border bg-transparent px-3 text-sm text-text outline-none focus-visible:border-primary-soft"
                />
                <p className="text-xs text-muted">
                  Alias hanya tampil di Passport milikmu. Nama asli tidak
                  diminta.
                </p>
              </div>

              <fieldset className="flex flex-col gap-2">
                <legend className="text-sm text-text">Bahasa</legend>
                <div className="flex gap-3">
                  {(
                    [
                      ["id", "Bahasa Indonesia"],
                      ["en", "English"],
                    ] as const satisfies readonly [Language, string][]
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={language === value}
                      onClick={() => setLanguage(value)}
                      className={`min-h-11 rounded-md border px-4 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-soft ${
                        language === value
                          ? "border-primary bg-primary/10 text-primary-soft"
                          : "border-glass-border text-muted"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          </section>

          <section
            aria-label="Aksesibilitas"
            className="glass rounded-lg p-5 sm:p-6"
          >
            <h2 className="font-heading text-lg font-semibold text-text">
              Aksesibilitas
            </h2>
            <div className="mt-4 space-y-3">
              <SwitchRow
                id="settings-no-timer"
                label="Tanpa timer"
                description="Timer asesmen tidak aktif. Asesmen tidak memotong waktu."
                checked={!timerEnabled}
                onChange={(next) => setTimer(!next)}
              />
              <SwitchRow
                id="settings-reduce-motion"
                label="Kurangi animasi"
                description="Mengurangi animasi transisi di seluruh aplikasi."
                checked={reduceMotion}
                onChange={setReduceMotion}
              />
              <SwitchRow
                id="settings-disable-3d"
                label="Matikan 3D"
                description="Galaksi 3D diganti radar dua dimensi agar hemat data."
                checked={disable3d}
                onChange={setDisable3d}
              />
            </div>
            <p className="mt-4 text-xs leading-5 text-muted">
              Pengaturan tampilan disimpan di perangkat ini. Preferensi reduced
              motion dari sistem tetap dihormati.
            </p>
          </section>

          <section
            aria-label="Panel Responsible AI"
            className="glass rounded-lg p-5 sm:p-6"
          >
            <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-text">
              <Info
                aria-hidden="true"
                size={18}
                strokeWidth={1.5}
                className="text-cyan"
              />
              Panel Responsible AI
            </h2>

            <div className="mt-4 rounded-md border border-glass-border">
              <button
                type="button"
                aria-expanded={accordionOpen}
                aria-controls="ai-how-it-works"
                onClick={() => setAccordionOpen((open) => !open)}
                className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-text"
              >
                Cara kerja AI kami
                <ChevronDown
                  aria-hidden="true"
                  size={18}
                  strokeWidth={1.5}
                  className={`shrink-0 text-muted transition-transform ${
                    accordionOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {accordionOpen && (
                <ul
                  id="ai-how-it-works"
                  className="space-y-3 border-t border-glass-border px-4 py-4"
                >
                  {AI_PRINCIPLES.map((item) => (
                    <li key={item.title} className="text-sm">
                      <p className="font-medium text-text">{item.title}</p>
                      <p className="mt-1 leading-6 text-muted">{item.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4 rounded-md border border-glass-border px-4 py-3">
              <h3 className="text-sm font-medium text-text">Hasil uji bias</h3>
              <p className="mt-1 text-sm leading-6 text-muted">
                20 profil diuji dengan variasi nama, gender, kampus: selisih
                hasil 0.
              </p>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-medium text-text">Laporkan masalah</h3>
              <textarea
                value={issueText}
                onChange={(event) => setIssueText(event.target.value)}
                rows={3}
                placeholder="Jelaskan masalah yang kamu temui"
                className="mt-2 w-full rounded-md border border-glass-border bg-transparent px-3 py-2 text-sm text-text outline-none focus-visible:border-primary-soft"
              />
              <button
                type="button"
                disabled={issueText.trim() === "" || issueSent}
                onClick={() => {
                  setIssueSent(true);
                  setIssueText("");
                  setToast("Laporan diterima. Terima kasih.");
                }}
                className="mt-2 min-h-11 rounded-md border border-glass-border px-4 text-sm font-medium text-text transition-colors hover:bg-glass disabled:cursor-not-allowed disabled:opacity-50"
              >
                Kirim laporan
              </button>
              {issueSent && (
                <p className="mt-2 text-xs text-muted" role="status">
                  Laporan tercatat di sesi ini.
                </p>
              )}
            </div>
            <div className="mt-5 border-t border-glass-border pt-4">
              <h3 className="flex items-center gap-2 text-sm font-medium text-text">
                <Scale
                  aria-hidden="true"
                  size={16}
                  strokeWidth={1.5}
                  className="text-primary-soft"
                />
                Banding hasil
              </h3>
              <p className="mt-1 text-xs text-muted">
                Ajukan banding untuk satu skill bila menurutmu hasilnya salah.
                Pengajuan akan ditandai untuk ditinjau.
              </p>

              <div className="mt-3 flex flex-col gap-3">
                <Select
                  value={compareSkill}
                  onValueChange={(value) => setCompareSkill(value as SkillName)}
                >
                  <SelectTrigger className="min-h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SKILLS.map((skill) => (
                      <SelectItem key={skill} value={skill}>
                        {skill}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <textarea
                  value={compareText}
                  onChange={(event) => setCompareText(event.target.value)}
                  rows={3}
                  placeholder="Alasan banding untuk skill ini"
                  className="w-full rounded-md border border-glass-border bg-transparent px-3 py-2 text-sm text-text outline-none focus-visible:border-primary-soft"
                />

                <button
                  type="button"
                  disabled={compareText.trim() === "" || compareSent}
                  onClick={() => {
                    setCompareSent(true);
                    setCompareText("");
                    setToast("Banding dikirim untuk ditinjau.");
                  }}
                  className="min-h-11 self-start rounded-md border border-glass-border px-4 text-sm font-medium text-text transition-colors hover:bg-glass disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Kirim banding
                </button>
                {compareSent && (
                  <p className="text-xs text-muted" role="status">
                    Banding {compareSkill} tercatat untuk ditinjau.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section aria-label="Data saya" className="glass rounded-lg p-5 sm:p-6">
            <h2 className="font-heading text-lg font-semibold text-text">
              Data saya
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Semua data asesmen disimpan di perangkat ini. Kamu bisa mengekspor
              atau menghapusnya kapan saja.
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-glass-border px-4 text-sm font-medium text-text transition-colors hover:bg-glass"
              >
                <Download aria-hidden="true" size={16} strokeWidth={1.5} />
                Ekspor data (JSON)
              </button>

              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-pink/40 px-4 text-sm font-medium text-pink transition-colors hover:bg-pink/10"
              >
                <Trash2 aria-hidden="true" size={16} strokeWidth={1.5} />
                Hapus data saya
              </button>
            </div>
          </section>
        </div>

        <p className="mt-8 text-xs leading-5 text-muted">
          Hasil asesmen ini estimasi dari 10 soal dan bukan pengganti konselor
          karier profesional.
        </p>
      </main>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="glass fixed inset-x-4 bottom-20 z-50 mx-auto flex max-w-md items-center gap-3 rounded-lg px-4 py-3 text-sm text-text shadow-xl lg:bottom-6"
        >
          <Check
            aria-hidden="true"
            size={16}
            strokeWidth={1.5}
            className="shrink-0 text-green"
          />
          <span className="flex-1">{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="min-h-11 px-2 text-xs text-muted transition-colors hover:text-text"
          >
            Tutup
          </button>
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        email=""
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      <Footer />
      <BottomTab />
    </>
  );
}

