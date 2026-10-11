import { motion, useReducedMotion } from "framer-motion";
import { ResultCard, type ChainPrefill } from "@/components/agent/ResultCard";
import type { AgentToolName } from "@/components/agent/ToolPicker";

export interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  /** Tool yang menghasilkan pesan ini, bila berupa hasil /api/agent. */
  tool?: AgentToolName;
  /** Hasil mentah untuk dirender sebagai ResultCard. */
  result?: unknown;
  /** Dipanggil saat user klik tombol chain di ResultCard. */
  onChainNext?: (tool: AgentToolName, prefill: ChainPrefill) => void;
}

/** Mengubah teks menjadi objek bila isinya JSON, selain itu mengembalikan null. */
function tryParseJson(content: string): unknown {
  const trimmed = content.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return null;
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

/** Bubble pesan chat: hasil tool dirender sebagai card, sisanya pretty-print/teks. */
export function ChatMessage({
  role,
  content,
  tool,
  result,
  onChainNext,
}: ChatMessageProps) {
  const reduceMotion = useReducedMotion();
  const isUser = role === "user";
  const parsed = tryParseJson(content);

  const bubbleClass = isUser
    ? "self-end bg-primary-strong text-white"
    : "self-start glass text-text";

  return (
    <motion.div
      className={`flex max-w-[92%] flex-col gap-1 rounded-lg px-4 py-3 text-sm leading-6 sm:max-w-[80%] ${bubbleClass}`}
      initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="font-mono text-xs opacity-60">
        {isUser ? "Kamu" : "Agent"}
      </span>

      {!isUser && tool !== undefined && result !== undefined && onChainNext ? (
        <ResultCard tool={tool} result={result} onChainNext={onChainNext} />
      ) : parsed !== null ? (
        <pre className="overflow-auto rounded-md bg-bg/60 p-2 font-mono text-xs leading-5">
          <code>{JSON.stringify(parsed, null, 2)}</code>
        </pre>
      ) : (
        <p className="whitespace-pre-wrap break-words">{content}</p>
      )}
    </motion.div>
  );
}
