export type AgentToolName =
  | "start_skill_assessment"
  | "submit_assessment_answers"
  | "recommend_career_path"
  | "generate_skill_passport";

export interface AgentTool {
  name: AgentToolName;
  label: string;
  template: string;
}

export const AGENT_TOOLS: AgentTool[] = [
  {
    name: "start_skill_assessment",
    label: "Start Assessment",
    template: '{"user_id":"demo","target_role":"data_analyst"}',
  },
  {
    name: "submit_assessment_answers",
    label: "Submit Answers",
    template: '{"user_id":"demo","answers":[]}',
  },
  {
    name: "recommend_career_path",
    label: "Recommend Path",
    template: '{"user_id":"demo","target_role":"data_analyst","mastery":{}}',
  },
  {
    name: "generate_skill_passport",
    label: "Generate Passport",
    template:
      '{"user_id":"demo","email":"demo@example.com","confirm":true,"target_role":"data_analyst","mastery":{}}',
  },
];

export interface ToolPickerProps {
  activeTool: AgentToolName | null;
  onSelect: (toolName: AgentToolName, template: string) => void;
}

/** Empat pil pemilih tool yang mengisi template JSON ke kolom pesan. */
export function ToolPicker({ activeTool, onSelect }: ToolPickerProps) {
  return (
    <div
      role="group"
      aria-label="Pilih tool agent"
      className="flex flex-wrap gap-2"
    >
      {AGENT_TOOLS.map((tool) => {
        const isActive = activeTool === tool.name;
        return (
          <button
            key={tool.name}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(tool.name, tool.template)}
            className={`min-h-11 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-soft ${
              isActive
                ? "border-cyan text-primary-soft"
                : "border-glass-border text-muted hover:text-text"
            }`}
          >
            {tool.label}
          </button>
        );
      })}
    </div>
  );
}
