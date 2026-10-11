"use client";

import { useEffect, useState } from "react";
import { AnswersEditor, type AnswerRow } from "@/components/agent/AnswersEditor";
import type { AgentToolName } from "@/components/agent/ToolPicker";
import { useGenomeStore } from "@/store/genome";

export interface ToolFormProps {
  tool: AgentToolName;
  disabled?: boolean;
  onSubmit: (input: Record<string, unknown>) => void;
  prefillQuestions: { question_id: string }[];
  /** Prefill answers dari tombol chain ResultCard (10 soal Start Assessment). */
  initialRows?: { question_id: string; choice: number }[] | null;
  /** Prefill mastery dari tombol chain ResultCard (hasil Submit Answers). */
  initialMastery?: Record<string, number> | null;
}

const TARGET_ROLES = [{ value: "data_analyst", label: "Data Analyst" }];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let rowCounter = 0;

function createRow(questionId = "", choice = "0"): AnswerRow {
  rowCounter += 1;
  return { id: `answer-${rowCounter}`, question_id: questionId, choice };
}

function FieldShell({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-text">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs leading-5 text-muted">{hint}</p>}
    </div>
  );
}

const inputClassName =
  "min-h-11 w-full rounded-md border border-glass-border bg-transparent px-3 text-sm text-text outline-none placeholder:text-muted/60 focus-visible:border-primary-soft disabled:opacity-50";

const runButtonClassName =
  "inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary-strong px-4 font-medium text-white transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50";

function ErrorText({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }
  return (
    <p role="alert" className="text-sm text-pink">
      {message}
    </p>
  );
}

function StartAssessmentForm({
  disabled,
  onSubmit,
}: Pick<ToolFormProps, "disabled" | "onSubmit">) {
  const [userId, setUserId] = useState("demo");
  const [targetRole, setTargetRole] = useState("data_analyst");
  const [error, setError] = useState<string | null>(null);

  function handleRun() {
    if (userId.trim() === "") {
      setError("user_id wajib diisi.");
      return;
    }
    setError(null);
    onSubmit({ user_id: userId.trim(), target_role: targetRole });
  }

  return (
    <div className="space-y-4">
      <FieldShell label="User ID" htmlFor="toolform-start-user">
        <input
          id="toolform-start-user"
          type="text"
          value={userId}
          disabled={disabled}
          onChange={(event) => setUserId(event.target.value)}
          className={inputClassName}
        />
      </FieldShell>
      <FieldShell label="Target Role" htmlFor="toolform-start-role">
        <select
          id="toolform-start-role"
          value={targetRole}
          disabled={disabled}
          onChange={(event) => setTargetRole(event.target.value)}
          className={inputClassName}
        >
          {TARGET_ROLES.map((role) => (
            <option key={role.value} value={role.value} className="bg-bg text-text">
              {role.label}
            </option>
          ))}
        </select>
      </FieldShell>
      <ErrorText message={error} />
      <button type="button" onClick={handleRun} disabled={disabled} className={runButtonClassName}>
        Jalankan
      </button>
    </div>
  );
}

function SubmitAnswersForm({
  disabled,
  onSubmit,
  prefillQuestions,
  initialRows,
}: Pick<
  ToolFormProps,
  "disabled" | "onSubmit" | "prefillQuestions" | "initialRows"
>) {
  const [userId, setUserId] = useState("demo");
  const [rows, setRows] = useState<AnswerRow[]>(() =>
    (initialRows ?? []).map((row) =>
      createRow(row.question_id, String(row.choice)),
    ),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialRows && initialRows.length > 0) {
      setRows(
        initialRows.map((row) => createRow(row.question_id, String(row.choice))),
      );
    }
  }, [initialRows]);

  function handleAddRow() {
    if (rows.length >= 10) return;
    setRows((current) => [...current, createRow()]);
  }

  function handleRemoveRow(id: string) {
    setRows((current) => current.filter((row) => row.id !== id));
  }

  function handleChangeRow(id: string, patch: Partial<AnswerRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function handleAutofill() {
    setRows(prefillQuestions.slice(0, 10).map((q) => createRow(q.question_id, "0")));
  }

  function handleRun() {
    if (userId.trim() === "") {
      setError("user_id wajib diisi.");
      return;
    }
    if (rows.length !== 10) {
      setError(`Jawaban harus tepat 10, saat ini ${rows.length}.`);
      return;
    }
    const missing = rows.findIndex((row) => row.question_id.trim() === "");
    if (missing >= 0) {
      setError(`question_id pada baris ${missing + 1} belum diisi.`);
      return;
    }
    setError(null);
    onSubmit({
      user_id: userId.trim(),
      answers: rows.map((row) => ({ question_id: row.question_id.trim(), choice: Number(row.choice) })),
    });
  }

  return (
    <div className="space-y-4">
      <FieldShell label="User ID" htmlFor="toolform-submit-user">
        <input
          id="toolform-submit-user"
          type="text"
          value={userId}
          disabled={disabled}
          onChange={(event) => setUserId(event.target.value)}
          className={inputClassName}
        />
      </FieldShell>
      {prefillQuestions.length > 0 && (
        <button
          type="button"
          onClick={handleAutofill}
          disabled={disabled}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-glass-border px-4 text-sm font-medium text-text transition-colors hover:bg-glass disabled:cursor-not-allowed disabled:opacity-50"
        >
          Isi otomatis dari hasil Start Assessment ({prefillQuestions.length} soal)
        </button>
      )}
      <AnswersEditor rows={rows} disabled={disabled} onAdd={handleAddRow} onRemove={handleRemoveRow} onChange={handleChangeRow} />
      <p className="-mt-2 text-xs leading-5 text-muted">Biasanya diisi otomatis dari hasil Start Assessment.</p>
      <ErrorText message={error} />
      <button type="button" onClick={handleRun} disabled={disabled} className={runButtonClassName}>
        Jalankan
      </button>
    </div>
  );
}
function RecommendPathForm({
  disabled,
  onSubmit,
  initialMastery,
}: Pick<ToolFormProps, "disabled" | "onSubmit" | "initialMastery">) {
  const storeMastery = useGenomeStore((state) => state.mastery);
  const chainedMastery = initialMastery ?? null;
  const [userId, setUserId] = useState("demo");
  const [targetRole, setTargetRole] = useState("data_analyst");
  const [useStoreMastery, setUseStoreMastery] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasStoreMastery = chainedMastery !== null || storeMastery !== null;

  function handleRun() {
    if (userId.trim() === "") {
      setError("user_id wajib diisi.");
      return;
    }
    const mastery = useStoreMastery ? (chainedMastery ?? storeMastery) : null;
    if (!mastery) {
      setError("Jalankan Submit Answers dulu agar mastery tersedia.");
      return;
    }
    setError(null);
    onSubmit({ user_id: userId.trim(), target_role: targetRole, mastery });
  }

  return (
    <div className="space-y-4">
      <FieldShell label="User ID" htmlFor="toolform-rec-user">
        <input id="toolform-rec-user" type="text" value={userId} disabled={disabled} onChange={(event) => setUserId(event.target.value)} className={inputClassName} />
      </FieldShell>
      <FieldShell label="Target Role" htmlFor="toolform-rec-role">
        <select id="toolform-rec-role" value={targetRole} disabled={disabled} onChange={(event) => setTargetRole(event.target.value)} className={inputClassName}>
          {TARGET_ROLES.map((role) => (
            <option key={role.value} value={role.value} className="bg-bg text-text">
              {role.label}
            </option>
          ))}
        </select>
      </FieldShell>
      <div className="rounded-md border border-glass-border p-3">
        {hasStoreMastery ? (
          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-text">
            <input type="checkbox" checked={useStoreMastery} disabled={disabled} onChange={(event) => setUseStoreMastery(event.target.checked)} className="mt-1 size-4 accent-primary" />
            <span>
              Ambil mastery dari asesmen terakhir
              <span className="mt-1 block text-xs text-muted">Menggunakan penguasaan skill yang tersimpan di aplikasi ini.</span>
            </span>
          </label>
        ) : (
          <p role="alert" className="text-sm leading-6 text-pink">
            Belum ada mastery tersimpan. Jalankan Submit Answers dulu, atau selesaikan asesmen di halaman Assessment.
          </p>
        )}
      </div>
      <ErrorText message={error} />
      <button type="button" onClick={handleRun} disabled={disabled} className={runButtonClassName}>
        Jalankan
      </button>
    </div>
  );
}

function GeneratePassportForm({
  disabled,
  onSubmit,
  initialMastery,
}: Pick<ToolFormProps, "disabled" | "onSubmit" | "initialMastery">) {
  const storeMastery = useGenomeStore((state) => state.mastery);
  const chainedMastery = initialMastery ?? null;
  const hasStoreMastery = chainedMastery !== null || storeMastery !== null;
  const [userId, setUserId] = useState("demo");
  const [email, setEmail] = useState("demo@example.com");
  const [targetRole, setTargetRole] = useState("data_analyst");
  const [confirm, setConfirm] = useState(false);
  const [useStoreMastery, setUseStoreMastery] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function handleRun() {
    if (userId.trim() === "") {
      setError("user_id wajib diisi.");
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError("email wajib berupa alamat email yang valid.");
      return;
    }
    if (!confirm) {
      setError("Centang persetujuan pembuatan Passport dulu.");
      return;
    }
    setError(null);
    onSubmit({
      user_id: userId.trim(),
      email: email.trim(),
      target_role: targetRole,
      confirm: true,
      mastery: useStoreMastery ? (chainedMastery ?? storeMastery ?? {}) : {},
    });
  }

  return (
    <div className="space-y-4">
      <FieldShell label="User ID" htmlFor="toolform-pass-user">
        <input id="toolform-pass-user" type="text" value={userId} disabled={disabled} onChange={(event) => setUserId(event.target.value)} className={inputClassName} />
      </FieldShell>
      <FieldShell label="Email" htmlFor="toolform-pass-email">
        <input id="toolform-pass-email" type="email" value={email} disabled={disabled} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" className={inputClassName} />
      </FieldShell>
      <FieldShell label="Target Role" htmlFor="toolform-pass-role">
        <select id="toolform-pass-role" value={targetRole} disabled={disabled} onChange={(event) => setTargetRole(event.target.value)} className={inputClassName}>
          {TARGET_ROLES.map((role) => (
            <option key={role.value} value={role.value} className="bg-bg text-text">
              {role.label}
            </option>
          ))}
        </select>
      </FieldShell>
      <div className="rounded-md border border-glass-border p-3">
        {hasStoreMastery ? (
          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-text">
            <input type="checkbox" checked={useStoreMastery} disabled={disabled} onChange={(event) => setUseStoreMastery(event.target.checked)} className="mt-1 size-4 accent-primary" />
            <span>
              Ambil mastery dari asesmen terakhir
              <span className="mt-1 block text-xs text-muted">Menggunakan penguasaan skill yang tersimpan di aplikasi ini.</span>
            </span>
          </label>
        ) : (
          <p className="text-sm leading-6 text-muted">Belum ada mastery tersimpan, Passport dibuat dengan mastery kosong.</p>
        )}
      </div>
      <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-text">
        <input type="checkbox" checked={confirm} disabled={disabled} onChange={(event) => setConfirm(event.target.checked)} className="mt-1 size-4 accent-primary" />
        <span>Saya setuju buat Passport dan kirim email</span>
      </label>
      <ErrorText message={error} />
      <button type="button" onClick={handleRun} disabled={disabled} className={runButtonClassName}>
        Jalankan
      </button>
    </div>
  );
}

/** Merender form input sesuai tool aktif dan mengirim JSON ke parent. */
export function ToolForm({
  tool,
  disabled = false,
  onSubmit,
  prefillQuestions,
  initialRows,
  initialMastery,
}: ToolFormProps) {
  if (tool === "start_skill_assessment") {
    return <StartAssessmentForm disabled={disabled} onSubmit={onSubmit} />;
  }
  if (tool === "submit_assessment_answers") {
    return (
      <SubmitAnswersForm
        disabled={disabled}
        onSubmit={onSubmit}
        prefillQuestions={prefillQuestions}
        initialRows={initialRows}
      />
    );
  }
  if (tool === "recommend_career_path") {
    return (
      <RecommendPathForm
        disabled={disabled}
        onSubmit={onSubmit}
        initialMastery={initialMastery}
      />
    );
  }
  return (
    <GeneratePassportForm
      disabled={disabled}
      onSubmit={onSubmit}
      initialMastery={initialMastery}
    />
  );
}

