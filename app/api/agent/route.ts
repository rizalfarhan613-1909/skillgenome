import { NextResponse } from "next/server";
import { z } from "zod";

const VALID_TOOLS = [
  "start_skill_assessment",
  "submit_assessment_answers",
  "recommend_career_path",
  "generate_skill_passport",
] as const;

const TOOL_SET = new Set<string>(VALID_TOOLS);

const AgentRequestSchema = z.object({
  tool: z.string().min(1, "tool wajib diisi."),
  input: z.record(z.string(), z.unknown()),
});

const TIMEOUT_MS = 30_000;

function isToolName(value: string): boolean {
  return TOOL_SET.has(value);
}

/** Merangkum keluaran Langflow menjadi objek JSON hasil tool. */
function extractResult(payload: unknown): unknown {
  const outer = payload as {
    outputs?: { outputs?: { results?: { message?: { text?: string } } }[] }[];
  };
  const text = outer?.outputs?.[0]?.outputs?.[0]?.results?.message?.text;

  if (typeof text !== "string") {
    throw new Error("Struktur respons Langflow tidak dikenali.");
  }

  // Langflow sering membungkus JSON dalam pagar markdown (```json ... ```).
  const unfenced = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(unfenced);
  } catch {
    return { raw_text: text };
  }
}

/** Meneruskan permintaan tool ke Langflow REST API (engine yang sama dengan IBM Bob). */
export async function POST(request: Request) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body permintaan harus berupa JSON yang valid." },
      { status: 400 },
    );
  }

  const parsed = AgentRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Permintaan tidak valid.",
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const { tool, input } = parsed.data;

  if (!isToolName(tool)) {
    return NextResponse.json(
      {
        error: `Tool '${tool}' tidak dikenal.`,
        valid_tools: VALID_TOOLS,
      },
      { status: 400 },
    );
  }

  const flowId = process.env[`FLOW_ID_${tool.toUpperCase()}`];
  if (!flowId) {
    return NextResponse.json(
      { error: `Konfigurasi FLOW_ID_${tool.toUpperCase()} belum diset.` },
      { status: 500 },
    );
  }

  const baseUrl = process.env.LANGFLOW_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { error: "Konfigurasi LANGFLOW_BASE_URL belum diset." },
      { status: 500 },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(
      `${baseUrl.replace(/\/$/, "")}/api/v1/run/${flowId}?stream=false`,
      {
        method: "POST",
        headers: {
          "x-api-key": process.env.LANGFLOW_API_KEY ?? "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input_value: JSON.stringify(input),
          input_type: "chat",
          output_type: "chat",
        }),
        signal: controller.signal,
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Langflow menolak permintaan (status ${response.status}).`,
          detail: await response.text(),
        },
        { status: 502 },
      );
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return NextResponse.json(
        { error: "Respons Langflow bukan JSON yang valid." },
        { status: 502 },
      );
    }

    return NextResponse.json({ result: extractResult(payload) });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Langflow tidak merespons dalam 30 detik." },
        { status: 504 },
      );
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Gagal menghubungi Langflow: ${error.message}`
            : "Gagal menghubungi Langflow.",
      },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
