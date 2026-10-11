/**
 * Inti algoritma SkillGenome, dipakai untuk estimasi IRT, mastery BKT,
 * kecocokan peran, dan simulasi jalur belajar.
 */

export const SKILLS = [
  "SQL",
  "Python",
  "Statistics",
  "Excel",
  "DataViz",
  "BusinessAcumen",
  "Communication",
  "DomainKnowledge",
] as const;

export type SkillName = (typeof SKILLS)[number];
export type Mastery = Record<SkillName, number>;

export const BKT_PARAMS = {
  pL0: 0.3,
  pT: 0.2,
  pS: 0.1,
  pG: 0.2,
} as const;

export const TARGET_MASTERY = 0.8;

export const ROLE_WEIGHTS = {
  data_analyst: {
    SQL: 0.95,
    Python: 0.75,
    Statistics: 0.8,
    Excel: 0.7,
    DataViz: 0.8,
    BusinessAcumen: 0.65,
    Communication: 0.7,
    DomainKnowledge: 0.5,
  },
} as const satisfies Record<string, Mastery>;

export type RoleName = keyof typeof ROLE_WEIGHTS;

export const EMB_DIMS = [
  "quant",
  "code",
  "logic",
  "comm",
  "biz",
  "tools",
  "viz",
  "dataops",
] as const;

export const SKILL_EMB = {
  SQL: [0.3, 0.7, 0.6, 0, 0.1, 0.5, 0, 0.9],
  Python: [0.5, 0.95, 0.7, 0, 0.1, 0.6, 0.3, 0.7],
  Statistics: [0.95, 0.2, 0.8, 0.1, 0.3, 0.2, 0.3, 0.3],
  Excel: [0.5, 0.2, 0.4, 0.1, 0.4, 0.9, 0.4, 0.5],
  DataViz: [0.3, 0.3, 0.3, 0.5, 0.3, 0.6, 0.95, 0.2],
  BusinessAcumen: [0.2, 0, 0.5, 0.5, 0.95, 0.2, 0.2, 0.1],
  Communication: [0, 0, 0.3, 0.95, 0.5, 0.1, 0.4, 0],
  DomainKnowledge: [0.2, 0, 0.4, 0.3, 0.9, 0.1, 0.1, 0.2],
} as const satisfies Record<SkillName, readonly number[]>;

export interface IrtResponse {
  a: number;
  b: number;
  correct: boolean;
}

export interface EstimateThetaOptions {
  theta0?: number;
  priorMu?: number;
  priorSigma?: number;
  iters?: number;
}

export interface IrtItem {
  id: string;
  skill: SkillName;
}

export type SelectableItem = IrtItem &
  (
    | { a: number; b: number }
    | { discrimination: number; difficulty: number }
  );

export interface BktUpdateParams {
  pS?: number;
  pG?: number;
  pT?: number;
}

export interface BktReplayParams extends BktUpdateParams {
  pL0?: number;
}

export interface BktResponse {
  skill: SkillName;
  correct: boolean;
}

export interface MatchScore {
  cosine: number;
  coverage: number;
  match_pct: number;
}

export interface RoadmapStep {
  skill: SkillName;
  mastery: number;
  gap: number;
  importance: number;
  priority: number;
  share_pct: number;
}

export interface WhatIfResult {
  before: number;
  after: number;
  delta: number;
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

/**
 * Menghitung peluang jawaban benar dengan model IRT 2PL yang stabil numerik.
 */
export function irtP(theta: number, a: number, b: number): number {
  const z = a * (theta - b);
  if (z >= 0) {
    return 1 / (1 + Math.exp(-z));
  }
  const e = Math.exp(z);
  return e / (1 + e);
}

/**
 * Menghitung informasi Fisher untuk satu item pada kemampuan theta.
 */
export function fisherInfo(theta: number, a: number, b: number): number {
  const p = irtP(theta, a, b);
  return a ** 2 * p * (1 - p);
}

/**
 * Mengestimasi theta dengan MAP dan prior normal melalui Newton-Raphson.
 */
export function estimateTheta(
  responses: readonly IrtResponse[],
  options: EstimateThetaOptions = {},
): number {
  const {
    theta0 = 0,
    priorMu = 0,
    priorSigma = 1,
    iters = 25,
  } = options;
  let theta = theta0;

  for (let iteration = 0; iteration < iters; iteration += 1) {
    let grad = -(theta - priorMu) / priorSigma ** 2;
    let hess = -1 / priorSigma ** 2;

    for (const response of responses) {
      const p = irtP(theta, response.a, response.b);
      const observed = response.correct ? 1 : 0;
      grad += response.a * (observed - p);
      hess -= response.a ** 2 * p * (1 - p);
    }

    const step = grad / hess;
    theta = Math.max(-4, Math.min(4, theta - step));
    if (Math.abs(step) < 1e-6) {
      break;
    }
  }

  return theta;
}

/**
 * Memilih item berinformasi tertinggi sambil memprioritaskan cakupan skill.
 */
export function selectItems(
  theta: number,
  bank: readonly SelectableItem[],
  n = 10,
  answered: readonly string[] = [],
): string[] {
  const seen = new Set(answered);
  const pool = bank.filter((item) => !seen.has(item.id));
  const chosen: string[] = [];

  const itemInfo = (item: SelectableItem): number => {
    const a = "discrimination" in item ? item.discrimination : item.a;
    const b = "difficulty" in item ? item.difficulty : item.b;
    return fisherInfo(theta, a, b);
  };

  for (const skill of SKILLS) {
    const candidates = pool.filter(
      (item) => item.skill === skill && !chosen.includes(item.id),
    );
    if (candidates.length > 0 && chosen.length < n) {
      candidates.sort(
        (left, right) =>
          itemInfo(right) - itemInfo(left) ||
          compareStrings(left.id, right.id),
      );
      chosen.push(candidates[0].id);
    }
  }

  const rest = pool
    .filter((item) => !chosen.includes(item.id))
    .sort(
      (left, right) =>
        itemInfo(right) - itemInfo(left) ||
        compareStrings(left.id, right.id),
    );

  for (const item of rest) {
    if (chosen.length >= n) {
      break;
    }
    chosen.push(item.id);
  }

  return chosen;
}

/**
 * Memperbarui satu probabilitas mastery dengan observasi dan transisi BKT.
 */
export function bktUpdate(
  pL: number,
  correct: boolean,
  params: BktUpdateParams = {},
): number {
  const { pS = BKT_PARAMS.pS, pG = BKT_PARAMS.pG, pT = BKT_PARAMS.pT } =
    params;
  let numerator: number;
  let denominator: number;

  if (correct) {
    numerator = pL * (1 - pS);
    denominator = numerator + (1 - pL) * pG;
  } else {
    numerator = pL * pS;
    denominator = numerator + (1 - pL) * (1 - pG);
  }

  const posterior = numerator / denominator;
  return posterior + (1 - posterior) * pT;
}

/**
 * Memutar ulang respons berurutan untuk menghitung mastery tiap skill.
 */
export function bktReplay(
  responses: readonly BktResponse[],
  params: BktReplayParams = {},
): Mastery {
  const { pL0 = BKT_PARAMS.pL0, pS, pG, pT } = params;
  const updateParams = { pS, pG, pT };
  const mastery = Object.fromEntries(
    SKILLS.map((skill) => [skill, pL0]),
  ) as Mastery;

  for (const response of responses) {
    mastery[response.skill] = bktUpdate(
      mastery[response.skill],
      response.correct,
      updateParams,
    );
  }

  return mastery;
}

/**
 * Mengubah peta mastery menjadi vektor terurut dan dibulatkan empat desimal.
 */
export function genomeVector(mastery: Mastery): number[] {
  return SKILLS.map((skill) => Math.round(mastery[skill] * 10_000) / 10_000);
}

/**
 * Memproyeksikan vektor delapan skill ke ruang laten delapan dimensi.
 */
export function latent(vec: readonly number[]): number[] {
  if (vec.length !== SKILLS.length) {
    throw new RangeError(`Vektor genome harus berisi ${SKILLS.length} nilai.`);
  }

  const output = Array<number>(EMB_DIMS.length).fill(0);
  for (let skillIndex = 0; skillIndex < SKILLS.length; skillIndex += 1) {
    const embedding = SKILL_EMB[SKILLS[skillIndex]];
    for (let dimension = 0; dimension < EMB_DIMS.length; dimension += 1) {
      output[dimension] += vec[skillIndex] * embedding[dimension];
    }
  }
  return output;
}

/**
 * Menghitung cosine similarity; dua vektor nol menghasilkan nilai nol.
 */
export function cosine(u: readonly number[], v: readonly number[]): number {
  const length = Math.min(u.length, v.length);
  let dotProduct = 0;
  let normU = 0;
  let normV = 0;

  for (let index = 0; index < length; index += 1) {
    dotProduct += u[index] * v[index];
    normU += u[index] ** 2;
    normV += v[index] ** 2;
  }

  if (normU === 0 || normV === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normU) * Math.sqrt(normV));
}

/**
 * Mengembalikan vektor kebutuhan skill untuk role dengan target mastery.
 */
export function roleRequirement(role: RoleName = "data_analyst"): number[] {
  const weights = ROLE_WEIGHTS[role];
  return SKILLS.map((skill) => weights[skill] * TARGET_MASTERY);
}

/**
 * Menghitung coverage mastery terhadap bobot dan target role.
 */
export function coverage(
  mastery: Mastery,
  role: RoleName = "data_analyst",
): number {
  const weights = ROLE_WEIGHTS[role];
  const numerator = SKILLS.reduce(
    (total, skill) =>
      total +
      weights[skill] * Math.min(mastery[skill] / TARGET_MASTERY, 1),
    0,
  );
  const denominator = SKILLS.reduce(
    (total, skill) => total + weights[skill],
    0,
  );
  return numerator / denominator;
}

/**
 * Menghitung skor match sebagai coverage dikali cosine similarity.
 */
export function matchScore(
  mastery: Mastery,
  role: RoleName = "data_analyst",
): MatchScore {
  const similarity = cosine(
    latent(genomeVector(mastery)),
    latent(roleRequirement(role)),
  );
  const roleCoverage = coverage(mastery, role);

  return {
    cosine: Math.round(similarity * 10_000) / 10_000,
    coverage: Math.round(roleCoverage * 10_000) / 10_000,
    match_pct: Math.round(100 * roleCoverage * similarity * 10) / 10,
  };
}

/**
 * Mengurutkan skill berdasarkan gap mastery dikali importance role.
 */
export function greedyPath(
  mastery: Mastery,
  role: RoleName = "data_analyst",
  k = 5,
): RoadmapStep[] {
  const weights = ROLE_WEIGHTS[role];
  const rows: RoadmapStep[] = SKILLS.map((skill) => {
    const gap = Math.max(TARGET_MASTERY - mastery[skill], 0);
    return {
      skill,
      mastery: Math.round(mastery[skill] * 10_000) / 10_000,
      gap: Math.round(gap * 10_000) / 10_000,
      importance: weights[skill],
      priority: Math.round(gap * weights[skill] * 10_000) / 10_000,
      share_pct: 0,
    };
  });

  const total = rows.reduce((sum, row) => sum + row.priority, 0) || 1;
  for (const row of rows) {
    row.share_pct =
      Math.round((100 * row.priority) / total * 10) / 10;
  }

  return rows
    .sort(
      (left, right) =>
        right.priority - left.priority ||
        compareStrings(left.skill, right.skill),
    )
    .filter((row) => row.priority > 0)
    .slice(0, k);
}

/**
 * Mensimulasikan mastery target untuk skill selesai dan menghitung perubahan match.
 */
export function whatIf(
  mastery: Mastery,
  completed: readonly SkillName[],
  role: RoleName = "data_analyst",
): WhatIfResult {
  const completedSkills = new Set(completed);
  const after = Object.fromEntries(
    SKILLS.map((skill) => [
      skill,
      completedSkills.has(skill) ? TARGET_MASTERY : mastery[skill],
    ]),
  ) as Mastery;
  const beforeMatch = matchScore(mastery, role).match_pct;
  const afterMatch = matchScore(after, role).match_pct;

  return {
    before: beforeMatch,
    after: afterMatch,
    delta: Math.round((afterMatch - beforeMatch) * 10) / 10,
  };
}
