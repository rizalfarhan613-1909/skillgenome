"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  ROLE_WEIGHTS,
  SKILLS,
  TARGET_MASTERY,
  type Mastery,
  type RoleName,
  type SkillName,
} from "@/lib/genome-core";

export interface RadarGenomeProps {
  mastery: Mastery;
  role: RoleName;
  focusedSkill?: SkillName | null;
}

interface RadarDatum {
  skill: SkillName;
  user: number;
  target: number;
  focus: number | null;
}

/** Menampilkan delapan skill pada radar beserta tabel aksesibel. */
export function RadarGenome({
  mastery,
  role,
  focusedSkill = null,
}: RadarGenomeProps) {
  const data: RadarDatum[] = SKILLS.map((skill) => {
    const userValue = Math.max(0, Math.min(100, mastery[skill] * 100));
    return {
      skill,
      user: userValue,
      target: TARGET_MASTERY * ROLE_WEIGHTS[role][skill] * 100,
      focus: focusedSkill === skill ? userValue : null,
    };
  });

  return (
    <div className="flex h-full min-h-72 w-full flex-col">
      {focusedSkill && (
        <p className="sr-only" aria-live="polite">
          Fokus radar: {focusedSkill},{" "}
          {Math.round(mastery[focusedSkill] * 100)} persen.
        </p>
      )}
      <div
        className="min-h-0 flex-1"
        role="img"
        aria-label={`Radar penguasaan delapan skill dibanding target ${role.replaceAll("_", " ")}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="68%">
            <PolarGrid stroke="rgb(255 255 255 / 0.1)" />
            <PolarAngleAxis
              dataKey="skill"
              tick={{ fill: "#94A3B8", fontSize: 11 }}
            />
            <PolarRadiusAxis
              domain={[0, 100]}
              tick={false}
              axisLine={false}
              angle={90}
            />
            <Tooltip
              formatter={(value, name) => [
                `${Number(value).toFixed(1)}%`,
                name === "user" ? "Kamu" : "Target Data Analyst",
              ]}
              labelFormatter={(label) => String(label)}
              contentStyle={{
                background: "#0A0A1A",
                border: "1px solid rgb(255 255 255 / 0.08)",
                borderRadius: 12,
              }}
            />
            <Radar
              name="Target Data Analyst"
              dataKey="target"
              stroke="#22D3EE"
              strokeDasharray="5 5"
              fill="none"
              fillOpacity={0}
              isAnimationActive
              animationDuration={400}
            />
            <Radar
              name="Kamu"
              dataKey="user"
              stroke="#22D3EE"
              fill="#22D3EE"
              fillOpacity={0.2}
              dot={{ r: 3, fill: "#22D3EE", strokeWidth: 0 }}
              isAnimationActive
              animationDuration={400}
            />
            <Radar
              name="Fokus"
              dataKey="focus"
              stroke="transparent"
              fill="transparent"
              fillOpacity={0}
              dot={{
                r: 7,
                fill: "#F1F5F9",
                stroke: "#22D3EE",
                strokeWidth: 2,
              }}
              isAnimationActive={false}
              connectNulls={false}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>
          Nilai penguasaan dan target untuk setiap skill
        </caption>
        <thead>
          <tr>
            <th scope="col">Skill</th>
            <th scope="col">Kamu</th>
            <th scope="col">Target Data Analyst</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.skill}>
              <th scope="row">{row.skill}</th>
              <td>{Math.round(row.user)}%</td>
              <td>{Math.round(row.target)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
