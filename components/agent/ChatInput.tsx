"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useRef, type ChangeEvent, type KeyboardEvent } from "react";

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const MAX_ROWS = 5;
const LINE_HEIGHT_PX = 24;

/** Kolom pesan dengan textarea tumbuh otomatis hingga lima baris. */
export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) {
      return;
    }
    element.style.height = "auto";
    const maxHeight = LINE_HEIGHT_PX * MAX_ROWS;
    element.style.height = `${Math.min(element.scrollHeight, maxHeight)}px`;
  }, [value]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!isLoading && value.trim() !== "") {
        onSubmit();
      }
    }
  };

  return (
    <form
      className="glass flex items-end gap-3 rounded-lg p-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!isLoading && value.trim() !== "") {
          onSubmit();
        }
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder="Ketik JSON request..."
        aria-label="Ketik JSON request"
        disabled={isLoading}
        className="max-h-32 min-h-11 flex-1 resize-none overflow-y-auto bg-transparent px-1 py-2 text-sm leading-6 text-text outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-50"
      />

      <button
        type="submit"
        aria-label="Kirim pesan"
        disabled={isLoading || value.trim() === ""}
        className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary-strong text-white transition-colors hover:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ArrowUp aria-hidden="true" size={18} strokeWidth={2} />
      </button>
    </form>
  );
}
