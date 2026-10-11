# PRD — SkillGenome

> **Tagline:** "Your skill DNA, decoded."
> **Dokumen:** Product Requirements Document · **Versi:** 1.0 · **Tanggal:** 10 Oktober 2026 · **Status:** Draft untuk review sebelum build

| Item | Isi |
|---|---|
| Event | IBM SkillsBuild University Education National Hackathon 2026 (Hacktiv8 x IBM) |
| Tahap | Stage 1 — Preliminary (project submission) |
| Deadline | 11 Oktober 2026, 23:00 WIB (target submit internal: 21:00 WIB) |
| Format | Individu (aturan hackathon: individu atau maksimal 2 orang) |
| Tema | Education & Future of Work |
| Syarat teknis | Project wajib mengintegrasikan **IBM Bob** dan **Langflow** (via MCP) |
| Dokumen turunan | [Architecture.md](./Architecture.md) · [Design.md](./Design.md) · [Task.md](./Task.md) |

**Konvensi penanda status** (supaya fakta terpisah dari asumsi):

| Penanda | Arti |
|---|---|
| `[KEPUTUSAN]` | Sudah diputuskan, menjadi acuan build |
| `[HIPOTESIS]` | Asumsi yang harus divalidasi (wawancara, pilot, pengukuran) |
| `[PERLU SUMBER]` | Klaim angka yang belum punya sumber; ganti dengan data atau hapus dari deck |

---

## 0. Ringkasan Eksekutif

- **Masalah:** Mahasiswa tingkat akhir dan career switcher tidak tahu skill apa yang benar-benar mereka kuasai, sehingga belajar tanpa arah.
- **Solusi:** SkillGenome menjalankan asesmen adaptif, memetakan penguasaan 8 skill menjadi "genome", lalu menyusun jalur belajar prioritas dan Skill Passport yang bisa dibagikan.
- **Diferensiasi:** Penguasaan dihitung probabilistik (bukan satu skor), soal dipilih adaptif, rekomendasi bisa dijelaskan faktor demi faktor, dan eksekusi (dokumen + email) berjalan lewat agent.
- **Integrasi wajib:** Langflow menjadi engine (flow + tools via MCP). IBM Bob menjadi antarmuka percakapan yang memilih tool. Web app Next.js menjadi klien interaktif untuk engine yang sama.
- **Bisnis:** Freemium B2C, lisensi white-label kampus, hiring fee dari employer, API ke ATS/HR, dan marketplace mentor.

---

## 1. Vision

### 1.1 Vision statement

> Setiap orang punya DNA skill yang unik. SkillGenome memecahkan kode itu dan menunjukkan jalur belajar paling efisien menuju karier impian.

### 1.2 Metafora "23andMe untuk skill" dan batasannya

| Yang dipinjam dari metafora | Yang sengaja tidak dipinjam |
|---|---|
| Profil yang terurai per komponen, mudah dibaca | Kesan bahwa skill itu bawaan dan tetap |
| Laporan pribadi yang bisa dibagikan (Skill Passport) | Prediksi deterministik "kamu pasti cocok/tidak cocok" |
| Rekomendasi tindak lanjut dari hasil analisis | Klaim ilmiah yang tidak bisa dibuktikan |

`[KEPUTUSAN]` Genome selalu ditampilkan sebagai **snapshot bertanggal** ("Genome per 11 Okt 2026") yang akan berubah saat user belajar. Copy UI tidak boleh bernada takdir.

### 1.3 North Star Metric

**Waktu menuju job-ready**: jumlah minggu sampai skor kesiapan peran (match) mencapai ≥ 80%. `[HIPOTESIS]` Target pilot: lebih pendek dibanding baseline belajar mandiri tanpa asesmen; baseline diukur lewat wawancara.

### 1.4 Prinsip produk

1. **Bukti di atas klaim**: skill diukur lewat soal, bukan pengakuan diri.
2. **Transparan**: setiap skor dan rekomendasi menunjukkan faktor penyebabnya.
3. **User tetap pegang kendali**: hasil bisa dikoreksi, data bisa diekspor dan dihapus.
4. **Data seminimal mungkin**: hanya yang diperlukan untuk hasil.

---

## 2. Problem Statement

### 2.1 Rumus tiga bagian (sesuai materi Session 2)

| Bagian | Isi |
|---|---|
| **User + kondisi** | Mahasiswa tingkat akhir dan career switcher yang menargetkan peran Data Analyst, sedang menyiapkan diri sebelum melamar kerja. |
| **Needs + tantangan** | Butuh tahu skill mana yang sudah dikuasai dan mana yang belum, tetapi hanya punya klaim diri, daftar sertifikat, dan rekomendasi umum dari internet. |
| **Hasil + ukuran** | Mereka bisa menyusun jalur belajar berbasis gap, dengan lebih sedikit jam terbuang pada skill yang sudah dikuasai dan keputusan beli kursus yang lebih terarah. |

**How Might We:** Bagaimana cara kita membantu calon Data Analyst mencapai jalur belajar yang efisien meskipun mereka tidak tahu skill apa yang sebenarnya sudah dikuasai?

### 2.2 Konsekuensi nyata

| Konsekuensi | Dampak |
|---|---|
| Belajar hal yang sudah dikuasai | Waktu terbuang |
| Melewati skill fundamental yang belum dikuasai | Fondasi rapuh, gagal di tes teknis rekrutmen |
| Membeli kursus mahal tanpa arah | Uang terbuang, kursus tidak selesai |
| Siklus belajar tanpa arah berbulan-bulan | `[PERLU SUMBER]` 6–18 bulan terbuang dan tetap tidak mendapat kerja |

### 2.3 Bukti dan status validasi

| Klaim | Status | Tindakan sebelum masuk deck |
|---|---|---|
| Mahasiswa dan career switcher tidak tahu level skill mereka | `[HIPOTESIS]` | Wawancara 5 orang (voice note), catat "terakhir kali kamu memilih apa yang dipelajari, bagaimana caranya?" |
| 6–18 bulan terbuang | `[PERLU SUMBER]` | Pakai angka dari wawancara atau hapus |
| "1.250+ lowongan Data Analyst per bulan di Indonesia" | `[PERLU SUMBER]` | Hitung dari sumber yang bisa dikutip. Jika tidak ada sumber, ganti dengan agregasi dataset Kaggle dan sebut "benchmark global" |
| Dataset lowongan (Kaggle) mewakili pasar | `[KEPUTUSAN]` dipakai sebagai proxy | Cantumkan keterbatasan: data global, bukan khusus Indonesia |
| Persona Andi membeli 3 kursus yang tidak selesai | Ilustratif | Tandai sebagai persona rekaan, bukan data |

### 2.4 Gap solusi yang ada

| Pendekatan umum | Keterbatasan |
|---|---|
| Kursus online | Arah umum untuk semua orang, tidak tahu titik awal user |
| Tes skill generik | Satu skor, tanpa jalur belajar |
| Konsultan karier | Mahal dan sulit diskalakan |
| CV builder | Merapikan kemasan, tidak mengukur kemampuan |

---

## 3. Target User

### 3.1 Audiens (siapa boleh pakai)

| Segmen | Usia | Kebutuhan utama | Prioritas |
|---|---|---|---|
| Mahasiswa tingkat akhir (semua jurusan) | 21–24 | Tahu persiapan sebelum lulus | Utama |
| Career switcher dari non-tech | 25–35 | Tahu titik mulai yang realistis | Utama |
| Fresh graduate | 22–26 | Menutup gap sebelum seleksi | Sekunder |
| Karyawan upskilling | 25–40 | Naik peran tanpa mengulang dasar | Sekunder |

### 3.2 Tiga persona representatif

**Persona 1 — Andi (22), semester 7 Manajemen**

| Aspek | Isi |
|---|---|
| Tujuan | Menjadi Data Analyst setelah lulus |
| Kondisi | Sudah membeli 3 kursus Udemy, tidak ada yang selesai |
| Pain point | Tidak tahu harus mulai dari SQL, Python, atau statistik |
| Skenario | Onboarding 3 langkah, asesmen 10 soal, melihat radar genome, mengikuti 5 langkah roadmap |
| Metrik sukses | Memilih satu urutan belajar dalam kurang dari 15 menit, dan berhenti membeli kursus di luar roadmap |

**Persona 2 — Sari (29), career switcher Marketing ke Product Analyst**

| Aspek | Isi |
|---|---|
| Tujuan | Pindah ke peran analitik produk |
| Kondisi | Takut mulai dari nol, punya kekuatan komunikasi dan business acumen |
| Pain point | Tidak tahu bahwa sebagian skill-nya sudah transferable |
| Skenario | Genome menunjukkan kekuatan di Communication dan Business Acumen, gap di SQL dan Statistics |
| Metrik sukses | Percaya diri mulai belajar karena melihat bukti skill yang sudah ada |
| Catatan scope | Demo hanya mencakup Data Analyst. Sari diarahkan ke "peran terdekat" dan UI jujur menyebut peran lain "segera hadir". |

**Persona 3 — Budi (23), fresh grad Teknik Industri**

| Aspek | Isi |
|---|---|
| Tujuan | Lolos seleksi analis di perusahaan |
| Kondisi | Skill teknis cukup, tidak bisa mengemasnya untuk recruiter |
| Pain point | CV tidak menunjukkan bukti terukur |
| Skenario | Membuat Skill Passport (dokumen + QR) dan mengirimkannya ke dirinya sendiri atau recruiter |
| Metrik sukses | Memiliki satu tautan Passport yang bisa dibuka recruiter |

### 3.3 Demo scope

| Keputusan | Alasan |
|---|---|
| Role demo: **Data Analyst** | Skill-nya paling terukur lewat soal pilihan ganda (SQL, statistik, Excel). Permintaan pasar: `[PERLU SUMBER]` |
| 8 skill dilacak | SQL, Python, Statistics, Excel, Data Visualization, Business Acumen, Communication, Domain Knowledge |
| Arsitektur role-agnostic | Role vector dan `job_market` disimpan per role, jadi menambah role hanya butuh data baru |
| Bank soal hanya untuk Data Analyst | Role lain ditampilkan sebagai "segera hadir" |

---

## 4. Value Proposition

| Untuk | Manfaat | Bukti diferensiasi |
|---|---|---|
| Mahasiswa dan career switcher | Tahu posisi skill dalam 10–15 menit | Asesmen adaptif (IRT), bukan kuis tetap |
| Semua user | Penguasaan per skill sebagai probabilitas | Bayesian Knowledge Tracing, bukan skor tunggal |
| Semua user | Jalur belajar 5 langkah berurutan berdasarkan gap x pentingnya skill | Faktor prioritas bisa dilihat dan dijelaskan |
| User yang melamar kerja | Skill Passport (dokumen + email + QR) | Dibuat otomatis oleh agent lewat Bob + Langflow + Composio |
| Kampus | Peta kesiapan kohort | Dashboard agregat anonim (fase B2B) |

---

## 5. Core Features

### 5.1 Daftar fitur

| ID | Fitur | Deskripsi | Prioritas | Halaman | Flow |
|---|---|---|---|---|---|
| F1 | Adaptive Assessment | 10 soal, dipilih berdasar informasi maksimal, dengan coverage 8 skill | P0 | `/assessment` | Flow 1, 2 |
| F2 | Genome Dashboard | Radar 8 skill, galaksi 3D, penjelasan skor | P0 | `/genome` | Flow 2 |
| F3 | Roadmap + What-if | 5 langkah belajar, simulasi "bila skill X selesai" | P0 | `/roadmap` | Flow 3 |
| F4 | Skill Passport | Kartu digital + QR, dokumen Google Docs, email | P0 | `/passport` | Flow 4 |
| F5 | Bob Conversational Path | Seluruh alur dijalankan lewat chat di IBM Bob | P0 | Bob | Flow 1–4 via MCP |
| F6 | Responsible AI Panel | Penjelasan, banding, ekspor dan hapus data | P0 | `/settings` | API |
| F7 | Job Matcher | Daftar role dan persentase kecocokan | P1 | `/jobs` | Flow 3 |
| F8 | Progress Tracker | Heatmap aktivitas dan streak | P2 | `/progress` | API |
| F9 | Community | Leaderboard anonim dan feed | P2 | `/community` | Mock |
| F10 | Insights | Artikel hasil RAG | P2 | `/insights` | Flow (opsional) |

### 5.2 User story dan acceptance criteria (P0)

| ID | User story | Acceptance criteria |
|---|---|---|
| US1 | Sebagai calon Data Analyst, saya ingin mengikuti asesmen singkat agar tahu level skill saya | Given user memilih target role Data Analyst, when memulai asesmen, then muncul 10 soal yang mencakup 8 skill |
| US2 | Sebagai user, saya ingin melihat genome saya | Given asesmen selesai, when membuka `/genome`, then tampil radar 8 skill dengan nilai 0–100% dan faktor penjelas per skill |
| US3 | Sebagai user, saya ingin tahu langkah belajar berikutnya | Given genome tersedia, when membuka `/roadmap`, then tampil maksimal 5 langkah berurut dengan sumber belajar dan estimasi jam |
| US4 | Sebagai user, saya ingin mensimulasikan hasil belajar | Given roadmap tampil, when saya menandai skill selesai, then match% dihitung ulang di browser dan selisihnya ditampilkan |
| US5 | Sebagai user, saya ingin Skill Passport | Given genome tersedia dan saya mengonfirmasi email, when menekan "Buat Passport", then dokumen dibuat dan email terkirim hanya setelah konfirmasi |
| US6 | Sebagai user, saya ingin mengoreksi hasil yang menurut saya salah | Given hasil tampil, when saya mengajukan banding pada satu skill, then pengajuan tersimpan dan skill ditandai "ditinjau" |
| US7 | Sebagai user, saya ingin menghapus data saya | Given saya di `/settings`, when menekan "Hapus data saya" dan mengonfirmasi, then dokumen user dihapus dari database |
| US8 | Sebagai user Bob, saya ingin menjalankan semuanya lewat percakapan | Given Bob terhubung ke Langflow, when saya menulis "Mulai asesmen Data Analyst", then Bob memanggil `start_skill_assessment` dan menampilkan soal |

---

## 6. Algoritma

### 6.1 Ringkasan

| # | Algoritma | Fungsi | Status implementasi |
|---|---|---|---|
| 1 | IRT 2PL | Estimasi kemampuan θ dan pemilihan soal informasi maksimal | Nyata |
| 2 | Bayesian Knowledge Tracing (BKT) | Probabilitas penguasaan per skill | Nyata |
| 3 | Embedding skill 8 dimensi | Ruang laten untuk membandingkan profil user dan role | Matriks kurasi manual, **bukan** model RotatE terlatih |
| 4 | Cosine similarity + coverage | Kecocokan profil dengan role | Nyata |
| 5 | Greedy priority | Memilih 5 skill prioritas | Heuristik, **bukan** reinforcement learning terlatih |

### 6.2 IRT 2PL

```
P(benar) = 1 / (1 + e^(-a(θ - b)))
```

| Parameter | Arti | Rentang |
|---|---|---|
| θ | Kemampuan user | -4 sampai +4 |
| a | Daya beda soal | 0.5 sampai 2.0 |
| b | Tingkat kesulitan | -3 sampai +3 |

- **Pemilihan soal:** maksimalkan informasi Fisher `I(θ) = a² · P · (1 − P)`. Satu soal terbaik per skill dipilih lebih dulu agar 8 skill tertutup, lalu sisanya dipilih global (10 soal total).
- **Update θ:** estimasi MAP dengan prior Normal(0, 1) lewat Newton-Raphson. Prior wajib karena MLE murni divergen saat semua jawaban benar atau semua salah.

### 6.3 Bayesian Knowledge Tracing

| Parameter | Nilai awal | Arti |
|---|---|---|
| P(L0) | 0.30 | Peluang sudah menguasai sebelum soal pertama |
| P(T) | 0.20 | Peluang belajar di tiap kesempatan |
| P(S) | 0.10 | Slip: menguasai tetapi salah |
| P(G) | 0.20 | Guess: belum menguasai tetapi benar |

```
Benar : P(L|benar) = P(L)(1-S) / [P(L)(1-S) + (1-P(L))G]
Salah : P(L|salah) = P(L)S     / [P(L)S     + (1-P(L))(1-G)]
Transisi: P(L_next) = P(L|obs) + (1 - P(L|obs)) · T
```

### 6.4 Embedding skill, cosine, dan coverage

- Tiap skill adalah vektor 8 dimensi (`quant, code, logic, comm, biz, tools, viz, dataops`). Profil user dan role diproyeksikan ke ruang ini (`vec @ matriks`).
- **Temuan uji:** cosine saja tidak membedakan level. Pada profil uji, coverage 0.57 tetapi cosine 0.99, karena semua komponen positif dan cosine mengabaikan magnitudo.
- **Keputusan:** `match% = coverage x cosine`. Coverage menilai level penguasaan, cosine menilai konsistensi bentuk profil dan hanya menjadi pengali (≤ 1).

### 6.5 Greedy priority

```
priority(skill) = max(target_mastery - mastery, 0) x importance(role, skill)
```

Ambil 5 teratas dengan priority > 0. Karena rumusnya aditif, kontribusi tiap skill dapat didekomposisi secara **eksak** (`share% = priority / total`). Ini dipakai sebagai penjelasan, tanpa perlu mengklaim SHAP.

### 6.6 Bahasa yang jujur di pitch

| Boleh dikatakan | Jangan dikatakan |
|---|---|
| "Asesmen adaptif berbasis IRT 2PL" | "AI mendiagnosis kemampuan Anda" |
| "Penguasaan dilacak dengan Bayesian Knowledge Tracing" | "Model dilatih dari jutaan data" |
| "Vektor skill kurasi manual terinspirasi O*NET" | "Knowledge graph embedding RotatE terlatih" |
| "Penjelasan faktor kontribusi eksak" | "Penjelasan SHAP" |
| "Heuristik prioritas greedy" | "Reinforcement learning" |

### 6.7 Keterbatasan yang diumumkan

| Keterbatasan | Dampak | Rencana |
|---|---|---|
| Parameter a, b soal ditetapkan manual, belum dikalibrasi dari data respons | Skor kurang presisi | Kalibrasi setelah ≥ 200 respons per soal |
| Parameter BKT memakai nilai awal yang sama untuk semua skill | Penguasaan bisa bias | Fit per skill saat data cukup |
| θ tunggal dipakai lintas skill | Tidak menangkap perbedaan kemampuan antar skill | θ per skill pada versi berikutnya |
| Importance skill awalnya heuristik | Urutan roadmap bisa berbeda dari pasar | Turunkan dari agregasi data lowongan |

---

## 7. Tech Stack

| Layer | Teknologi | Peran | Catatan |
|---|---|---|---|
| Frontend | Next.js 16 (App Router, React 19, Turbopack), TypeScript strict | UI web | |
| Styling | Tailwind v4, shadcn/ui (Base UI, preset Nova) | Design system | |
| Animasi | Framer Motion | Transisi dan momen utama | Dibatasi, lihat Design.md |
| Visualisasi | Recharts, Three.js + @react-three/fiber + drei | Radar, line, bar, galaksi 3D | 3D di-lazy-load |
| State | Zustand | State sesi asesmen | |
| UI kecil | lucide-react, canvas-confetti | Ikon, perayaan | |
| Agent UI | **IBM Bob (MCP client)** | Antarmuka percakapan, pemilihan tool | Wajib |
| Engine | **Langflow (MCP server)** | Eksekusi flow dan orkestrasi LLM | Wajib |
| LLM + embedding | Gemini API (free tier) | Penjelasan, narasi, embedding | |
| Vector store | Astra DB (free tier) | Skills, questions, job_market, users | |
| Integrasi aksi | Composio (free tier) | Google Docs dan Gmail | Aksi eksternal wajib konfirmasi user |
| Deploy | Vercel | Hosting web | Lihat catatan topologi di Architecture.md |

### 7.1 Dua klien, satu engine

```
Pengguna A ──> IBM Bob ──(MCP)──────┐
                                    ├──> Langflow (4 flow) ──> Astra DB / Gemini / Composio
Pengguna B ──> Web SkillGenome ─(REST)┘
```

`[KEPUTUSAN]` Logika algoritma hidup di Langflow (satu sumber kebenaran). Web hanya mem-port perhitungan ringan (what-if) agar interaktif tanpa menunggu jaringan.

### 7.2 Konvensi tool (sesuai materi kelas)

Nama tool berawalan kata kerja dan spesifik: `start_skill_assessment`, `submit_assessment_answers`, `recommend_career_path`, `generate_skill_passport`. Deskripsi tool diawali kata kerja dan menyebut input yang diharapkan.

---

## 8. Monetisasi

### 8.1 Model pendapatan

| Model | Harga (hipotesis) | Pembayar | Alasan | Validasi yang dibutuhkan |
|---|---|---|---|---|
| B2C Freemium → Premium | Rp 79.000/bulan | User | Free: 1 asesmen/bulan. Premium: asesmen tak terbatas, roadmap diperbarui otomatis, Passport tanpa batas | Tanya willingness-to-pay ke 5 calon user |
| B2B kampus white-label | Rp 50 juta/tahun/prodi | Kampus/prodi | Dashboard kesiapan kohort, branding kampus | Wawancara 1 kaprodi |
| B2B2C hiring fee | 10% gaji pertama | **Employer** (asumsi) | Pipeline kandidat dengan skill terverifikasi | Cek regulasi biaya penempatan kerja sebelum diterapkan. Jangan membebankan ke kandidat |
| API ke ATS/HR | Per panggilan atau langganan | Perusahaan/platform HR | Passport dan skor dapat dibaca sistem rekrutmen | Butuh persetujuan eksplisit user |
| Marketplace mentor | Revenue share | Mentor (potongan) / user | Mentor ditemukan berdasarkan gap skill | Butuh kurasi mentor |

### 8.2 Ilustrasi unit economics `[HIPOTESIS]`

| Item | Rumus | Contoh |
|---|---|---|
| Harga per mahasiswa (kampus) | Harga prodi / jumlah mahasiswa tingkat akhir | Rp 50.000.000 / 150 = ± Rp 333.000 per mahasiswa per tahun |
| Syarat sehat B2C | Biaya variabel per user aktif per bulan < 15% ARPU | Dihitung dari harga token LLM saat produksi |
| Free-tier hackathon | Biaya variabel ≈ 0 (kuota gratis) | Tidak berlaku untuk produksi |

### 8.3 Business Model Canvas ringkas

| Blok | Isi |
|---|---|
| Customer segments | Mahasiswa akhir, career switcher, fresh grad, kampus, employer |
| Value proposition | Peta skill terukur, jalur belajar efisien, Skill Passport |
| Channels | Kampus, komunitas bootcamp, LinkedIn/IG, referral Passport |
| Customer relationships | Self-serve, progres mingguan, komunitas |
| Revenue streams | Premium, lisensi kampus, hiring fee, API, marketplace |
| Key resources | Bank soal terkalibrasi, data lowongan, algoritma, brand |
| Key activities | Kurasi soal, kalibrasi, pembaruan data pasar |
| Key partnerships | Kampus, penyedia kursus, employer, penyedia mentor |
| Cost structure | LLM dan infrastruktur, kurasi konten, akuisisi kampus |

### 8.4 Roadmap bisnis

| Fase | Fokus | Indikator lanjut |
|---|---|---|
| 0 (hackathon) | Prototype dan validasi 5 user | Genome dan Passport selesai dalam satu sesi |
| 1 | Pilot 1 prodi | Penyelesaian asesmen ≥ 60% |
| 2 | Lisensi kampus dan Premium | Konversi Premium dan pembaruan kontrak |
| 3 | Employer, API, marketplace | Persetujuan user untuk berbagi Passport |

---

## 9. Responsible AI

Dirancang mengikuti rubrik penilaian dan materi kelas (tanggung jawab data, output, tindakan, bias dan fairness, privasi, transparansi).

### 9.1 Prinsip dan implementasi

| Prinsip | Implementasi | Cara verifikasi |
|---|---|---|
| **Fairness** | Nama, gender, dan kampus tidak masuk fitur model. Hanya jawaban soal yang menentukan hasil | Uji invarians: ubah nama/gender/kampus, hasil harus identik |
| **Explainability** | Tiap skor menampilkan faktor: jawaban, level soal, gap, importance. Dekomposisi kontribusi eksak | Panel "Kenapa skor ini?" tersedia di semua skor |
| **Human appeal** | User bisa mengajukan banding per skill | Pengajuan tersimpan dan skill ditandai "ditinjau" |
| **Human-in-the-loop** | Email dan dokumen dibuat hanya setelah user mengonfirmasi | Flow 4 menolak eksekusi tanpa `confirm=true` |
| **Data minimization** | Hanya simpan `user_id` pseudonim, target role, jawaban, mastery. Nama dan email opsional | Skema `users` hanya memuat field yang dipakai |
| **Data portability** | Ekspor JSON dan hapus data dari `/settings` | Uji ekspor dan hapus end-to-end |
| **Accessibility** | Mobile-first, low-bandwidth (3D opsional), mode tanpa timer, multibahasa | Checklist WCAG di Design.md |
| **Transparansi batas** | Disclaimer: bukan pengganti konselor karier profesional | Tampil di hasil dan Passport |

### 9.2 Protokol uji bias

1. Siapkan 20 profil jawaban sintetis.
2. Untuk tiap profil, jalankan dengan variasi metadata: nama, gender, kampus.
3. Bandingkan θ, mastery, dan roadmap. Lolos jika selisih = 0.
4. Simpan hasil sebagai bukti di dokumen teknis dan deck.

### 9.3 Privasi

| Risiko | Mitigasi |
|---|---|
| Kebocoran data pribadi | Pseudonimisasi, kunci rahasia hanya di server, `.gitignore` untuk konfigurasi MCP |
| Pengiriman data tanpa izin | Consent eksplisit sebelum email dan Passport publik |
| Retensi tanpa batas | Riwayat dibatasi 20 entri terakhir, hapus data oleh user |
| Prompt injection lewat nama | Input disanitasi, LLM hanya menerima angka terstruktur |

### 9.4 Keterbatasan yang diumumkan ke user

- Hasil adalah estimasi dari 10 soal dengan parameter yang belum dikalibrasi.
- Data pasar bersifat global (proxy), bukan khusus Indonesia.
- Genome adalah snapshot, bukan penilaian permanen.

---

## 10. Success Metrics

### 10.1 Metrik produk dan model

| Kategori | Metrik | Definisi | Target hackathon | Cara ukur |
|---|---|---|---|---|
| Aktivasi | Waktu ke genome pertama | Dari mulai onboarding sampai radar tampil | < 15 menit | Uji 5 user |
| Engagement | Penyelesaian asesmen | Sesi selesai / sesi mulai | ≥ 80% (uji internal) | Log sesi |
| Model | Konvergensi θ | Perubahan θ pada 2 soal terakhir | < 0.3 rata-rata | Simulasi 20 profil |
| Model | Konsistensi bias | Selisih hasil antar variasi metadata | 0 | Uji invarians |
| Teknis | Latensi Flow 1–3 | P50 per panggilan | < 8 detik | Playground dan Bob |
| Teknis | Keberhasilan Flow 4 | Dokumen + email berhasil | ≥ 90% pada 10 percobaan | Uji manual |
| Dampak | Kepercayaan hasil | Skor 1–5 "hasil sesuai persepsi saya" | ≥ 4 | Survei 5 user |
| Bisnis | Willingness-to-pay | Jumlah dari 5 user yang mau membayar pada harga uji | Dicatat | Wawancara |

### 10.2 Pemetaan rubrik penjurian (Preliminary)

Materi kelas memuat dua versi bobot. **Konfirmasi ke panitia** versi mana yang berlaku. Versi B berjumlah 95%, kemungkinan salah ketik.

| Kriteria | Bobot versi A | Bobot versi B | Bukti di SkillGenome | Artefak |
|---|---|---|---|---|
| Problem Clarity & Relevance | 20% | 20% | Rumus masalah, persona, hasil wawancara | Idea & Business Canvas |
| Innovation, Feasibility & Monetization | 20% | 25% | IRT+BKT adaptif, Passport agentic, model bisnis | Canvas, deck |
| User Impact & Benefits | 20% | 15% | Waktu ke keputusan belajar, dampak terukur | Hasil pilot 5 user |
| Technical Execution & Prototype | 15% | 15% | Bob + Langflow via MCP, algoritma teruji, deploy | Dokumen teknis, screenshot |
| Responsible AI | 15% | 10% | Uji bias, explainability, banding, privasi | Panel di aplikasi, hasil uji |
| Hackathon Class Participation | 10% | 10% | Absensi dan kontribusi kelas | Bukti absensi |

### 10.3 Checklist submission (aturan hackathon)

| Syarat | Status |
|---|---|
| Bukti kelulusan IBM SkillsBuild University Education 2026 | Cek sertifikat |
| Idea & Business Canvas | Disusun dari PRD ini |
| MVP + Technical Documentation | Architecture.md |
| Pitching deck + 3–5 screenshot | Task.md Sprint 11 |
| Pernyataan orisinalitas | Centang di form |
| Link/file project dapat diakses reviewer | Deploy + repo dengan konfigurasi contoh |

---

## 11. Out of Scope (hackathon)

| Item | Alasan | Kapan |
|---|---|---|
| Role selain Data Analyst | Butuh bank soal baru | Setelah pilot |
| Kalibrasi IRT dari data nyata | Butuh respons pengguna | Pasca pilot |
| Model embedding terlatih (RotatE) | Tidak ada data pelatihan | Riset lanjutan |
| Reinforcement learning untuk roadmap | Tidak ada data hasil belajar | Riset lanjutan |
| Pembayaran dan langganan | Tidak diperlukan untuk demo | Fase 2 |
| Autentikasi penuh (OAuth user) | Cukup `user_id` pseudonim | Fase 1 |
| Aplikasi mobile native | Web responsif cukup | Fase 2 |
| Pengiriman email massal | Risiko penyalahgunaan | Tidak direncanakan |

---

## 12. Risiko dan Mitigasi

| Risiko | Dampak | Peluang | Mitigasi |
|---|---|---|---|
| Web di Vercel tidak bisa memanggil Langflow yang berjalan di localhost | Demo live gagal | Tinggi | Mode demo statis di Vercel + tunnel opsional + video demo jalur Bob |
| Kuota free tier (Gemini, Astra, Composio) habis | Alur terhenti | Sedang | Cache hasil seed, hemat panggilan LLM, siapkan rekaman |
| Bank soal terlalu sedikit | Asesmen berulang | Sedang | Minimal 32 soal MVP (4 per skill), target 48 |
| Klaim statistik tanpa sumber | Kredibilitas turun | Sedang | Hapus atau ganti dengan data yang bisa dikutip |
| Ruang lingkup 13 halaman terlalu besar | Tidak selesai | Tinggi | Tier 1 wajib, Tier 2–3 statis, lihat Task.md |
| Dataset lowongan tidak khusus Indonesia | Rekomendasi bias | Sedang | Sebut sebagai benchmark global, cantumkan lisensi dan sumber |

---

## 13. Glosarium

| Istilah | Arti |
|---|---|
| Genome | Vektor penguasaan 8 skill milik user pada satu waktu |
| IRT | Item Response Theory, model peluang menjawab benar |
| BKT | Bayesian Knowledge Tracing, model penguasaan yang diperbarui per jawaban |
| MCP | Model Context Protocol, standar penghubung Bob dan Langflow |
| Skill Passport | Dokumen dan kartu ringkas hasil genome yang bisa dibagikan |
| Coverage | Rasio penguasaan terhadap target, dibobot importance |
| HITL | Human-in-the-loop, aksi menunggu persetujuan manusia |

## 14. Pertanyaan terbuka

| Pertanyaan | Pemilik | Batas waktu |
|---|---|---|
| Versi bobot penilaian mana yang berlaku (A atau B)? | Panitia | Sebelum submit |
| Sumber angka lowongan Data Analyst di Indonesia? | Penulis | Sebelum deck final |
| Lisensi dan syarat penggunaan dataset lowongan di Kaggle | Penulis | Sebelum unggah agregat |
| Siapa 5 orang untuk wawancara dan uji? | Penulis | Hari ini |