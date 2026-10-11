"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const BOB_STEPS = [
  "Buka IBM Bob, masuk ke Settings, pilih MCP, lalu tambahkan server lf-skillgenome",
  "Verifikasi 4 tools status Connected",
  'Buka chat Bob, lalu klik tombol "Copy Prompt" di bawah',
  "Paste prompt ke chat Bob, lalu Bob eksekusi alur assessment secara otomatis",
];

const BOB_PROMPT = `Kamu adalah SkillGenome Assistant. Jalankan alur lengkap untuk user "demo":

1. Panggil start_skill_assessment dengan {"user_id":"demo","target_role":"data_analyst"}
2. Asumsikan user menjawab semua soal dengan benar (choice = correct index)
3. Panggil submit_assessment_answers dengan hasil jawaban
4. Dari mastery yang didapat, panggil recommend_career_path
5. Tampilkan theta, match_pct, dan 5 langkah roadmap`;

export interface BobGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Dialog panduan menjalankan SkillGenome lewat IBM Bob. Dipakai landing dan genome. */
export function BobGuideDialog({ open, onOpenChange }: BobGuideDialogProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function handleCopyPrompt(): Promise<void> {
    try {
      await navigator.clipboard.writeText(BOB_PROMPT);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Jalankan SkillGenome lewat IBM Bob</DialogTitle>
          <DialogDescription>
            SkillGenome juga tersedia sebagai AI agent di IBM Bob. Bob dapat
            memanggil 4 tools yaitu start_skill_assessment,
            submit_assessment_answers, recommend_career_path,
            generate_skill_passport. Semuanya via MCP ke Langflow engine yang
            sama.
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-3">
          {BOB_STEPS.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm leading-6 text-muted">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-glass-border bg-glass font-mono text-xs tabular-nums text-primary-soft">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium text-text">Prompt untuk Bob</h3>
            <button
              type="button"
              aria-label={copied ? "Prompt tersalin" : "Salin prompt untuk Bob"}
              onClick={handleCopyPrompt}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary-strong px-4 text-sm font-medium text-white transition-colors hover:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-soft"
            >
              {copied ? "Tersalin!" : "Copy Prompt"}
            </button>
          </div>
          <pre className="max-h-56 overflow-auto rounded-md border border-glass-border bg-bg/60 p-3 font-mono text-xs leading-6 whitespace-pre-wrap break-words text-muted">
            <code>{BOB_PROMPT}</code>
          </pre>
          <p className="sr-only" role="status" aria-live="polite">
            {copied ? "Prompt tersalin ke clipboard." : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md px-4 text-sm font-medium text-muted transition-colors hover:bg-glass hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-soft"
        >
          Tutup
        </button>
      </DialogContent>
    </Dialog>
  );
}
