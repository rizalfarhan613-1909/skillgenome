import { NextResponse } from "next/server";
import {
  EngineValidationError,
  runGeneratePassport,
  runRecommendPath,
  runStartAssessment,
  runSubmitAnswers,
} from "@/lib/engine-local";
import {
  GeneratePassportRequest,
  StartAssessmentRequest,
  SubmitAnswersRequest,
} from "@/lib/schemas";
import { z } from "zod";

const RecommendPathRequest = z.object({
  user_id: z.string().min(1, "user_id wajib diisi."),
  target_role: z.string().min(1, "target_role wajib diisi."),
  mastery: z.record(z.string(), z.number()).optional(),
});

const TOOL_SCHEMAS = {
  start_skill_assessment: StartAssessmentRequest,
  submit_assessment_answers: SubmitAnswersRequest,
  recommend_career_path: RecommendPathRequest,
  generate_skill_passport: GeneratePassportRequest,
} as const;

type ToolName = keyof typeof TOOL_SCHEMAS;

const FLOW_IDS: Record<ToolName, string> = {
  start_skill_assessment: "start_skill_assessment",
  submit_assessment_answers: "submit_assessment_answers",
  recommend_career_path: "recommend_career_path",
  generate_skill_passport: "generate_skill_passport",
};

function isToolName(value: string): value is ToolName {
  return value in TOOL_SCHEMAS;
}

/** Memanggil Langflow lewat REST bila ENGINE_MODE=langflow. */
async function runViaLangflow(tool: ToolName, body: unknown) {
  const baseUrl = process.env.LANGFLOW_BASE_URL;
  if (!baseUrl) {
    throw new EngineValidationError(
      "ENGINE_MODE=langflow tetapi LANGFLOW_BASE_URL belum diset.",
    );
  }

  const response = await fetch(
    `${baseUrl.replace(/\/$/, "")}/api/v1/run/${FLOW_IDS[tool]}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input_value: JSON.stringify(body),
        output_type: "chat",
        input_type: "chat",
      }),
    },
  );

  if (!response.ok) {
    throw new EngineValidationError(
      `Langflow menolak permintaan (status ${response.status}).`,
    );
  }

  return response.json();
}

/** Menjalankan tool engine secara lokal sesuai nama tool. */
function runLocally(tool: ToolName, body: Record<string, unknown>) {
  switch (tool) {
    case "start_skill_assessment":
      return runStartAssessment(
        body as unknown as Parameters<typeof runStartAssessment>[0],
      );
    case "submit_assessment_answers":
      return runSubmitAnswers(
        body as unknown as Parameters<typeof runSubmitAnswers>[0],
      );
    case "recommend_career_path":
      return runRecommendPath(
        body as unknown as Parameters<typeof runRecommendPath>[0],
      );
    case "generate_skill_passport":
      return runGeneratePassport(
        body as unknown as Parameters<typeof runGeneratePassport>[0],
      );
  }
}

/** Route engine tunggal untuk keempat tool, dengan mode langflow atau lokal. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tool: string }> },
) {
  const { tool } = await params;

  if (!isToolName(tool)) {
    return NextResponse.json(
      { error: `Tool '${tool}' tidak dikenal.` },
      { status: 404 },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body permintaan harus berupa JSON yang valid." },
      { status: 400 },
    );
  }

  const parsed = TOOL_SCHEMAS[tool].safeParse(rawBody);
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

  try {
    if (process.env.ENGINE_MODE === "langflow") {
      const result = await runViaLangflow(tool, parsed.data);
      return NextResponse.json(result);
    }

    return NextResponse.json(runLocally(tool, parsed.data as Record<string, unknown>));
  } catch (error) {
    if (error instanceof EngineValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Engine gagal memproses permintaan." },
      { status: 500 },
    );
  }
}
