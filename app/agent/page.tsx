"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import BottomTab from "@/components/layout/BottomTab";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { ChatInput } from "@/components/agent/ChatInput";
import { ChatMessage } from "@/components/agent/ChatMessage";
import {
  ToolPicker,
  type AgentToolName,
} from "@/components/agent/ToolPicker";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGE =
  "Halo! Pilih salah satu tool di atas. Setiap tool memanggil flow Langflow yang sama seperti IBM Bob.";

let messageCounter = 0;

function createMessage(role: Message["role"], content: string): Message {
  messageCounter += 1;
  return { id: `msg-${messageCounter}`, role, content };
}

/** Halaman agent mode: antarmuka chat ke Langflow REST API. */
export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    createMessage("assistant", INITIAL_MESSAGE),
  ]);
  const [activeTool, setActiveTool] = useState<AgentToolName | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
    },
    [],
  );

  const handleSend = useCallback(async () => {
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
            "Input harus berupa objek JSON, misalnya {\"user_id\":\"demo\"}.",
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
    const sentContent = trimmed;

    setMessages((current) => [
      ...current,
      createMessage("user", sentContent),
    ]);
    setInputValue("");
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

      setMessages((current) => [
        ...current,
        createMessage("assistant", JSON.stringify(payload, null, 2)),
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        createMessage("assistant", "Error: jaringan tidak dapat dijangkau."),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTool, inputValue, isLoading]);

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
            Powered by Langflow REST API — engine yang sama dengan IBM Bob
          </p>
        </header>

        <div className="mb-6">
          <ToolPicker activeTool={activeTool} onSelect={handleSelectTool} />
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
              Menunggu respons Langflow...
            </div>
          )}
        </div>

        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSend}
          isLoading={isLoading}
        />

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
