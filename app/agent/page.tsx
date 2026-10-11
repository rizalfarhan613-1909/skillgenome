"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import BottomTab from "@/components/layout/BottomTab";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { ChatInput } from "@/components/agent/ChatInput";
import { ChatMessage } from "@/components/agent/ChatMessage";
import type { ChainPrefill } from "@/components/agent/ResultCard";
import { ToolForm } from "@/components/agent/ToolForm";
import {
  ToolPicker,
  type AgentToolName,
} from "@/components/agent/ToolPicker";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  tool?: AgentToolName;
  result?: unknown;
}

const INITIAL_MESSAGE =
  "Halo! Pilih tool di atas, isi form, klik Jalankan. Setiap tool akan memanggil Langflow dan menampilkan hasilnya dalam format yang mudah dibaca.";

let messageCounter = 0;

function createMessage(
  role: Message["role"],
  content: string,
  extra?: Pick<Message, "tool" | "result">,
): Message {
  messageCounter += 1;
  return { id: `msg-${messageCounter}`, role, content, ...extra };
}

/** Halaman agent mode: antarmuka chat ke Langflow REST API. */
export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    createMessage("assistant", INITIAL_MESSAGE),
  ]);
  const [activeTool, setActiveTool] = useState<AgentToolName | null>(null);
  const [inputMode, setInputMode] = useState<"form" | "json">("form");
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [prefillQuestions, setPrefillQuestions] = useState<
    { question_id: string }[]
  >([]);
  const [chainAnswers, setChainAnswers] = useState<
    { question_id: string; choice: number }[] | null
  >(null);
  const [chainMastery, setChainMastery] = useState<Record<
    string,
    number
  > | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }
    element.scrollTop = element.scrollHeight;
  }, [messages, isLoading]);

  const handleSelectTool = useCallback(
    (toolName: AgentToolName, template: string) => {
      setActiveTool(toolName);
      setInputValue(template);
      setChainAnswers(null);
      setChainMastery(null);
    },
    [],
  );

  const handleChainNext = useCallback(
    (tool: AgentToolName, prefill: ChainPrefill) => {
      setActiveTool(tool);
      setChainAnswers(prefill.answers ?? null);
      setChainMastery(
        prefill.mastery
          ? (prefill.mastery as Record<string, number>)
          : null,
      );
      setInputValue("");
      setInputMode("form");
    },
    [],
  );

  function extractQuestions(payload: unknown): { question_id: string }[] {
    if (typeof payload !== "object" || payload === null) {
      return [];
    }
    const holder = payload as {
      result?: unknown;
      questions?: unknown;
    };
    const candidates =
      holder.result !== undefined ? holder.result : holder.questions;
    let list: unknown = candidates;
    if (
      typeof candidates === "object" &&
      candidates !== null &&
      "questions" in candidates &&
      Array.isArray((candidates as { questions?: unknown }).questions)
    ) {
      list = (candidates as { questions: unknown[] }).questions;
    }
    if (!Array.isArray(list)) {
      return [];
    }
    return list
      .map((item) => {
        if (typeof item !== "object" || item === null) {
          return null;
        }
        const record = item as { _id?: unknown; question_id?: unknown };
        const questionId =
          typeof record.question_id === "string"
            ? record.question_id
            : typeof record._id === "string"
              ? record._id
              : null;
        return questionId ? { question_id: questionId } : null;
      })
      .filter(
        (item): item is { question_id: string } => item !== null,
      );
  }

  const handleSendInput = useCallback(
    async (tool: AgentToolName, input: Record<string, unknown>) => {
      const displayJson = JSON.stringify(input, null, 2);
      setMessages((current) => [
        ...current,
        createMessage("user", displayJson),
      ]);
      setIsLoading(true);

      try {
        const response = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tool, input }),
        });

        const payload: unknown = await response.json();

        if (!response.ok) {
          const errorText =
            typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            typeof (payload as { error?: unknown }).error === "string"
              ? (payload as { error: string }).error
              : `Permintaan gagal (status ${response.status}).`;
          setMessages((current) => [
            ...current,
            createMessage("assistant", `Error: ${errorText}`),
          ]);
          return;
        }

        if (tool === "start_skill_assessment") {
          setPrefillQuestions(extractQuestions(payload));
        }

        setMessages((current) => [
          ...current,
          createMessage("assistant", JSON.stringify(payload, null, 2), {
            tool,
            result: payload,
          }),
        ]);
      } catch {
        setMessages((current) => [
          ...current,
          createMessage("assistant", "Error: jaringan tidak dapat dijangkau."),
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const handleSendJson = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (trimmed === "" || isLoading) {
      return;
    }

    let input: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        setMessages((current) => [
          ...current,
          createMessage("user", trimmed),
          createMessage(
            "assistant",
            'Input harus berupa objek JSON, misalnya {"user_id":"demo"}.',
          ),
        ]);
        setInputValue("");
        return;
      }
      input = parsed as Record<string, unknown>;
    } catch {
      setMessages((current) => [
        ...current,
        createMessage("user", trimmed),
        createMessage(
          "assistant",
          "Input bukan JSON yang valid. Perbaiki format lalu kirim ulang.",
        ),
      ]);
      setInputValue("");
      return;
    }

    const tool = activeTool ?? "start_skill_assessment";
    setInputValue("");
    await handleSendInput(tool, input);
  }, [activeTool, handleSendInput, inputValue, isLoading]);

  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-3xl flex-col px-4 pb-72 pt-7 sm:px-6 md:pb-12 md:pt-10 lg:pb-16">
        <header className="mb-6">
          <p className="mb-2 font-mono text-sm text-cyan">MODE PENGEMBANGAN</p>
          <h1 className="font-heading text-3xl font-semibold text-text sm:text-4xl">
            Agent Mode
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Didukung Langflow REST API, engine yang sama dengan IBM Bob
          </p>
        </header>

        <div className="mb-6">
          <ToolPicker activeTool={activeTool} onSelect={handleSelectTool} />
        </div>

        <div className="glass mb-4 rounded-lg p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-text">
              {activeTool ? `Input: ${activeTool}` : "Pilih tool dulu"}
            </h2>
            <div
              role="group"
              aria-label="Mode input"
              className="flex shrink-0 rounded-md border border-glass-border p-1"
            >
              <button
                type="button"
                aria-pressed={inputMode === "form"}
                onClick={() => setInputMode("form")}
                className={`inline-flex min-h-9 items-center rounded px-3 text-xs font-medium transition-colors ${
                  inputMode === "form"
                    ? "bg-primary-strong text-white"
                    : "text-muted hover:text-text"
                }`}
              >
                Form
              </button>
              <button
                type="button"
                aria-pressed={inputMode === "json"}
                onClick={() => setInputMode("json")}
                className={`inline-flex min-h-9 items-center rounded px-3 text-xs font-medium transition-colors ${
                  inputMode === "json"
                    ? "bg-primary-strong text-white"
                    : "text-muted hover:text-text"
                }`}
              >
                Advanced (JSON)
              </button>
            </div>
          </div>

          {inputMode === "form" ? (
            activeTool ? (
              <ToolForm
                key={activeTool}
                tool={activeTool}
                disabled={isLoading}
                onSubmit={(input) => handleSendInput(activeTool, input)}
                prefillQuestions={prefillQuestions}
                initialRows={
                  activeTool === "submit_assessment_answers"
                    ? chainAnswers
                    : null
                }
                initialMastery={
                  activeTool === "recommend_career_path" ||
                  activeTool === "generate_skill_passport"
                    ? chainMastery
                    : null
                }
              />
            ) : (
              <p className="text-sm leading-6 text-muted">
                Pilih salah satu tool di atas untuk menampilkan formulir.
              </p>
            )
          ) : (
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSubmit={handleSendJson}
              isLoading={isLoading}
            />
          )}
        </div>

        <div
          ref={scrollRef}
          aria-live="polite"
          aria-label="Riwayat percakapan agent"
          className="glass mb-4 flex min-h-[60vh] max-h-[60vh] flex-col gap-4 overflow-y-auto rounded-lg p-4 sm:p-5"
        >
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              tool={message.tool}
              result={message.result}
              onChainNext={handleChainNext}
            />
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 self-start text-sm text-muted">
              <Loader2
                aria-hidden="true"
                size={16}
                strokeWidth={1.5}
                className="animate-spin text-primary-soft"
              />
              Menunggu respons Langflow.
            </div>
          )}
        </div>

        <p className="mt-3 text-xs leading-5 text-muted">
          Halaman ini memanggil Langflow REST API langsung untuk pengembangan.
          Pastikan Langflow berjalan di LANGFLOW_BASE_URL dan flow sudah terpasang.
        </p>
      </main>

      <Footer />
      <BottomTab />
    </>
  );
}
