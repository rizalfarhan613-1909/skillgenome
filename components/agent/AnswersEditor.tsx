"use client";

import { Plus, Trash2 } from "lucide-react";

export interface AnswerRow {
  id: string;
  question_id: string;
  choice: string;
}

export interface AnswersEditorProps {
  rows: AnswerRow[];
  disabled?: boolean;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, patch: Partial<AnswerRow>) => void;
}

const CHOICE_OPTIONS = ["0", "1", "2", "3"];

/** Editor daftar jawaban dinamis untuk tool submit_assessment_answers. */
export function AnswersEditor({
  rows,
  disabled = false,
  onAdd,
  onRemove,
  onChange,
}: AnswersEditorProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span id="answers-editor-label" className="text-sm font-medium text-text">
          Jawaban ({rows.length}/10)
        </span>
        <button
          type="button"
          onClick={onAdd}
          disabled={disabled || rows.length >= 10}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-glass-border px-3 text-sm font-medium text-text transition-colors hover:bg-glass disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus aria-hidden="true" size={16} strokeWidth={1.5} />
          Tambah jawaban
        </button>
      </div>

      <div aria-labelledby="answers-editor-label" role="group" className="space-y-2">
        {rows.length === 0 && (
          <p className="rounded-md border border-dashed border-glass-border px-3 py-4 text-sm text-muted">
            Belum ada jawaban. Tambahkan satu per satu, atau isi otomatis dari
            hasil Start Assessment di atas.
          </p>
        )}

        {rows.map((row, index) => (
          <div
            key={row.id}
            className="flex items-end gap-2 rounded-md border border-glass-border bg-bg/40 p-2"
          >
            <div className="min-w-0 flex-1">
              <label
                htmlFor={`answer-qid-${row.id}`}
                className="mb-1 block text-xs text-muted"
              >
                Soal {index + 1} (question_id)
              </label>
              <input
                id={`answer-qid-${row.id}`}
                type="text"
                value={row.question_id}
                disabled={disabled}
                onChange={(event) =>
                  onChange(row.id, { question_id: event.target.value })
                }
                placeholder="mis. sql_01"
                className="min-h-11 w-full rounded-md border border-glass-border bg-transparent px-3 text-sm text-text outline-none placeholder:text-muted/60 focus-visible:border-primary-soft disabled:opacity-50"
              />
            </div>

            <div className="w-24 shrink-0">
              <label
                htmlFor={`answer-choice-${row.id}`}
                className="mb-1 block text-xs text-muted"
              >
                Pilihan
              </label>
              <select
                id={`answer-choice-${row.id}`}
                value={row.choice}
                disabled={disabled}
                onChange={(event) =>
                  onChange(row.id, { choice: event.target.value })
                }
                className="min-h-11 w-full rounded-md border border-glass-border bg-transparent px-2 text-sm text-text outline-none focus-visible:border-primary-soft disabled:opacity-50"
              >
                {CHOICE_OPTIONS.map((option) => (
                  <option key={option} value={option} className="bg-bg text-text">
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              aria-label={`Hapus jawaban soal ${index + 1}`}
              onClick={() => onRemove(row.id)}
              disabled={disabled}
              className="inline-flex min-h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-glass hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 aria-hidden="true" size={16} strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
