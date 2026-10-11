"use client";

import { FileText, Globe, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface ConfirmDialogProps {
  open: boolean;
  email: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const CONFIRM_CHECKBOX_ID = "passport-confirm-consent";

/** Dialog konfirmasi sebelum Passport dibuat, menyatakan dokumen, email, dan isi halaman publik. */
export function ConfirmDialog({
  open,
  email,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (open) {
      setAgreed(false);
    }
  }, [open]);

  const points = [
    {
      Icon: FileText,
      text: "Dokumen Google Docs akan dibuat di Drive kamu.",
    },
    {
      Icon: Mail,
      text: (
        <>
          Email dikirim ke{" "}
          <span className="font-mono break-all text-text">
            {email.trim() === "" ? "alamat yang kamu isi" : email}
          </span>
          .
        </>
      ),
    },
    {
      Icon: Globe,
      text: (
        <>
          Halaman publik <span className="font-mono break-all text-text">/passport/verify/[id]</span>{" "}
          hanya menampilkan level skill dan tanggal, tanpa nama dan email.
        </>
      ),
    },
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onCancel();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buat Skill Passport?</DialogTitle>
          <DialogDescription>
            Tinjau dulu apa yang akan terjadi sebelum Passport dibuat.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-3">
          {points.map(({ Icon, text }, index) => (
            <li key={index} className="flex gap-3 text-sm leading-6 text-muted">
              <Icon
                aria-hidden="true"
                size={18}
                strokeWidth={1.5}
                className="mt-0.5 shrink-0 text-primary-soft"
              />
              <span>{text}</span>
            </li>
          ))}
        </ul>

        <label
          htmlFor={CONFIRM_CHECKBOX_ID}
          className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-glass-border px-3 py-2 text-sm text-text"
        >
          <input
            id={CONFIRM_CHECKBOX_ID}
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            className="size-4 accent-primary"
          />
          Saya setuju kirim ke email ini
        </label>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="min-h-11 border-glass-border text-text"
          >
            Batal
          </Button>
          <Button
            type="button"
            disabled={!agreed}
            onClick={onConfirm}
            className="min-h-11 bg-primary-strong text-white hover:bg-primary"
          >
            Buat Passport
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
