import { describe, expect, it } from "vitest";
import jobMarketData from "./data/job_market.json";
import galaxyLayout from "./data/galaxy-layout.json";
import questionData from "./data/questions.json";
import skillData from "./data/skills.json";
import {
  bktReplay,
  bktUpdate,
  cosine,
  coverage,
  estimateTheta,
  fisherInfo,
  genomeVector,
  greedyPath,
  irtP,
  latent,
  matchScore,
  roleRequirement,
  ROLE_WEIGHTS,
  selectItems,
  SKILLS,
  SKILL_EMB,
  whatIf,
  type BktResponse,
  type IrtResponse,
  type Mastery,
  type SelectableItem,
} from "./genome-core";
import {
  JobMarketSchema,
  QuestionSchema,
  SkillSchema,
} from "./schemas";

describe("IRT 2PL", () => {
  it("menghitung peluang jawaban pada golden vector", () => {
    expect(irtP(1, 1.2, 0.5)).toBeCloseTo(0.645656, 5);
  });

  it("menghasilkan 0.5 pada titik simetri", () => {
    expect(irtP(0, 1, 0)).toBeCloseTo(0.5, 10);
  });

  it("menghitung informasi Fisher pada golden vector", () => {
    expect(fisherInfo(0, 1, 0)).toBeCloseTo(0.25, 6);
  });

  it("memilih satu item per skill sebelum mengisi sisa kuota", () => {
    const bank: SelectableItem[] = [];
    for (const skill of SKILLS) {
      bank.push(
        { id: `${skill}-easy`, skill, a: 1, b: 0 },
        { id: `${skill}-informative`, skill, a: 1.5, b: 0 },
      );
    }

    const selected = selectItems(0, bank, 10);

    expect(selected).toHaveLength(10);
    expect(new Set(selected).size).toBe(10);
    for (const skill of SKILLS) {
      expect(selected.some((id) => id.startsWith(skill))).toBe(true);
    }
    expect(selected.filter((id) => id.endsWith("informative"))).toHaveLength(8);
  });

  it("tidak memilih soal yang sudah dijawab", () => {
    const bank: SelectableItem[] = [
      { id: "q_sql_01", skill: "SQL", a: 1, b: 0 },
      { id: "q_sql_02", skill: "SQL", a: 1.5, b: 0 },
    ];

    expect(selectItems(0, bank, 2, ["q_sql_02"])).toEqual(["q_sql_01"]);
  });
});

describe("BKT", () => {
  it("mencocokkan trace [benar, benar, salah] dari 0.30", () => {
    let probability = 0.3;
    const trace: number[] = [];

    for (const correct of [true, true, false]) {
      probability = bktUpdate(probability, correct);
      trace.push(Math.round(probability * 1e6) / 1e6);
    }

    expect(trace[0]).toBeCloseTo(0.726829, 5);
    expect(trace[1]).toBeCloseTo(0.938334, 5);
    expect(trace[2]).toBeCloseTo(0.724334, 5);
  });
});

describe("estimasi theta MAP", () => {
  const demo: IrtResponse[] = [
    { a: 1.2, b: -0.5, correct: true },
    { a: 1, b: 0, correct: false },
    { a: 1.4, b: 0.5, correct: false },
    { a: 0.9, b: -1, correct: true },
    { a: 1.1, b: 0, correct: true },
    { a: 0.8, b: 0.3, correct: false },
    { a: 0.9, b: -0.3, correct: true },
    { a: 0.7, b: 0, correct: false },
    { a: 1.5, b: 0.8, correct: false },
    { a: 1, b: 0.2, correct: true },
  ];

  it("mencocokkan theta ≈ 0.0445", () => {
    expect(estimateTheta(demo)).toBeCloseTo(0.0445, 3);
  });

  it("prior mencegah theta melewati batas saat semua jawaban benar", () => {
    const allCorrect: IrtResponse[] = Array.from({ length: 10 }, () => ({
      a: 1,
      b: 0,
      correct: true,
    }));

    expect(estimateTheta(allCorrect)).toBeLessThan(4);
  });
});

describe("match, coverage, dan greedy path", () => {
  const demo: BktResponse[] = [
    { skill: "SQL", correct: true },
    { skill: "Python", correct: false },
    { skill: "Statistics", correct: false },
    { skill: "Excel", correct: true },
    { skill: "DataViz", correct: true },
    { skill: "BusinessAcumen", correct: false },
    { skill: "Communication", correct: true },
    { skill: "DomainKnowledge", correct: false },
    { skill: "SQL", correct: false },
    { skill: "Excel", correct: true },
  ];
  const mastery = bktReplay(demo);

  it("menghasilkan match_pct 56.5 pada golden vector", () => {
    expect(matchScore(mastery).match_pct).toBeCloseTo(56.5, 1);
  });

  it("mengurutkan Statistics pertama dengan share 22.4%", () => {
    const path = greedyPath(mastery);

    expect(path[0].skill).toBe("Statistics");
    expect(path[0].share_pct).toBeCloseTo(22.4, 1);
  });

  it("menghasilkan delta what-if 18.3 untuk SQL dan Statistics", () => {
    const result = whatIf(mastery, ["SQL", "Statistics"]);

    expect(result.before).toBeCloseTo(56.5, 1);
    expect(result.after).toBeCloseTo(74.8, 1);
    expect(result.delta).toBeCloseTo(18.3, 1);
  });

  it("menghitung vektor requirement dan coverage untuk role", () => {
    expect(roleRequirement()).toHaveLength(SKILLS.length);
    expect(coverage(mastery)).toBeCloseTo(0.5726, 4);
  });
});

describe("utilitas vektor", () => {
  it("menghasilkan cosine nol untuk vektor nol", () => {
    expect(cosine([0, 0, 0], [1, 2, 3])).toBe(0);
  });

  it("menghasilkan cosine satu untuk vektor identik", () => {
    expect(cosine([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 10);
  });

  it("membulatkan genomeVector ke empat desimal", () => {
    const mastery = Object.fromEntries(
      SKILLS.map((skill) => [skill, 0.3997]),
    ) as Mastery;

    expect(genomeVector(mastery)[0]).toBe(0.3997);
  });

  it("menolak vektor genome dengan panjang yang keliru", () => {
    expect(() => latent([0, 0, 0])).toThrow(RangeError);
  });
});

describe("validasi data seed", () => {
  it("memvalidasi 32 soal, dengan empat soal per skill", () => {
    const questions = QuestionSchema.array().parse(questionData);

    expect(questions).toHaveLength(32);
    for (const skill of SKILLS) {
      expect(questions.filter((question) => question.skill === skill)).toHaveLength(4);
    }
  });

  it("memvalidasi skills dan mencocokkan embedding serta bobot algoritma", () => {
    const skills = SkillSchema.array().parse(skillData);

    expect(skills).toHaveLength(SKILLS.length);
    for (const skill of skills) {
      expect(skill.emb8).toEqual([...SKILL_EMB[skill.name]]);
      expect(skill.importance_data_analyst).toBe(
        ROLE_WEIGHTS.data_analyst[skill.name],
      );
      expect(skill.resources).toHaveLength(2);
    }
  });

  it("memvalidasi lima role dan memastikan Data Analyst memakai bobot resmi", () => {
    const roles = JobMarketSchema.array().parse(jobMarketData);
    const dataAnalyst = roles.find((role) => role.name === "data_analyst");

    expect(roles).toHaveLength(5);
    expect(dataAnalyst?.required_skills).toEqual(ROLE_WEIGHTS.data_analyst);
    expect(roles.every((role) => role.salary_range.min === null)).toBe(true);
    expect(roles.every((role) => role.salary_range.max === null)).toBe(true);
    expect(roles.every((role) => role.job_count === null)).toBe(true);
  });

  it("menyalin layout 3D untuk semua skill", () => {
    expect(Object.keys(galaxyLayout).sort()).toEqual([...SKILLS].sort());
    expect(galaxyLayout.SQL).toEqual({ x: 1.75, y: -0.45, z: -0.86 });
    expect(galaxyLayout.DomainKnowledge).toEqual({
      x: -1.22,
      y: -0.93,
      z: -0.17,
    });
  });
});
