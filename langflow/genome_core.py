"""
genome_core.py - inti algoritma SkillGenome (tanpa dependensi eksternal).

Dipakai oleh Custom Component Langflow (Flow 1-3) dan sebagai referensi
port TypeScript (lib/genome-core.ts) untuk what-if simulator di frontend.

Catatan integritas (jangan diklaim lebih dari ini di pitch):
- IRT 2PL dan BKT: implementasi nyata; parameter a, b, dan BKT adalah nilai awal
  yang ditetapkan manual (belum dikalibrasi dari data respons pengguna).
- SKILL_EMB: matriks 8x8 hasil kurasi manual (terinspirasi O*NET), BUKAN model
  RotatE yang dilatih.
- greedy_path: heuristik prioritas, BUKAN reinforcement learning terlatih.
"""
from __future__ import annotations

import math
from typing import Dict, List, Optional, Sequence

SKILLS: List[str] = [
    "SQL", "Python", "Statistics", "Excel",
    "DataViz", "BusinessAcumen", "Communication", "DomainKnowledge",
]

BKT_PARAMS = {"p_l0": 0.30, "p_t": 0.20, "p_s": 0.10, "p_g": 0.20}
TARGET_MASTERY = 0.80

# importance_data_analyst: heuristik awal; ganti dengan agregasi data lowongan.
ROLE_WEIGHTS: Dict[str, Dict[str, float]] = {
    "data_analyst": {
        "SQL": 0.95, "Python": 0.75, "Statistics": 0.80, "Excel": 0.70,
        "DataViz": 0.80, "BusinessAcumen": 0.65, "Communication": 0.70,
        "DomainKnowledge": 0.50,
    }
}

EMB_DIMS = ["quant", "code", "logic", "comm", "biz", "tools", "viz", "dataops"]
SKILL_EMB: Dict[str, List[float]] = {
    "SQL":             [0.30, 0.70, 0.60, 0.00, 0.10, 0.50, 0.00, 0.90],
    "Python":          [0.50, 0.95, 0.70, 0.00, 0.10, 0.60, 0.30, 0.70],
    "Statistics":      [0.95, 0.20, 0.80, 0.10, 0.30, 0.20, 0.30, 0.30],
    "Excel":           [0.50, 0.20, 0.40, 0.10, 0.40, 0.90, 0.40, 0.50],
    "DataViz":         [0.30, 0.30, 0.30, 0.50, 0.30, 0.60, 0.95, 0.20],
    "BusinessAcumen":  [0.20, 0.00, 0.50, 0.50, 0.95, 0.20, 0.20, 0.10],
    "Communication":   [0.00, 0.00, 0.30, 0.95, 0.50, 0.10, 0.40, 0.00],
    "DomainKnowledge": [0.20, 0.00, 0.40, 0.30, 0.90, 0.10, 0.10, 0.20],
}


# ---------------------------------------------------------------- IRT 2PL
def irt_p(theta: float, a: float, b: float) -> float:
    """P(benar) = 1 / (1 + exp(-a (theta - b))), stabil secara numerik."""
    z = a * (theta - b)
    if z >= 0:
        return 1.0 / (1.0 + math.exp(-z))
    e = math.exp(z)
    return e / (1.0 + e)


def fisher_info(theta: float, a: float, b: float) -> float:
    """I(theta) = a^2 * P * (1 - P)."""
    p = irt_p(theta, a, b)
    return (a ** 2) * p * (1.0 - p)


def estimate_theta(
    responses: Sequence[dict],
    theta0: float = 0.0,
    prior_mu: float = 0.0,
    prior_sigma: float = 1.0,
    iters: int = 25,
) -> float:
    """MAP dengan prior Normal(prior_mu, prior_sigma) via Newton-Raphson.

    responses: [{"a": float, "b": float, "correct": bool}, ...]
    Prior mencegah theta menjauh ke tak hingga saat semua jawaban benar/salah.
    """
    theta = theta0
    for _ in range(iters):
        grad = -(theta - prior_mu) / prior_sigma ** 2
        hess = -1.0 / prior_sigma ** 2
        for r in responses:
            p = irt_p(theta, r["a"], r["b"])
            u = 1.0 if r["correct"] else 0.0
            grad += r["a"] * (u - p)
            hess -= (r["a"] ** 2) * p * (1.0 - p)
        step = grad / hess
        theta = max(-4.0, min(4.0, theta - step))
        if abs(step) < 1e-6:
            break
    return theta


def select_items(
    theta: float,
    bank: Sequence[dict],
    n: int = 10,
    answered: Optional[Sequence[str]] = None,
) -> List[str]:
    """Pilih n soal: 1 informasi-maksimal per skill (coverage), sisanya global."""
    seen = set(answered or [])
    pool = [q for q in bank if q["id"] not in seen]
    chosen: List[str] = []

    def info(q: dict) -> float:
        return fisher_info(theta, q["a"], q["b"])

    for skill in SKILLS:
        cands = [q for q in pool if q["skill"] == skill and q["id"] not in chosen]
        if cands and len(chosen) < n:
            best = sorted(cands, key=lambda q: (-info(q), q["id"]))[0]
            chosen.append(best["id"])
    rest = sorted(
        [q for q in pool if q["id"] not in chosen], key=lambda q: (-info(q), q["id"])
    )
    for q in rest:
        if len(chosen) >= n:
            break
        chosen.append(q["id"])
    return chosen


# -------------------------------------------------------------------- BKT
def bkt_update(p_l: float, correct: bool, p_s: float = 0.10,
               p_g: float = 0.20, p_t: float = 0.20) -> float:
    """Satu langkah BKT: posterior dari observasi, lalu transisi belajar."""
    if correct:
        num = p_l * (1.0 - p_s)
        den = num + (1.0 - p_l) * p_g
    else:
        num = p_l * p_s
        den = num + (1.0 - p_l) * (1.0 - p_g)
    posterior = num / den
    return posterior + (1.0 - posterior) * p_t


def bkt_replay(responses: Sequence[dict], params: Optional[dict] = None) -> Dict[str, float]:
    """responses berurutan: [{"skill": str, "correct": bool}, ...] -> mastery per skill."""
    prm = {**BKT_PARAMS, **(params or {})}
    mastery = {s: prm["p_l0"] for s in SKILLS}
    for r in responses:
        mastery[r["skill"]] = bkt_update(
            mastery[r["skill"]], r["correct"], prm["p_s"], prm["p_g"], prm["p_t"]
        )
    return mastery


# ------------------------------------------------- genome, match, roadmap
def genome_vector(mastery: Dict[str, float]) -> List[float]:
    return [round(mastery[s], 4) for s in SKILLS]


def latent(vec: Sequence[float]) -> List[float]:
    """Proyeksi vektor 8 skill ke ruang laten 8 dimensi: vec @ SKILL_EMB."""
    dims = len(EMB_DIMS)
    out = [0.0] * dims
    for i, s in enumerate(SKILLS):
        for d in range(dims):
            out[d] += vec[i] * SKILL_EMB[s][d]
    return out


def cosine(u: Sequence[float], v: Sequence[float]) -> float:
    nu = math.sqrt(sum(x * x for x in u))
    nv = math.sqrt(sum(x * x for x in v))
    if nu == 0 or nv == 0:
        return 0.0
    return sum(x * y for x, y in zip(u, v)) / (nu * nv)


def role_requirement(role: str = "data_analyst") -> List[float]:
    w = ROLE_WEIGHTS[role]
    return [w[s] * TARGET_MASTERY for s in SKILLS]


def coverage(mastery: Dict[str, float], role: str = "data_analyst") -> float:
    """Cosine hanya menilai 'bentuk' profil; coverage menilai 'level' penguasaan."""
    w = ROLE_WEIGHTS[role]
    num = sum(w[s] * min(mastery[s] / TARGET_MASTERY, 1.0) for s in SKILLS)
    return num / sum(w.values())


def match_score(mastery: Dict[str, float], role: str = "data_analyst") -> dict:
    """match = coverage x cosine.

    Hasil uji: profil dengan coverage 0.57 tetap punya cosine 0.99 karena semua
    komponen positif dan cosine mengabaikan magnitudo. Maka cosine dipakai sebagai
    pengali 'konsistensi bentuk profil' (<= 1), bukan sebagai rata-rata.
    """
    cos = cosine(latent(genome_vector(mastery)), latent(role_requirement(role)))
    cov = coverage(mastery, role)
    return {
        "cosine": round(cos, 4),
        "coverage": round(cov, 4),
        "match_pct": round(100.0 * cov * cos, 1),
    }


def greedy_path(mastery: Dict[str, float], role: str = "data_analyst", k: int = 5) -> List[dict]:
    """Prioritas = max(target - mastery, 0) * importance. Dekomposisi bersifat eksak."""
    w = ROLE_WEIGHTS[role]
    rows = []
    for s in SKILLS:
        gap = max(TARGET_MASTERY - mastery[s], 0.0)
        rows.append({"skill": s, "mastery": round(mastery[s], 4), "gap": round(gap, 4),
                     "importance": w[s], "priority": round(gap * w[s], 4)})
    total = sum(r["priority"] for r in rows) or 1.0
    for r in rows:
        r["share_pct"] = round(100.0 * r["priority"] / total, 1)
    rows.sort(key=lambda r: (-r["priority"], r["skill"]))
    return [r for r in rows if r["priority"] > 0][:k]


def what_if(mastery: Dict[str, float], completed: Sequence[str],
            role: str = "data_analyst") -> dict:
    """Simulasi: skill yang 'diselesaikan' dianggap mencapai TARGET_MASTERY."""
    after = {s: (TARGET_MASTERY if s in completed else mastery[s]) for s in SKILLS}
    before_m, after_m = match_score(mastery, role), match_score(after, role)
    return {"before": before_m["match_pct"], "after": after_m["match_pct"],
            "delta": round(after_m["match_pct"] - before_m["match_pct"], 1)}


if __name__ == "__main__":
    # --- self-check (menghasilkan golden vectors untuk uji paritas Python <-> TypeScript)
    assert abs(irt_p(0, 1, 0) - 0.5) < 1e-12
    print("irt_p(1.0, 1.2, 0.5) =", round(irt_p(1.0, 1.2, 0.5), 6))
    print("fisher_info(0, 1.0, 0) =", round(fisher_info(0, 1.0, 0), 6))

    seq = [True, True, False]
    p = BKT_PARAMS["p_l0"]
    trace = []
    for c in seq:
        p = bkt_update(p, c)
        trace.append(round(p, 6))
    print("BKT trace [benar, benar, salah] =", trace)

    demo = [
        {"skill": "SQL", "a": 1.2, "b": -0.5, "correct": True},
        {"skill": "Python", "a": 1.0, "b": 0.0, "correct": False},
        {"skill": "Statistics", "a": 1.4, "b": 0.5, "correct": False},
        {"skill": "Excel", "a": 0.9, "b": -1.0, "correct": True},
        {"skill": "DataViz", "a": 1.1, "b": 0.0, "correct": True},
        {"skill": "BusinessAcumen", "a": 0.8, "b": 0.3, "correct": False},
        {"skill": "Communication", "a": 0.9, "b": -0.3, "correct": True},
        {"skill": "DomainKnowledge", "a": 0.7, "b": 0.0, "correct": False},
        {"skill": "SQL", "a": 1.5, "b": 0.8, "correct": False},
        {"skill": "Excel", "a": 1.0, "b": 0.2, "correct": True},
    ]
    theta = estimate_theta(demo)
    print("theta MAP =", round(theta, 4))
    mastery = bkt_replay(demo)
    print("mastery   =", {k: round(v, 4) for k, v in mastery.items()})
    print("genome    =", genome_vector(mastery))
    print("match     =", match_score(mastery))
    for row in greedy_path(mastery):
        print("path      =", row)
    print("what_if(SQL, Statistics) =", what_if(mastery, ["SQL", "Statistics"]))

    # semua jawaban benar tidak boleh membuat theta meledak (berkat prior)
    all_right = [{"a": 1.0, "b": 0.0, "correct": True}] * 10
    assert estimate_theta(all_right) < 4.0
    bank = [{"id": f"q{i:02d}", "skill": SKILLS[i % 8], "a": 1.0 + 0.1 * (i % 5),
             "b": -1.5 + 0.25 * i} for i in range(24)]
    sel = select_items(0.0, bank, n=10)
    assert len(sel) == 10 and len(set(sel)) == 10
    print("select_items(theta=0, n=10) =", sel)
    print("OK")