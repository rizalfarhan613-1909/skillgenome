# Architecture — SkillGenome

> **Dokumen:** System Architecture · **Versi:** 1.0 · **Tanggal:** 10 Oktober 2026
> **Terkait:** [PRD.md](./PRD.md) · [Design.md](./Design.md) · [Task.md](./Task.md)

| Item | Isi |
|---|---|
| Pola | Satu engine (Langflow), dua klien (IBM Bob via MCP, Web via REST) |
| Prinsip inti | Angka dihitung oleh kode deterministik, LLM hanya menulis narasi |
| Aksi eksternal | Selalu menunggu konfirmasi user (human-in-the-loop) |
| Verifikasi kode inti | `code/genome_core.py` sudah dijalankan, golden vectors ada di bagian 11 |

**Penanda status:** `[KEPUTUSAN]` acuan build · `[VERIFIKASI]` harus dicek di versi yang terpasang (Langflow, Bob, Composio) karena antarmukanya bisa berbeda.

---

## 1. High-Level Architecture

```
                         ┌──────────────────────────────────────────────┐
                         │                 PENGGUNA                      │
                         └───────┬───────────────────────────┬──────────┘
                                 │ percakapan                │ interaksi visual
                                 ▼                           ▼
                    ┌─────────────────────┐      ┌──────────────────────────┐
                    │      IBM BOB        │      │  WEB SkillGenome (Next.js)│
                    │  MCP client + rules │      │  13 halaman, what-if lokal│
                    └──────────┬──────────┘      └─────────────┬────────────┘
                               │ MCP (streamable HTTP)         │ REST /api/engine/[tool]
                               │ via mcp-proxy                 │ (server-side, kunci aman)
                               ▼                               ▼
                    ┌────────────────────────────────────────────────────────┐
                    │                LANGFLOW  (MCP server + REST)            │
                    │  Flow 1 start_skill_assessment                          │
                    │  Flow 2 submit_assessment_answers                       │
                    │  Flow 3 recommend_career_path                           │
                    │  Flow 4 generate_skill_passport                         │
                    └──────┬───────────────┬──────────────────┬──────────────┘
                           │               │                  │
                           ▼               ▼                  ▼
                   ┌──────────────┐ ┌─────────────┐   ┌─────────────────────┐
                   │   Astra DB   │ │ Gemini API  │   │      Composio       │
                   │ skills       │ │ LLM +       │   │ Google Docs, Gmail  │
                   │ questions    │ │ embedding   │   │ (OAuth, konfirmasi) │
                   │ job_market   │ └─────────────┘   └─────────────────────┘
                   │ users        │
                   └──────────────┘
```

### 1.1 Alur data utama

| Langkah | Dari | Ke | Data |
|---|---|---|---|
| 1 | User | Bob / Web | Target role, jawaban soal |
| 2 | Bob / Web | Langflow | JSON string di Chat Input |
| 3 | Langflow | Astra DB | Baca soal, baca/tulis profil user |
| 4 | Langflow (kode) | Langflow (LLM) | Angka terstruktur, bukan teks bebas user |
| 5 | Langflow | Composio | Isi dokumen + email (hanya setelah konfirmasi) |
| 6 | Langflow | Bob / Web | JSON hasil, termasuk penjelasan |

### 1.2 Urutan konfigurasi luar ke dalam (materi kelas)

Konfirmasi tiap lapisan sebelum pindah ke lapisan berikutnya agar batas masalah selalu jelas:

1. **Flow dulu:** jalankan input yang diketahui langsung di Langflow Playground, pastikan Chat Output final selesai.
2. **Project selanjutnya:** aktifkan MCP, salin endpoint project yang benar, verifikasi flow yang dimaksud muncul.
3. **Bob terakhir:** tambahkan server di Bob, tinjau tool yang ditemukan, uji satu permintaan eksplisit sebelum variasi alami.

---

## 2. Prinsip Desain

| # | Prinsip | Konsekuensi |
|---|---|---|
| P1 | Satu sumber kebenaran | Semua perhitungan resmi terjadi di Langflow. Web hanya mem-port perhitungan ringan (what-if) |
| P2 | LLM tidak menyentuh angka | Skor dihitung kode. LLM menerima angka sebagai input dan hanya menulis narasi. Respons akhir dirakit kode |
| P3 | Flow stateless | Status disimpan di Astra DB, bukan di memori flow |
| P4 | Kontrak JSON eksplisit | Input dan output setiap tool berupa JSON dengan skema tetap |
| P5 | Kunci jawaban tidak keluar | Field `correct` dan `explanation` tidak pernah dikirim sebelum jawaban dinilai |
| P6 | Aksi eksternal butuh persetujuan | Flow 4 menolak jalan tanpa `confirm=true` |
| P7 | Gagal dengan jelas | Setiap flow mengembalikan `{"error": "kode"}` yang bisa ditampilkan |

---

## 3. Komponen dan Tanggung Jawab

| Komponen | Tanggung jawab | Bukan tanggung jawab |
|---|---|---|
| IBM Bob | Percakapan, memilih tool, menjelaskan hasil, menjaga aturan konfirmasi (via rules) | Menghitung skor |
| Langflow | Menjalankan flow, memanggil DB/LLM/Composio, menghitung algoritma lewat Custom Component | Antarmuka percakapan |
| MCP (mcp-proxy) | Penghubung Bob dan Langflow | Memperbaiki flow yang tidak jelas |
| Astra DB | Menyimpan skills, questions, job_market, users | Logika bisnis |
| Gemini | Narasi penjelasan dan embedding | Skor dan angka |
| Composio | Eksekusi Google Docs dan Gmail | Keputusan mengirim |
| Web Next.js | Visualisasi, what-if lokal, panel Responsible AI | Penyimpanan kunci rahasia di klien |

---

## 4. Kontrak Tool MCP

> `[VERIFIKASI]` Tool dari flow Langflow menerima **satu input teks** (Chat Input). Maka parameter terstruktur dikirim sebagai **JSON string** dan di-parse oleh komponen `ParseRequest`. Cek skema tool yang ditemukan Bob pada langkah uji MCP.

Nama tool berawalan kata kerja dan deskripsi menyebut input yang diharapkan (sesuai materi kelas). Deskripsi memakai bahasa Inggris agar pemilihan tool oleh model lebih konsisten.

| Tool | Tool description (isi di dialog Edit Tools) |
|---|---|
| `start_skill_assessment` | Starts an adaptive skill assessment for a target role (currently data_analyst). Input: JSON string with user_id and target_role. Returns 10 questions as JSON, without answer keys. |
| `submit_assessment_answers` | Scores submitted answers and updates the user's skill genome. Input: JSON string with user_id and answers (question_id and choice index 0-3). Returns theta, per-skill mastery, genome vector, and an explanation. |
| `recommend_career_path` | Creates a 5-step learning path from the user's saved genome. Input: JSON string with user_id and target_role. Returns match percentage, ordered steps with resources, and per-skill priority factors. |
| `generate_skill_passport` | Creates a Skill Passport Google Doc and emails it to the user ONLY after explicit confirmation. Input: JSON string with user_id, email, and confirm=true. Returns the document URL and email status. |

### 4.1 Skema input dan output

```json
// start_skill_assessment — input
{ "user_id": "u_8f3a2c", "target_role": "data_analyst" }

// start_skill_assessment — output
{
  "user_id": "u_8f3a2c",
  "theta0": 0.0,
  "questions": [
    { "id": "q_sql_03", "skill": "SQL", "question": "…", "options": ["…", "…", "…", "…"] }
  ],
  "meta": { "count": 10, "skills_covered": 8 }
}
```

```json
// submit_assessment_answers — input
{ "user_id": "u_8f3a2c",
  "answers": [ { "question_id": "q_sql_03", "choice": 2 } ] }

// submit_assessment_answers — output
{
  "theta": 0.0445,
  "mastery": { "SQL": 0.3997, "Python": 0.2407, "Statistics": 0.2407, "Excel": 0.9383,
               "DataViz": 0.7268, "BusinessAcumen": 0.2407, "Communication": 0.7268,
               "DomainKnowledge": 0.2407 },
  "genome": [0.3997, 0.2407, 0.2407, 0.9383, 0.7268, 0.2407, 0.7268, 0.2407],
  "match": { "cosine": 0.9863, "coverage": 0.5726, "match_pct": 56.5 },
  "explanation": "Narasi singkat dari LLM berdasarkan angka di atas.",
  "limits": ["10 soal", "parameter soal belum dikalibrasi"]
}
```

```json
// recommend_career_path — output
{
  "match_pct": 56.5,
  "steps": [
    { "rank": 1, "skill": "Statistics", "priority": 0.4475, "share_pct": 22.4,
      "why": "Gap terbesar dikali importance tinggi.",
      "resource": { "title": "…", "url": "https://…", "hours": 10 } }
  ],
  "factors": [ { "skill": "Statistics", "mastery": 0.2407, "gap": 0.5593, "importance": 0.8 } ]
}
```

```json
// generate_skill_passport — input
{ "user_id": "u_8f3a2c", "email": "user@example.com", "confirm": true }

// generate_skill_passport — output
{ "passport_id": "p_7k29dx", "doc_url": "https://docs.google.com/document/d/…",
  "email_status": "sent", "verify_url": "https://…/passport/verify/p_7k29dx" }
```

---

## 5. Inti Algoritma (`genome_core.py`)

Modul tanpa dependensi eksternal. Di Langflow, **tempel isinya di atas class Custom Component** karena komponen harus self-contained. Di web, port ke `lib/genome-core.ts` dan cocokkan dengan golden vectors (bagian 11).

```python
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
```

---

## 6. Empat Flow Langflow

Pola umum tiap flow: `Chat Input → ParseRequest → (baca DB) → Custom Component → (tulis DB / LLM / Composio) → AssembleResponse → Chat Output`.

### 6.1 Komponen bersama

| Komponen | Jenis | Fungsi |
|---|---|---|
| ParseRequest | Custom | Mem-parse JSON dari Chat Input, validasi field wajib, mengembalikan `Data` atau `{"error": …}` |
| AssembleResponse | Custom | Menggabungkan angka dari kode dan narasi dari LLM menjadi satu JSON. Angka tidak diambil dari teks LLM |
| Astra DB (Search/Query) | Bawaan | Baca koleksi (filter metadata atau vector search) |
| Astra DB (Write) | Bawaan | Upsert dokumen `users` |
| Language Model | Bawaan | Gemini, model flash yang tersedia di dropdown (kelas memakai `gemini-3.5-flash-lite`) |
| Composio Google Docs / Gmail | Bawaan | Aksi eksternal dengan OAuth2 |

```python
# ParseRequest — kerangka (VERIFIKASI import: pada Langflow baru bisa berasal dari `lfx`)
import json
from langflow.custom import Component
from langflow.io import MessageTextInput, Output
from langflow.schema import Data

REQUIRED = {"start_skill_assessment": ["user_id", "target_role"],
            "submit_assessment_answers": ["user_id", "answers"],
            "recommend_career_path": ["user_id", "target_role"],
            "generate_skill_passport": ["user_id", "email", "confirm"]}

class ParseRequest(Component):
    display_name = "Parse Request (JSON)"
    description = "Parse dan validasi JSON dari Chat Input."
    name = "ParseRequest"
    inputs = [MessageTextInput(name="raw", display_name="Raw input"),
              MessageTextInput(name="tool", display_name="Tool name", value="start_skill_assessment")]
    outputs = [Output(display_name="Parsed", name="parsed", method="parse")]

    def parse(self) -> Data:
        try:
            obj = json.loads(self.raw)
        except Exception:
            return Data(data={"error": "invalid_json"})
        missing = [k for k in REQUIRED[self.tool] if k not in obj]
        if missing:
            return Data(data={"error": "missing_fields", "fields": missing})
        if self.tool == "generate_skill_passport" and obj.get("confirm") is not True:
            return Data(data={"error": "confirmation_required"})
        return Data(data=obj)
```

Helper pembaca output Astra DB (tipe output bisa `Data` list atau DataFrame tergantung versi):

```python
def rows(x):
    if x is None:
        return []
    if hasattr(x, "to_dict") and hasattr(x, "columns"):      # DataFrame
        return x.to_dict(orient="records")
    items = x if isinstance(x, list) else [x]
    return [i.data if hasattr(i, "data") else i for i in items]
```

### 6.2 Flow 1 — `start_skill_assessment`

| # | Node | Konfigurasi | Input → Output |
|---|---|---|---|
| 1 | Chat Input | — | Teks JSON → `Message` |
| 2 | ParseRequest | tool=`start_skill_assessment` | `Message` → `Data{user_id, target_role}` |
| 3 | Astra DB Query (`users`) | filter `_id = user_id` | → `theta` tersimpan (default 0.0 bila belum ada) |
| 4 | Astra DB Query (`questions`) | filter `role = target_role`, limit 200 | → daftar soal beserta `a`, `b`, `skill` |
| 5 | Custom: SelectItems | `select_items(theta, bank, n=10)` | → 10 id soal |
| 6 | Parser / Custom | buang `correct` dan `explanation` | → JSON soal bersih |
| 7 | Chat Output | — | JSON string |

Penanganan error: `target_role` tidak didukung → `{"error": "role_not_supported"}`. Bank soal kurang dari 10 → `{"error": "question_bank_too_small"}`.

> Catatan: Flow ini tidak memakai LLM sehingga cepat dan hemat kuota.

### 6.3 Flow 2 — `submit_assessment_answers`

Perubahan dari spesifikasi awal: ditambah node **Astra DB Query (questions by id)** karena penilaian butuh `correct`, `a`, `b`, dan `skill` tiap soal yang dijawab.

| # | Node | Konfigurasi | Input → Output |
|---|---|---|---|
| 1 | Chat Input | — | Teks JSON |
| 2 | ParseRequest | tool=`submit_assessment_answers` | → `Data{user_id, answers[]}` |
| 3 | Astra DB Query (`questions`) | `_id in answers.question_id` | → baris soal lengkap |
| 4 | Custom: ScoreAnswers | `estimate_theta`, `bkt_replay`, `match_score` | → `Data{theta, mastery, genome, match}` |
| 5 | Astra DB Write (`users`) | upsert: theta, mastery, genome; append `history` (maks. 20) | → status tulis |
| 6 | Prompt Template | hanya angka terstruktur (tanpa teks bebas user) | → prompt |
| 7 | Language Model (Gemini) | suhu rendah (0.2) | → narasi |
| 8 | AssembleResponse | angka dari node 4, narasi dari node 7 | → JSON final |
| 9 | Chat Output | — | JSON string |

```python
# Custom Component: ScoreAnswers (tempel isi genome_core.py di atas file ini)
from langflow.custom import Component
from langflow.io import DataInput, Output
from langflow.schema import Data

class ScoreAnswers(Component):
    display_name = "Score Answers (IRT + BKT)"
    description = "Menilai jawaban, update theta (MAP) dan mastery (BKT), hitung match."
    name = "ScoreAnswers"
    inputs = [DataInput(name="request", display_name="Request"),
              DataInput(name="questions", display_name="Questions", is_list=True)]
    outputs = [Output(display_name="Result", name="result", method="build_result")]

    def build_result(self) -> Data:
        req = self.request.data
        if "error" in req:
            return Data(data=req)
        bank = {q["_id"]: q for q in rows(self.questions)}
        ordered, graded = [], []
        for ans in req["answers"]:
            q = bank.get(ans["question_id"])
            if q is None:
                return Data(data={"error": "unknown_question", "id": ans["question_id"]})
            ok = int(ans["choice"]) == int(q["correct"])
            graded.append({"a": q["discrimination"], "b": q["difficulty"], "correct": ok})
            ordered.append({"skill": q["skill"], "correct": ok})
        theta = estimate_theta(graded)
        mastery = bkt_replay(ordered)
        return Data(data={
            "user_id": req["user_id"],
            "theta": round(theta, 4),
            "mastery": {k: round(v, 4) for k, v in mastery.items()},
            "genome": genome_vector(mastery),
            "match": match_score(mastery),
        })
```

Prompt penjelasan (Node 6), dibatasi agar LLM tidak mengubah angka:

```
Kamu menulis penjelasan singkat (maks. 120 kata, Bahasa Indonesia) untuk hasil asesmen skill.
Gunakan HANYA angka di bawah. Jangan menambah, mengubah, atau membulatkan angka.
Sebut 2 kekuatan dan 2 gap terbesar. Akhiri dengan: "Hasil ini estimasi dari 10 soal dan bukan pengganti konselor karier."
Data: {structured_numbers}
```

### 6.4 Flow 3 — `recommend_career_path`

| # | Node | Konfigurasi | Input → Output |
|---|---|---|---|
| 1 | Chat Input | — | Teks JSON |
| 2 | ParseRequest | tool=`recommend_career_path` | → `Data{user_id, target_role}` |
| 3 | Astra DB Query (`users`) | `_id = user_id` | → mastery tersimpan |
| 4 | Astra DB Query (`job_market`) | `name = target_role` | → bobot importance |
| 5 | Custom: RecommendPath | `match_score`, `greedy_path(k=5)` | → 5 skill prioritas + faktor |
| 6 | Astra DB Vector Search (`skills`) | query = nama skill prioritas, embedding Gemini | → kandidat resource |
| 7 | Custom: AttachResources | pilih resource per skill, urutkan, hitung jam | → langkah lengkap dengan URL dari DB |
| 8 | Prompt Template + Gemini | tulis satu kalimat "mengapa" per langkah, **dilarang menambah URL** | → teks per langkah |
| 9 | AssembleResponse | gabungkan | → JSON final |
| 10 | Chat Output | — | JSON string |

```python
class RecommendPath(Component):
    display_name = "Recommend Path (match + greedy)"
    name = "RecommendPath"
    inputs = [DataInput(name="user", display_name="User doc"),
              DataInput(name="market", display_name="Job market doc")]
    outputs = [Output(display_name="Path", name="path", method="build")]

    def build(self) -> Data:
        u = rows(self.user)
        if not u:
            return Data(data={"error": "genome_not_found"})
        mastery = u[0]["mastery"]
        return Data(data={
            "match": match_score(mastery),
            "steps": greedy_path(mastery, k=5),
        })
```

Aturan resource: URL **hanya** berasal dari koleksi `skills.resources`. LLM tidak boleh menghasilkan atau mengubah URL.

### 6.5 Flow 4 — `generate_skill_passport`

| # | Node | Konfigurasi | Input → Output |
|---|---|---|---|
| 1 | Chat Input | — | Teks JSON |
| 2 | ParseRequest | tool=`generate_skill_passport`, tolak bila `confirm != true`, validasi format email | → `Data` atau error |
| 3 | Astra DB Query (`users`) | `_id = user_id` | → genome, mastery |
| 4 | Custom: BuildPassportText | template deterministik, teks polos, memuat tanggal dan disclaimer | → isi dokumen |
| 5 | Prompt Template + Gemini (opsional) | ringkasan 3 kalimat dari angka | → ringkasan |
| 6 | Composio Google Docs | action **Create A Document** | → `doc_url` |
| 7 | Composio Gmail | action **Send Email**, aktifkan "Requires Approval" bila berfungsi saat dipanggil dari Bob | → status kirim |
| 8 | AssembleResponse | tambah `passport_id` dan `verify_url` | → JSON final |
| 9 | Chat Output | — | JSON string |

Catatan Composio:

| Hal | Tindakan |
|---|---|
| Kolom "Requires Approval" muncul di dialog pemilihan tool | `[VERIFIKASI]` uji apakah benar menahan eksekusi dari Bob. Jika tidak, gantikan Send Email dengan **Create Email Draft** |
| Dokumen dibuat di Drive pemilik akun Composio | Pastikan penerima bisa membuka tautan, atau sertakan ringkasan di badan email |
| Email dikirim dari akun yang terhubung | Untuk demo saja. Produksi memakai layanan email transaksional |
| Kunci API Composio hanya tampil sekali saat dibuat | Simpan di Global Variable `COMPOSIO_API_KEY` |

`passport_id` acak 12 karakter. Halaman publik `/passport/verify/{id}` hanya menampilkan level skill dan tanggal, **tanpa nama dan email** kecuali user memberi izin.

---

## 7. Data Model (Astra DB)

Empat koleksi. Field `$vector` adalah nama field vektor yang dicadangkan Astra DB (di spesifikasi awal disebut `vector`).

> Dimensi 768 `[VERIFIKASI]`: pilih model embedding Gemini yang tersedia di Langflow dan atur dimensi output ke 768. Dimensi koleksi dan model harus sama.

### 7.1 `skills` (vector 768)

```json
{
  "_id": "skill_sql",
  "type": "skill",
  "name": "SQL",
  "description": "Query data relasional: SELECT, JOIN, agregasi, window function.",
  "$vector": ["… 768 float …"],
  "importance_data_analyst": 0.95,
  "emb8": [0.30, 0.70, 0.60, 0.00, 0.10, 0.50, 0.00, 0.90],
  "resources": [ { "title": "Judul sumber", "url": "https://…", "hours": 12 } ]
}
```

### 7.2 `questions`

```json
{
  "_id": "q_sql_03",
  "role": "data_analyst",
  "skill": "SQL",
  "difficulty": -0.5,
  "discrimination": 1.2,
  "question": "Kolom mana yang dipakai untuk menggabungkan dua tabel pada INNER JOIN?",
  "options": ["…", "…", "…", "…"],
  "correct": 2,
  "explanation": "Penjelasan jawaban benar.",
  "calibration": "manual_v1"
}
```

`role` ditambahkan dari spesifikasi awal agar soal bisa difilter per peran. `calibration: manual_v1` menandai bahwa a dan b belum dikalibrasi dari data.

### 7.3 `job_market` (vector 768)

```json
{
  "_id": "role_data_analyst",
  "name": "data_analyst",
  "required_skills": { "SQL": 0.95, "Python": 0.75, "Statistics": 0.80, "Excel": 0.70,
                       "DataViz": 0.80, "BusinessAcumen": 0.65, "Communication": 0.70,
                       "DomainKnowledge": 0.50 },
  "$vector": ["… 768 float …"],
  "salary_range": { "min": null, "max": null, "currency": "USD", "source": "agregasi dataset, hanya baris terisi" },
  "job_count": null,
  "scope": "global_benchmark",
  "source": "kaggle_linkedin_job_postings_2023_2024 (agregat)"
}
```

`required_skills` awalnya heuristik, lalu diganti hasil agregasi frekuensi skill dari dataset lowongan. `salary_range` dan `job_count` diisi dari agregat, bukan klaim tanpa sumber.

### 7.4 `users`

```json
{
  "_id": "u_8f3a2c",
  "alias": null,
  "email": null,
  "target_role": "data_analyst",
  "genome": [0.3997, 0.2407, 0.2407, 0.9383, 0.7268, 0.2407, 0.7268, 0.2407],
  "mastery": { "SQL": 0.3997 },
  "theta": 0.0445,
  "history": [ { "at": "2026-10-11T08:00:00Z", "theta": 0.0445, "match_pct": 56.5 } ],
  "appeals": [ { "skill": "SQL", "note": "…", "status": "reviewed" } ],
  "consent": { "email_send": false, "public_passport": false },
  "passport": { "id": null, "issued_at": null },
  "created_at": "2026-10-11T08:00:00Z"
}
```

| Field | Wajib | Catatan privasi |
|---|---|---|
| `_id` | Ya | Pseudonim acak, bukan nama atau email |
| `alias` | Tidak | Hanya tampilan, tidak masuk model |
| `email` | Tidak | Diisi hanya saat user ingin Passport, hapus bila dicabut |
| `history` | Ya | Dibatasi 20 entri terakhir |
| `consent` | Ya | Default `false` untuk semua izin |
| Gender, kampus | Tidak disimpan di koleksi ini | Jika dikumpulkan untuk uji fairness, simpan di koleksi terpisah dan agregat |

---

## 8. Konfigurasi MCP

### 8.1 Sisi Langflow

1. Pastikan keempat flow lolos di Playground (lihat bagian 11).
2. Buat project `skillgenome` dan masukkan keempat flow.
3. Pada tab **MCP Server**: buka **Edit Tools**, isi **Tool name** dan **Tool description** sesuai bagian 4.
4. Pilih tab **JSON**, klik **Generate API key**, lalu salin konfigurasi.
5. Pengguna Windows tetap menyalin konfigurasi dari opsi **macOS/Linux**.

### 8.2 Sisi Bob (`.bob/mcp.json`)

Tambahkan `"--with", "mcp<2.0.0"` pada `args` (sesuai materi kelas).

```json
{
  "mcpServers": {
    "lf-skillgenome": {
      "command": "uvx",
      "args": [
        "--with",
        "mcp<2.0.0",
        "mcp-proxy",
        "--transport",
        "streamablehttp",
        "--headers",
        "x-api-key",
        "YOUR_LANGFLOW_API_KEY",
        "http://localhost:7861/api/v1/mcp/project/<PROJECT_ID>/streamable"
      ]
    }
  }
}
```

Lalu **Bob Settings → MCP**: pastikan status server `Connected`, tinjau tool yang ditemukan, uji **satu permintaan eksplisit** ("Panggil start_skill_assessment untuk user_id demo01, target_role data_analyst") sebelum percakapan alami.

### 8.3 Aturan percakapan Bob (`.bob/rules/skillgenome.md`)

Logika percakapan hidup di Bob, logika workflow hidup di Langflow. `[VERIFIKASI]` lokasi file rules pada Bob 2.0.3.

```markdown
# SkillGenome — aturan percakapan
Bahasa: Indonesia, ramah, ringkas. Gunakan hanya tool dari server lf-skillgenome.

1. Mulai dengan menanyakan target role (saat ini hanya data_analyst) dan alias/user_id.
2. Panggil start_skill_assessment. Tampilkan soal SATU per satu. Jangan membocorkan kunci jawaban.
3. Setelah 10 jawaban terkumpul, panggil submit_assessment_answers satu kali.
4. Jelaskan hasil hanya dari data tool. Jangan mengubah angka. Sebut keterbatasan: 10 soal, parameter belum dikalibrasi.
5. Panggil recommend_career_path jika user meminta saran belajar.
6. JANGAN memanggil generate_skill_passport sebelum user menyebut email dan menjawab "ya" pada konfirmasi eksplisit.
7. Jangan mengarang sumber belajar atau URL. Gunakan hanya yang dikembalikan tool.
8. Jangan meminta data di luar kebutuhan (nama lengkap, gender, kampus tidak diperlukan).
9. Jika tool error: jelaskan singkat dan sarankan ulang. Jangan menebak hasil.
10. Akhiri dengan disclaimer: bukan pengganti konselor karier profesional.
```

### 8.4 Pengelolaan rahasia

```gitignore
# .gitignore
.bob/mcp.json
.env*
*.local
```

| Berkas | Di repo? | Isi |
|---|---|---|
| `.bob/mcp.json` | Tidak | Kunci Langflow asli |
| `bob/mcp-config.example.json` | Ya | Placeholder `YOUR_LANGFLOW_API_KEY` |
| `.env.local` | Tidak | `LANGFLOW_API_KEY`, `ASTRA_DB_TOKEN`, `COMPOSIO_API_KEY`, `GEMINI_API_KEY` |
| `.env.example` | Ya | Nama variabel tanpa nilai |

Sensor kunci pada semua screenshot untuk deck dan dokumen.

---

## 9. Integrasi Web dan Topologi Deploy

### 9.1 Masalah topologi

Langflow Web yang dipasang lokal berjalan di `localhost:7861`. **Aplikasi di Vercel tidak bisa menjangkau localhost.** Reviewer hackathon membutuhkan tautan yang dapat diakses, jadi demo tidak boleh bergantung pada mesin lokal.

| Opsi | Cara | Kelebihan | Kekurangan | Pakai untuk |
|---|---|---|---|---|
| A. Mode lokal di server Next.js | `ENGINE_MODE=local`, algoritma yang sama dalam TypeScript, bank soal dari JSON seed | Selalu hidup, tanpa kuota | Tidak memanggil Langflow | **Tautan reviewer (default)** |
| B. Tunnel ke Langflow lokal | `ENGINE_MODE=langflow`, `LANGFLOW_BASE_URL` ke URL tunnel | Memakai engine asli | Sementara dan rapuh | Rekaman demo |
| C. Langflow di server sendiri | Docker di VPS | Stabil | Setup lebih lama | Pasca hackathon |

`[KEPUTUSAN]` Gunakan A untuk tautan reviewer dan B untuk merekam demo. Jalur Bob didemonstrasikan lewat video dan screenshot karena Bob berjalan di IDE lokal. Keterbukaan wajib: dokumen teknis menyebut bahwa mode A memakai implementasi yang sama dan flow Langflow diekspor ke `langflow/*.json` agar reviewer dapat mengimpornya.

### 9.2 Route handler

```ts
// app/api/engine/[tool]/route.ts
import { NextResponse } from "next/server";

const TOOLS = ["start_skill_assessment", "submit_assessment_answers",
               "recommend_career_path", "generate_skill_passport"] as const;
type Tool = (typeof TOOLS)[number];

export async function POST(req: Request, { params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  if (!TOOLS.includes(tool as Tool)) {
    return NextResponse.json({ error: "unknown_tool" }, { status: 404 });
  }
  const body = await req.json();            // validasi dengan zod di sini

  if (process.env.ENGINE_MODE === "langflow") {
    const flowId = process.env[`FLOW_ID_${tool.toUpperCase()}`];
    const res = await fetch(`${process.env.LANGFLOW_BASE_URL}/api/v1/run/${flowId}?stream=false`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.LANGFLOW_API_KEY! },
      body: JSON.stringify({ input_value: JSON.stringify(body), input_type: "chat", output_type: "chat" }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return NextResponse.json({ error: "engine_unavailable" }, { status: 502 });
    return NextResponse.json(JSON.parse(extractText(await res.json())));
  }
  return NextResponse.json(await runLocal(tool as Tool, body));   // lib/engine-local.ts
}

// `[VERIFIKASI]` bentuk payload dicek di Langflow: tab API pada flow
function extractText(payload: any): string {
  const t = payload?.outputs?.[0]?.outputs?.[0]?.results?.message?.text ?? "";
  if (!t) throw new Error("empty_engine_output");
  return t;
}
```

### 9.3 Kontrak yang menjaga paritas

| Kontrak | Cara menjaga |
|---|---|
| Hasil Python dan TypeScript sama | Uji unit memakai golden vectors (bagian 11) |
| Skema JSON sama di semua jalur | Skema zod bersama, dipakai di route handler dan di uji kontrak |
| Soal sama di semua jalur | Satu berkas `data/questions.json` menjadi sumber seed Astra DB dan mode lokal |

---

## 10. Security dan Privacy

### 10.1 Klasifikasi data

| Data | Sensitivitas | Penyimpanan | Retensi |
|---|---|---|---|
| `user_id` pseudonim | Rendah | Astra DB | Sampai dihapus user |
| Jawaban dan mastery | Sedang | Astra DB | Sampai dihapus user |
| Email | Sedang | Astra DB (opsional) | Dihapus saat izin dicabut |
| Alias tampilan | Rendah | Astra DB (opsional) | Sampai dihapus |
| Kunci API | Kritis | Variabel lingkungan, Global Variable Langflow | Rotasi bila bocor |

### 10.2 Ancaman dan kontrol

| Ancaman | Kontrol |
|---|---|
| Kebocoran kunci di repo atau screenshot | `.gitignore`, file contoh berisi placeholder, sensor screenshot |
| Kunci di bundle klien | Semua panggilan engine lewat route handler server |
| Penyalahgunaan endpoint (spam asesmen, email) | Rate limit per IP dan per `user_id`, `confirm=true` untuk Flow 4, batas 3 Passport per hari |
| Prompt injection lewat alias atau teks bebas | LLM hanya menerima angka terstruktur, alias disanitasi dan tidak masuk prompt |
| Kunci jawaban bocor | Flow 1 membuang `correct` dan `explanation` |
| Email ke pihak ketiga tanpa izin | Hanya ke alamat yang dikonfirmasi user, `consent.email_send` wajib `true` |
| Akses data user lain | `user_id` acak sulit ditebak, endpoint hapus dan ekspor memverifikasi kepemilikan sesi |
| Data pribadi di log | Tidak mencatat email dan alias, log hanya `user_id` dan kode error |

### 10.3 Hak pengguna

| Hak | Implementasi |
|---|---|
| Lihat penjelasan | Faktor kontribusi per skor |
| Banding | `appeals[]` pada dokumen user |
| Ekspor | `GET /api/me/export` mengembalikan JSON dokumen user |
| Hapus | `DELETE /api/me` menghapus dokumen user dan menonaktifkan Passport publik |

### 10.4 Pengujian fairness

| Uji | Metode | Lolos bila |
|---|---|---|
| Invarians metadata | 20 profil jawaban dijalankan dengan variasi nama, gender, kampus | Seluruh keluaran identik |
| Bahasa dan akses | Jalankan asesmen dengan UI bahasa Indonesia dan Inggris, mode tanpa timer | Skor identik untuk jawaban identik |
| Dokumentasi batas | Disclaimer tampil pada hasil dan Passport | Terlihat tanpa interaksi tambahan |

---

## 11. Pengujian dan Verifikasi

### 11.1 Lapisan uji (luar ke dalam)

| Lapisan | Alat | Bukti |
|---|---|---|
| Unit algoritma | `python code/genome_core.py` dan uji TypeScript | Golden vectors cocok |
| Flow | Langflow Playground dengan input tetap | Chat Output final sesuai skema |
| MCP | Bob, satu permintaan eksplisit per tool | Tool muncul dan terpanggil |
| End-to-end | Web dan Bob | Skenario demo selesai |
| Fairness | Skrip invarians | Selisih = 0 |

### 11.2 Golden vectors (hasil eksekusi `genome_core.py`)

| Uji | Hasil |
|---|---|
| `irt_p(1.0, 1.2, 0.5)` | 0.645656 |
| `fisher_info(0, 1.0, 0)` | 0.25 |
| BKT dari 0.30, urutan [benar, benar, salah] | 0.726829, 0.938334, 0.724334 |
| θ MAP, 10 respons demo | 0.0445 |
| Mastery demo | SQL 0.3997, Python 0.2407, Statistics 0.2407, Excel 0.9383, DataViz 0.7268, BusinessAcumen 0.2407, Communication 0.7268, DomainKnowledge 0.2407 |
| `match_score` demo | cosine 0.9863, coverage 0.5726, match 56.5 |
| Urutan `greedy_path` demo | Statistics (22.4%), Python (21.0%), SQL (19.0%), BusinessAcumen (18.2%), DomainKnowledge (14.0%) |
| `what_if(["SQL", "Statistics"])` | 56.5 → 74.8 (+18.3) |

Sepuluh respons demo dan seluruh asersi ada di blok `__main__` pada `code/genome_core.py`.

### 11.3 Temuan desain dari pengujian

| Temuan | Tindakan |
|---|---|
| Cosine 0.986 pada profil dengan coverage 0.57 | Match diubah menjadi coverage × cosine |
| Semua jawaban benar membuat θ MLE tak terhingga | Estimasi MAP dengan prior Normal(0, 1), θ dibatasi ±4 |

---

## 12. Target Performa

| Metrik | Target | Catatan |
|---|---|---|
| Flow 1 (tanpa LLM) | P50 < 3 detik | Query DB dan seleksi soal |
| Flow 2 (LLM penjelasan) | P50 < 8 detik | Satu panggilan LLM |
| Flow 3 (vector search + LLM) | P50 < 8 detik | Satu pencarian + satu panggilan LLM |
| Flow 4 (Docs + Gmail) | < 30 detik | Contoh kelas: 4 aksi tool sekitar 33 detik |
| Mode lokal (web) | P50 < 300 ms | Tanpa jaringan eksternal |
| What-if di browser | < 50 ms | Perhitungan murni di klien |
| LCP halaman landing | < 2,5 detik | 3D di-lazy-load |
| Bundle awal | < 250 KB gzip (tanpa 3D) | Three.js dimuat dinamis |

---

## 13. Keputusan Teknis

| # | Keputusan | Alasan | Alternatif yang ditolak |
|---|---|---|---|
| D1 | Satu engine Langflow, dua klien | Logika tidak terduplikasi | Logika terpisah di web dan Bob |
| D2 | Input tool berupa JSON string | Tool flow menerima satu input teks | Banyak parameter terpisah |
| D3 | Angka tidak melewati LLM | Mencegah halusinasi angka | LLM menghitung dan menjelaskan sekaligus |
| D4 | θ dengan MAP | Stabil pada jawaban ekstrem | MLE murni |
| D5 | match = coverage × cosine | Cosine saja tidak peka level | Rata-rata cosine dan coverage |
| D6 | Mode lokal untuk tautan reviewer | Vercel tidak bisa ke localhost | Menyajikan demo yang bergantung pada laptop |
| D7 | Flow 4 butuh `confirm=true` | Aksi eksternal harus disetujui user | Kirim otomatis |
| D8 | `user_id` pseudonim | Minimalisasi data | Login dengan email |
| D9 | URL resource hanya dari DB | Mencegah tautan karangan LLM | LLM menyarankan sumber |
| D10 | Soal dan bobot dari satu berkas seed | Paritas jalur Langflow dan lokal | Data berbeda per jalur |

---

## 14. Batasan yang Diketahui

| Batasan | Dampak | Rencana |
|---|---|---|
| Parameter soal dan BKT belum dikalibrasi | Presisi terbatas | Kalibrasi pasca pilot |
| Matriks embedding kurasi manual | Bukan model terlatih | Turunkan dari O*NET secara komputasional |
| θ tunggal lintas skill | Kurang halus | θ per skill |
| Data pasar bersifat global | Kurang kontekstual untuk Indonesia | Tambah sumber lokal |
| Asesmen batch 10 soal | Adaptivitas antar soal terbatas | Mode `next` per soal pada versi berikutnya |
| Kontrak input tool dan API Custom Component | Bergantung versi Langflow | Uji di versi terpasang sejak Sprint 3 |