# Task — SkillGenome

> **Dokumen:** Task Breakdown · **Versi:** 1.0 · **Tanggal:** 11 Oktober 2026
> **Terkait:** [PRD.md](./PRD.md) · [Architecture.md](./Architecture.md) · [Design.md](./Design.md)
> **Deadline:** 11 Oktober 2026, 23:00 WIB · **Target submit internal:** 21:00 WIB

| Item | Isi |
|---|---|
| Total estimasi | ~16 jam kerja efektif |
| Critical path | Sprint 0 → 1 → 2 → 3 → 8 → 9 |
| Aturan | Tier 1 wajib selesai. Tier 2–3 boleh statis dengan label "contoh data" |
| Bukti tiap sprint | Screenshot + golden vector check |

**Penanda:** `[WAJIB]` tidak boleh dipangkas · `[PANGKAS]` boleh disederhanakan bila waktu mepet · `[BUKTI]` artefak untuk submission.

---

## Sprint 0 — Setup (30 menit) ✅ DONE

- [x] `npx create-next-app@latest skillgenome` (recommended defaults, Next.js 16.4.0)
- [x] Install dependencies: framer-motion, recharts, three, @react-three/fiber, @react-three/drei, lucide-react, canvas-confetti, zustand, clsx, tailwind-merge
- [x] Install dev deps: @types/three, @types/canvas-confetti
- [x] `npx shadcn@latest init` (Base UI, preset Nova)
- [x] Install shadcn components: card, input, badge, progress, slider, tabs, dialog, avatar, select, separator, skeleton, tooltip
- [x] Struktur folder: `lib/algorithms`, `lib/data`, `components/genome`, `components/quiz`, `components/layout`, `docs`, `public/avatars`, `langflow`
- [x] `.env.local` dengan API keys
- [x] Cek `.gitignore` include `.env.local`
- [x] `npm run dev` jalan tanpa error
- [x] 4 docs di folder `docs/`
- [x] `genome_core.py` di folder `langflow/`
- [x] `python genome_core.py` → output "OK" + golden vectors match

---

## Sprint 1 — Data & Algorithm Foundation (1.5 jam) `[WAJIB]`

### Data files
- [ ] `lib/data/questions.json` — 32 soal minimum (4 per skill × 8 skill)
  - Field: `id`, `role`, `skill`, `difficulty` (-3 to +3), `discrimination` (0.5-2.0), `question`, `options[4]`, `correct` (0-3), `explanation`, `calibration: "manual_v1"`
  - Distribution: SQL (4), Python (4), Statistics (4), Excel (4), DataViz (4), BusinessAcumen (4), Communication (4), DomainKnowledge (4)
- [ ] `lib/data/skills.json` — 8 skill
  - Field: `_id`, `name`, `description`, `emb8` (8-dim dari SKILL_EMB), `importance_data_analyst`, `resources[{title,url,hours}]`
- [ ] `lib/data/job_market.json` — 5 role
  - Field: `_id`, `name`, `required_skills{}`, `salary_range{}`, `job_count`, `scope: "global_benchmark"`, `source`
- [ ] `lib/data/galaxy-layout.json` — koordinat 3D dari PCA (dari Design.md section 6.3)

### TypeScript algorithms (`[WAJIB]` port dari genome_core.py)
- [ ] `lib/genome-core.ts` — port semua fungsi Python:
  - `irtP(theta, a, b)`, `fisherInfo(theta, a, b)`
  - `estimateTheta(responses, prior)`, `selectItems(theta, bank, n)`
  - `bktUpdate(pL, correct, params)`, `bktReplay(responses)`
  - `genomeVector(mastery)`, `latent(vec)`, `cosine(u, v)`
  - `roleRequirement(role)`, `coverage(mastery, role)`, `matchScore(mastery, role)`
  - `greedyPath(mastery, role, k)`, `whatIf(mastery, completed, role)`
- [ ] `lib/genome-core.test.ts` — unit test dengan golden vectors
  - `irtP(1.0, 1.2, 0.5)` === 0.645656 (±1e-6)
  - BKT `[T,T,F]` dari 0.30 === [0.726829, 0.938334, 0.724334]
  - `matchScore(masteryDemo).match_pct` === 56.5
  - `whatIf(masteryDemo, ["SQL","Statistics"]).delta` === 18.3

### Types & Schemas
- [ ] `lib/schemas.ts` — zod schema untuk semua kontrak JSON (Question, Skill, JobRole, User, FlowRequest, FlowResponse)
- [ ] `lib/types.ts` — TypeScript types inferred dari zod

### `[BUKTI]` Sprint 1
- [ ] Screenshot `pnpm test` atau `npm test` menunjukkan semua golden vectors pass
- [ ] Screenshot struktur folder `lib/`

---

## Sprint 2 — Core UI Foundation (2.5 jam) `[WAJIB]`

### Global layout
- [ ] `app/globals.css` — Tailwind v4 @theme dengan token dari Design.md section 2.3
- [ ] `app/layout.tsx` — fonts (Space Grotesk, Inter, JetBrains Mono via next/font)
- [ ] `components/layout/Navbar.tsx` — top bar (≥1024px) + bottom tab (<1024px)
- [ ] `components/layout/Footer.tsx`
- [ ] `lib/motion.ts` — ease, stagger, rise, press (dari Design.md section 2.6)

### Landing `/` `[WAJIB]`
- [ ] `app/page.tsx` — hero, subjudul, CTA, cara kerja 3 langkah, contoh radar, responsible AI singkat, harga, footer
- [ ] `components/DNAHelix.tsx` — R3F helix (procedural, lightweight)
- [ ] Fallback: SVG statis bila WebGL gagal atau `prefers-reduced-motion`

### Onboarding `/onboarding` `[WAJIB]`
- [ ] `app/onboarding/page.tsx` — wizard 3 langkah
- [ ] Step 1: Role picker (Data Analyst aktif, lainnya "segera hadir")
- [ ] Step 2: Persepsi kesiapan 1-5 + alias opsional
- [ ] Step 3: Izin + preferensi (data, timer, bahasa)
- [ ] `components/onboarding/Stepper.tsx`, `RoleCard.tsx`, `ConsentRow.tsx`
- [ ] Store: `store/prefs.ts` (Zustand + persist)

### Quiz `/assessment` `[WAJIB]`
- [ ] `app/assessment/page.tsx` — 1 soal per layar
- [ ] `components/quiz/QuizShell.tsx`, `QuestionOption.tsx`
- [ ] Store: `store/assessment.ts` (jawaban, index, timer, localStorage persist)
- [ ] Keyboard: 1-4 pilih, Enter jawab
- [ ] Timer default OFF
- [ ] Bob floating avatar (placeholder)

### Quiz Review `/assessment/review`
- [ ] `app/assessment/review/page.tsx` — accordion per soal
- [ ] Filter: semua/salah/skill

### Shared components
- [ ] `components/ui/Metric.tsx`, `ScoreBar.tsx`, `SkillChip.tsx`, `ExplainPopover.tsx`

### `[BUKTI]` Sprint 2
- [ ] Screenshot Landing (desktop + mobile)
- [ ] Screenshot Quiz 1 soal
- [ ] Video 15 detik onboarding → quiz

---

## Sprint 3 — Genome Dashboard ⭐ (2 jam) `[WAJIB]`

- [ ] `app/genome/page.tsx` — dashboard utama
- [ ] `components/genome/RadarGenome.tsx` — Recharts radar 8 axis + tabel tersembunyi (a11y)
- [ ] `components/genome/GenomeGalaxy.tsx` — R3F galaxy dari galaxy-layout.json (dynamic import, ≥1024px)
- [ ] `components/genome/SkillList.tsx` — daftar skill prioritas dengan ScoreBar + "Kenapa skor ini?"
- [ ] `components/genome/StatCard.tsx` — match%, θ, persepsi vs hasil (count-up 500ms)
- [ ] Toggle Radar ↔ Galaxy di mobile
- [ ] Hover/focus skill → highlight radar + galaxy
- [ ] `app/genome/[skill]/page.tsx` — detail skill + history line chart
- [ ] Store: `store/genome.ts`

### `[BUKTI]` Sprint 3
- [ ] Screenshot radar (light + full)
- [ ] Screenshot galaxy 3D
- [ ] Screenshot skill detail dengan history chart
- [ ] **Ini yang bikin juri "wow" — polish penuh**

---

## Sprint 4 — Roadmap & Jobs (2 jam) `[WAJIB]`

### Roadmap `/roadmap`
- [ ] `app/roadmap/page.tsx`
- [ ] `components/roadmap/RoadmapTimeline.tsx` — 5 langkah bernomor + checkbox
- [ ] `components/roadmap/WhatIfPanel.tsx` — sticky, pakai genome-core.ts (client-side <50ms)
- [ ] `components/roadmap/StepCard.tsx` — skill, alasan, share%, resource, checkbox
- [ ] `aria-live="polite"` untuk perubahan match%
- [ ] Tombol "Setel ulang simulasi"

### Jobs `/jobs`
- [ ] `app/jobs/page.tsx` — hanya Data Analyst aktif
- [ ] `components/jobs/RoleCard.tsx` — match%, salary (dengan label sumber), skill bars
- [ ] Label "benchmark global" untuk data pasar

### `[BUKTI]` Sprint 4
- [ ] Screenshot roadmap + what-if panel
- [ ] Screenshot job matcher
- [ ] Video what-if (56.5% → 74.8%)

---

## Sprint 5 — Passport & Progress (1.5 jam) `[WAJIB]`

### Passport `/passport` ⭐
- [ ] `app/passport/page.tsx` — draft → konfirmasi → membuat → selesai
- [ ] `components/passport/PassportCard.tsx` — hologram border, radar mini, QR
- [ ] `components/passport/ConfirmDialog.tsx` — nyatakan jelas: doc apa, email ke siapa, apa yang publik
- [ ] Form: email + checkbox izin (default OFF)
- [ ] Progress nyata: "Membuat dokumen" → "Mengirim email"
- [ ] Confetti 1x setelah berhasil (matikan saat reduced motion)
- [ ] Error per langkah: "Dokumen dibuat, email gagal. Coba kirim ulang."

### Progress `/progress`
- [ ] `app/progress/page.tsx`
- [ ] `components/progress/ActivityHeatmap.tsx` — grid 7x12 minggu, 5 level
- [ ] `components/progress/StreakCounter.tsx`
- [ ] Ringkasan teks "12 hari aktif dalam 8 minggu" untuk a11y
- [ ] Line chart match% antar asesmen

### Public verify `/passport/verify/[id]`
- [ ] Halaman minimal: level skill + tanggal, tanpa nama/email

### `[BUKTI]` Sprint 5
- [ ] Screenshot passport card
- [ ] Screenshot dialog konfirmasi
- [ ] Screenshot progress heatmap

---

## Sprint 6 — Tier 3 & Settings (1 jam) `[PANGKAS]`

- [ ] `app/community/page.tsx` — leaderboard anonim (label "contoh data")
- [ ] `app/insights/page.tsx` — grid artikel (label "Dibuat AI" + sumber)
- [ ] `app/settings/page.tsx`:
  - Profil: alias, bahasa
  - Aksesibilitas: tanpa timer, kurangi animasi, matikan 3D
  - **Responsible AI Panel**: cara kerja, hasil uji bias, banding, ekspor/hapus data
  - Data: Ekspor JSON + Hapus data (dialog konfirmasi)

---

## Sprint 7 — API Routes & Local Engine (1 jam) `[WAJIB]`

- [ ] `app/api/engine/[tool]/route.ts` — 4 endpoint (start/submit/recommend/passport)
- [ ] `lib/engine-local.ts` — implementasi lokal pakai genome-core.ts (untuk Vercel)
- [ ] `app/api/me/route.ts` — GET (export) + DELETE (hapus)
- [ ] `app/api/me/export/route.ts` — GET JSON
- [ ] Mode switch: `ENGINE_MODE=local` (default Vercel) | `langflow` (tunnel)
- [ ] Zod validation di semua route

---

## Sprint 8 — Langflow Flows (3 jam) `[WAJIB]`

### Setup
- [ ] Buka Langflow → project `skillgenome`
- [ ] Settings → Global Variables: `ASTRA_TOKEN`, `COMPOSIO_API_KEY`, `GEMINI_API_KEY`
- [ ] Settings → Model Providers: Gemini API key
- [ ] Seed Astra DB: import `skills.json`, `questions.json`, `job_market.json`
  - Collection `skills` (vector 768)
  - Collection `questions`
  - Collection `job_market` (vector 768)

### Flow 1 — `start_skill_assessment`
- [ ] Chat Input
- [ ] Custom Component: ParseRequest (validate JSON)
- [ ] Astra DB Query (`users`) — ambil θ
- [ ] Astra DB Query (`questions`) — filter role
- [ ] Custom Component: SelectItems (tempel genome_core.py di atas)
- [ ] Parser: buang `correct` & `explanation`
- [ ] Chat Output (JSON)
- [ ] Test: `{"user_id":"u_demo01","target_role":"data_analyst"}` → 10 soal

### Flow 2 — `submit_assessment_answers`
- [ ] Chat Input
- [ ] Custom Component: ParseRequest
- [ ] Astra DB Query (`questions`) — by id
- [ ] Custom Component: ScoreAnswers (BKT + IRT + match)
- [ ] Astra DB Write (`users`) — upsert genome, θ, mastery, append history (max 20)
- [ ] Prompt Template + Gemini (suhu 0.2) — narasi dari angka
- [ ] Custom Component: AssembleResponse — angka dari kode, narasi dari LLM
- [ ] Chat Output (JSON)
- [ ] Test: kirim 10 jawaban → verifikasi θ, mastery, genome

### Flow 3 — `recommend_career_path`
- [ ] Chat Input
- [ ] Custom Component: ParseRequest
- [ ] Astra DB Query (`users`) — mastery
- [ ] Astra DB Query (`job_market`) — required_skills
- [ ] Custom Component: RecommendPath (matchScore + greedyPath)
- [ ] Astra DB Vector Search (`skills`) — ambil resources
- [ ] Custom Component: AttachResources
- [ ] Prompt Template + Gemini — 1 kalimat "why" per step, **dilarang tambah URL**
- [ ] Chat Output (JSON)

### Flow 4 — `generate_skill_passport`
- [ ] Chat Input
- [ ] Custom Component: ParseRequest — **tolak bila `confirm != true`**, validasi email
- [ ] Astra DB Query (`users`) — genome, mastery
- [ ] Custom Component: BuildPassportText — deterministik, teks polos
- [ ] Prompt Template + Gemini (opsional) — ringkasan 3 kalimat
- [ ] Composio Google Docs — Create A Document
- [ ] Composio Gmail — Send Email (atau Draft bila approval bermasalah)
- [ ] Custom Component: AssembleResponse — tambah `passport_id` + `verify_url`
- [ ] Chat Output (JSON)

### `[BUKTI]` Sprint 8
- [ ] Screenshot tiap flow di Playground
- [ ] Screenshot output Flow 1 (10 soal)
- [ ] Screenshot output Flow 2 (genome + θ + match)
- [ ] Screenshot output Flow 3 (5 langkah roadmap)
- [ ] Screenshot output Flow 4 (doc_url + email_status)
- [ ] **Zip flow JSON** ke `langflow/flows/` untuk reviewer

---

## Sprint 9 — Bob + MCP Integration (1 jam) `[WAJIB]`

- [ ] Langflow → MCP Server tab → Edit Tools
  - Isi Tool name & description sesuai Architecture.md section 4
- [ ] Langflow → MCP Server → JSON → **Generate API Key** → copy config
- [ ] Buat `bob/mcp.json` (Windows: copy dari opsi macOS/Linux)
- [ ] **PENTING:** Tambahkan di `args`: `"--with", "mcp<2.0.0"`
- [ ] Bob → Settings → MCP → klik `+` → paste config
- [ ] Verify: 4 tools muncul status `Connected`
- [ ] Test satu per satu **eksplisit**:
  - [ ] "Panggil start_skill_assessment untuk user_id demo01, target_role data_analyst"
  - [ ] "Panggil submit_assessment_answers dengan user_id demo01 dan answers [q_sql_01:2, ...]"
  - [ ] "Panggil recommend_career_path untuk user_id demo01"
  - [ ] "Panggil generate_skill_passport user_id demo01, email demo@example.com, confirm=true"
- [ ] Buat `bob/rules/skillgenome.md` (10 aturan dari Architecture.md section 8.3)
- [ ] Test percakapan alami: "Aku mau jadi Data Analyst, mulai dari mana?"

### `[BUKTI]` Sprint 9
- [ ] Screenshot Bob Settings → MCP (4 tools Connected)
- [ ] Screenshot Bob eksekusi satu tool
- [ ] Screenshot percakapan natural (minimal 5 turn)
- [ ] Screenshot hasil akhir (genome + roadmap)

---

## Sprint 10 — Polish & Demo (1.5 jam) `[WAJIB]`

### Polish
- [ ] Loading skeletons semua Tier 1
- [ ] Empty states (genome kosong, roadmap kosong)
- [ ] Error boundaries
- [ ] Toast (sonner)
- [ ] Mobile responsive test (360px, 375px, 768px)
- [ ] A11y: keyboard nav semua Tier 1, focus ring, aria-live
- [ ] Lighthouse: Performance >85, A11y >90
- [ ] Sensor API keys di screenshot (Figma/Photoshop blur)

### Demo prep
- [ ] Rekam video 3 menit:
  - 0:00-0:30 Problem (persona Andi)
  - 0:30-1:00 Solution (SkillGenome)
  - 1:00-2:00 Demo live (Landing → Quiz → Genome → Roadmap → Passport)
  - 2:00-2:30 Tech (Bob + Langflow, tunjukkan MCP call)
  - 2:30-3:00 Impact + Monetization + Responsible AI
- [ ] Screenshot untuk submission:
  - [ ] Landing desktop
  - [ ] Quiz
  - [ ] Genome radar
  - [ ] Genome galaxy 3D
  - [ ] Roadmap + what-if
  - [ ] Passport
  - [ ] Bob MCP config (Connected)
  - [ ] Bob eksekusi tool
  - [ ] Langflow 4 flows
  - [ ] Settings → Responsible AI panel

---

## Sprint 11 — Submission (1 jam) `[WAJIB]`

- [ ] **Bagian 1:** Info Tim (nama, anggota, sertifikat IBM SkillsBuild University Education 2026)
- [ ] **Bagian 2:** Project Overview
  - [ ] Judul: SkillGenome — Your skill DNA, decoded
  - [ ] Tema: Education & Future of Work
  - [ ] Deskripsi (3 kalimat)
  - [ ] Problem statement
  - [ ] Target user + persona
  - [ ] Fitur utama (5-7)
- [ ] **Bagian 3:** Bukti Teknis
  - [ ] Penjelasan penggunaan IBM Bob + Langflow + cara integrasi (MCP)
  - [ ] Screenshot flows + MCP config + eksekusi
  - [ ] Link repo GitHub (public) + link Vercel
  - [ ] Zip flow JSON (`langflow/flows/*.json`)
- [ ] **Bagian 4:** Pitching Deck (5-7 slide)
  - [ ] Slide 1: Problem + user
  - [ ] Slide 2: Solution + demo screenshot
  - [ ] Slide 3: AI Agent architecture (Bob + Langflow + MCP)
  - [ ] Slide 4: Algorithms (IRT, BKT, cosine)
  - [ ] Slide 5: Impact + metrics
  - [ ] Slide 6: Monetization
  - [ ] Slide 7: Responsible AI + limitations
- [ ] **Bagian 5:** Pernyataan Akhir
  - [ ] Centang orisinalitas
  - [ ] Centang kebenaran data
- [ ] Test semua link dapat diakses reviewer (buka di incognito)
- [ ] **Submit sebelum 11 Okt 23:00 WIB** (target internal 21:00)

---
