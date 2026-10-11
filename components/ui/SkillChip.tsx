import {
  Briefcase,
  ChartNoAxesColumn,
  Code,
  Compass,
  Database,
  MessageSquareText,
  Sigma,
  Table2,
  type LucideIcon,
} from "lucide-react";
import type { SkillName } from "@/lib/genome-core";

export interface SkillChipProps {
  skill: SkillName;
  level?: number;
}

const skillPresentation: Record<
  SkillName,
  { Icon: LucideIcon; color: string }
> = {
  SQL: { Icon: Database, color: "text-cyan" },
  Python: { Icon: Code, color: "text-cyan" },
  Statistics: { Icon: Sigma, color: "text-primary-soft" },
  Excel: { Icon: Table2, color: "text-cyan" },
  DataViz: { Icon: ChartNoAxesColumn, color: "text-primary-soft" },
  BusinessAcumen: { Icon: Briefcase, color: "text-green" },
  Communication: { Icon: MessageSquareText, color: "text-pink" },
  DomainKnowledge: { Icon: Compass, color: "text-green" },
};

/** Menampilkan skill dengan ikon, label teks, dan level mastery opsional. */
export function SkillChip({ skill, level }: SkillChipProps) {
  const { Icon, color } = skillPresentation[skill];
  const masteryPercent =
    level === undefined ? undefined : Math.round(level * 100);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-glass-border bg-glass px-3 py-1.5 text-sm ${color}`}
    >
      <Icon aria-hidden="true" size={16} strokeWidth={1.5} />
      <span className="text-text">{skill}</span>
      {masteryPercent !== undefined && (
        <span className="font-mono text-xs tabular-nums text-muted">
          {masteryPercent}%
        </span>
      )}
    </span>
  );
}
