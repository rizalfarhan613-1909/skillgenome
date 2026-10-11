# Design — SkillGenome

> **Dokumen:** UI/UX Design Guide · **Versi:** 1.0 · **Tanggal:** 10 Oktober 2026
> **Terkait:** [PRD.md](./PRD.md) · [Architecture.md](./Architecture.md) · [Task.md](./Task.md)

| Item | Isi |
|---|---|
| Arah visual | Dark mode, bioluminescent, ilmiah (laboratorium DNA masa depan) |
| Stack UI | Next.js 16, Tailwind v4, shadcn/ui (Base UI, preset Nova), Framer Motion, Recharts, Three.js (R3F + drei), Zustand |
| Halaman | 13 halaman dalam 3 tier, ditambah 1 rute pendukung `/passport/verify/[id]` |
| Bahasa UI | Indonesia (default), Inggris (toggle). Narasi dokumen Indonesia, istilah teknis Inggris |

**Penanda:** `[KEPUTUSAN]` acuan build · `[BRIEF]` dikunci oleh brief awal, diikuti persis · `[REKOMENDASI]` penyempurnaan yang bisa dipangkas bila waktu mepet.

---

## 1. Design Philosophy

### 1.1 Konsep

SkillGenome adalah laboratorium: ruang gelap yang tenang, tempat data skill berpendar seperti sampel biologis di bawah mikroskop. Pengguna masuk untuk membaca hasil, bukan untuk dihibur. Maka visual yang paling menarik adalah data itu sendiri.

### 1.2 Lima prinsip

| # | Prinsip | Konsekuensi di UI |
|---|---|---|
| 1 | **Satu momen yang diingat** | Galaksi 3D di `/genome` menjadi pusat perhatian. Halaman lain tenang dan disiplin |
| 2 | **Visualisasi adalah informasi** | Setiap warna, ukuran, dan garis menyandikan data (penguasaan, importance, kemiripan), bukan dekorasi |
| 3 | **Motion menjawab aksi** | Animasi dipakai saat sesuatu berubah (jawaban, hasil dihitung, Passport jadi). Bukan hiasan scroll |
| 4 | **Bisa dipakai di mana saja** | Mobile-first, 3D opsional, mode tanpa timer, bisa dipakai di koneksi lambat |
| 5 | **Transparansi terlihat** | Setiap skor punya tombol "Kenapa skor ini?" yang membuka faktor penyebabnya |

### 1.3 Catatan terhadap brief

| Hal | Keputusan |
|---|---|
| Warna, tipografi, dan motion | `[BRIEF]` diikuti persis |
| Hover scale 1.02 + glow | Hanya pada elemen interaktif (kartu yang bisa diklik, tombol), bukan semua kartu |
| Stagger fade-in | Satu urutan masuk per halaman pada konten utama, bukan di setiap section saat scroll |
| Label | Kalimat biasa (sentence case). Tidak memakai huruf kapital semua untuk label |
| Penomoran | Hanya untuk urutan nyata: wizard onboarding, langkah roadmap, cara kerja |
| Teks tombol | Kata kerja yang menjelaskan hasil ("Mulai asesmen", "Buat Passport"), tanpa tanda panah tambahan |

---

## 2. Visual Identity

### 2.1 Warna `[BRIEF]`

| Token | Hex | Peran | Dipakai untuk |
|---|---|---|---|
| `--bg` | `#0A0A1A` | Latar (deep space) | Body, canvas 3D |
| `--primary` | `#6366F1` | Indigo | Garis, glow, fokus, grafik utama |
| `--accent-cyan` | `#22D3EE` | Aksen 1 | Skill teknis, data aktif |
| `--accent-pink` | `#F472B6` | Aksen 2 | Komunikasi, sorotan gap |
| `--accent-green` | `#34D399` | Aksen 3 | Kekuatan, keberhasilan, bisnis |
| `--text` | `#F1F5F9` | Teks utama | Judul dan isi |
| `--text-muted` | `#94A3B8` | Teks sekunder | Keterangan, label |
| `--glass` | `rgba(255,255,255,0.05)` | Permukaan kaca | Kartu dengan `backdrop-blur` |
| `--glass-border` | `rgba(255,255,255,0.08)` | Garis kaca | Tepi kartu |

### 2.2 Kontras (dihitung terhadap `#0A0A1A`)

| Pasangan | Rasio | Hasil WCAG AA |
|---|---|---|
| `--text` | 17,89 : 1 | Lolos |
| `--text-muted` | 7,65 : 1 | Lolos |
| `--accent-cyan` | 10,85 : 1 | Lolos |
| `--accent-green` | 10,20 : 1 | Lolos |
| `--accent-pink` | 7,40 : 1 | Lolos |
| `--primary` `#6366F1` | 4,39 : 1 | **Tidak lolos untuk teks kecil**, lolos untuk elemen UI besar (≥ 3 : 1) |
| `#A5B4FC` (indigo terang) | 9,83 : 1 | Lolos, dipakai untuk teks berwarna indigo |
| Putih di atas `#6366F1` | 4,47 : 1 | Hampir lolos. Tombol terisi memakai `#4F46E5` (± 6,3 : 1) |
| `--text-muted` di atas permukaan kaca (`#161625`) | 6,97 : 1 | Lolos |

`[KEPUTUSAN]` Teks indigo kecil memakai `#A5B4FC`. Tombol utama terisi memakai `#4F46E5` dengan teks putih. `#6366F1` tetap untuk garis, glow, dan grafik.

### 2.3 Token Tailwind v4

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --color-bg: #0A0A1A;
  --color-primary: #6366F1;
  --color-primary-strong: #4F46E5;
  --color-primary-soft: #A5B4FC;
  --color-cyan: #22D3EE;
  --color-pink: #F472B6;
  --color-green: #34D399;
  --color-text: #F1F5F9;
  --color-muted: #94A3B8;
  --color-glass: rgb(255 255 255 / 0.05);
  --color-glass-border: rgb(255 255 255 / 0.08);

  --font-heading: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
  --font-body: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;

  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --duration-base: 300ms;
  --duration-slow: 500ms;
}

html { background: var(--color-bg); color: var(--color-text); }

.glass {
  background: var(--color-glass);
  border: 1px solid var(--color-glass-border);
  backdrop-filter: blur(16px);
}
.glow-primary { box-shadow: 0 0 0 1px rgb(99 102 241 / .35), 0 0 24px rgb(99 102 241 / .25); }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

### 2.4 Tipografi `[BRIEF]`

| Peran | Font | Dipakai untuk |
|---|---|---|
| Heading | Space Grotesk | Judul halaman dan seksi |
| Body | Inter | Isi, formulir, soal |
| Mono | JetBrains Mono | Angka data (match%, θ, skor), ID, kode. Tidak dipakai untuk label biasa |

| Token | Ukuran / line-height | Berat | Penggunaan |
|---|---|---|---|
| `display` | 56/60 (mobile 36/40) | 700 | H1 landing saja |
| `h1` | 40/44 (mobile 30/36) | 600 | Judul halaman |
| `h2` | 28/34 | 600 | Judul seksi |
| `h3` | 20/28 | 600 | Judul kartu |
| `body-lg` | 18/28 | 400 | Teks pengantar |
| `body` | 16/26 | 400 | Teks utama dan soal |
| `small` | 14/22 | 400 | Keterangan |
| `caption` | 12/18 | 500 | Metadata, bukan informasi penting |
| `metric` | 48/48 | 500 (mono) | Angka besar, misalnya match% |

Aturan: panjang baris maksimal 68 karakter (`max-w-[68ch]`) untuk paragraf. Heading memakai `letter-spacing: -0.01em`. Angka di tabel dan skor memakai `font-variant-numeric: tabular-nums`.

### 2.5 Permukaan, radius, dan elevasi

| Level | Tampilan | Dipakai untuk |
|---|---|---|
| 0 | `--bg` polos | Latar |
| 1 | Kaca (`.glass`), radius 12 | Kartu informasi |
| 2 | Kaca + garis `--primary` 35%, radius 20 | Kartu fokus (hasil utama, Passport) |
| 3 | Kaca + glow primary | Elemen interaktif saat hover/fokus |

Radius berbeda menurut hierarki: 8 untuk kontrol kecil (input, chip), 12 untuk kartu biasa, 20 untuk kartu fokus, penuh untuk badge dan avatar.

### 2.6 Motion `[BRIEF]` dengan anggaran

| Token | Nilai | Pemakaian |
|---|---|---|
| Durasi dasar | 300 ms | Transisi status, drawer, accordion |
| Durasi lambat | 500 ms | Masuk halaman, hitung naik angka, reveal Passport |
| Easing | `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out) | Semua |
| Stagger | 60 ms antar anak | Satu urutan masuk per halaman |
| Hover | `scale(1.02)` + glow | Hanya elemen interaktif |
| Tap | `scale(0.98)` | Tombol, opsi jawaban |

```ts
// lib/motion.ts
export const ease = [0.22, 1, 0.36, 1] as const;
export const stagger = { show: { transition: { staggerChildren: 0.06 } } };
export const rise = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};
export const press = { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 } };
```

**Anggaran per halaman:** maksimal satu urutan masuk otomatis. Tambahan hanya bila menjawab aksi pengguna (memilih jawaban, mengganti tab, menandai selesai, membuat Passport). Dengan `prefers-reduced-motion`, semua animasi diganti perubahan instan dan galaksi 3D diganti SVG statis.

### 2.7 Pemetaan warna skill

Warna tidak pernah menjadi satu-satunya penanda. Setiap skill selalu punya label teks dan ikon.

| Kelompok | Skill | Warna | Ikon (lucide) |
|---|---|---|---|
| Teknis | SQL, Python, Excel | Cyan | `database`, `code-2`, `table-2` |
| Analitik | Statistics, Data Visualization | Indigo terang | `sigma`, `bar-chart-3` |
| Bisnis | Business Acumen, Domain Knowledge | Hijau | `briefcase`, `compass` |
| Komunikasi | Communication | Pink | `message-square-text` |

### 2.8 Ikonografi

`lucide-react`, stroke 1,5, ukuran 16 / 20 / 24 px. Ikon dekoratif memakai `aria-hidden`, ikon fungsional memakai label aksesibel.

---

## 3. Information Architecture

### 3.1 Peta situs

```
/                       Landing
/onboarding             Wizard 3 langkah
/assessment             Kuis adaptif
/assessment/review      Tinjauan jawaban
/genome                 Genome Dashboard
/genome/[skill]         Detail skill
/roadmap                Roadmap + what-if
/jobs                   Job Matcher
/passport               Skill Passport
/passport/verify/[id]   Verifikasi publik (rute pendukung)
/progress               Progres
/community              Komunitas
/insights               Insights
/settings               Profil + Responsible AI
```

### 3.2 Navigasi

| Viewport | Pola | Isi |
|---|---|---|
| ≥ 1024 px | Top bar | Genome, Roadmap, Jobs, Passport, Progress, menu Lainnya (Community, Insights, Settings) |
| < 1024 px | Bottom tab 5 item | Genome, Roadmap, Jobs, Passport, Lainnya |

### 3.3 Alur utama

| Alur | Langkah |
|---|---|
| Pengguna baru | Landing → Onboarding → Assessment → Genome → Roadmap → Passport |
| Pengguna kembali | Genome (data tersimpan) → Roadmap → Progress |
| Pengguna Bob | Memulai di Bob. Web menampilkan hasil yang sama memakai `user_id` yang sama. Halaman Genome menyediakan potongan perintah "Lanjutkan di Bob" |

### 3.4 State global (Zustand)

| Store | Isi | Persist |
|---|---|---|
| `assessment` | Soal, jawaban, indeks aktif, timer | Ya (localStorage, agar refresh tidak menghapus progres) |
| `genome` | Mastery, θ, match, langkah roadmap | Ya |
| `prefs` | Bahasa, tanpa timer, reduced motion, consent | Ya |

---

## 4. Spesifikasi 13 Halaman

Format tiap halaman: tujuan, data, layout, komponen, state, interaksi, aksesibilitas.

### Tier 1 — halaman juri (polish penuh)

#### 4.1 Landing `/`

| Aspek | Spesifikasi |
|---|---|
| Tujuan | Menjelaskan nilai dalam 5 detik dan mengarahkan ke asesmen |
| Hero | Heliks DNA 3D (R3F), prosedural dan ringan, bagian dari identitas "DNA skill" |
| Headline | "Your skill DNA, decoded." |
| Subjudul | "Jawab 10 soal adaptif. Lihat skill yang sudah kamu kuasai dan langkah belajar berikutnya." |
| CTA | Utama: "Mulai asesmen". Sekunder: "Coba lewat IBM Bob" (membuka panduan singkat) |
| Seksi | Cara kerja (3 langkah, berurutan sehingga bernomor) · Contoh genome interaktif (radar dengan data contoh) · Responsible AI singkat · Harga (freemium) · Footer |
| Data | Statis, tanpa panggilan engine |
| State | Heliks gagal dimuat atau perangkat lemah: gambar SVG statis |
| Interaksi | Heliks berputar pelan dan merespons posisi kursor (satu-satunya animasi otomatis) |
| Aksesibilitas | Heliks `aria-hidden`, CTA bisa difokus, kontras teks sesuai tabel kontras |

```
┌──────────────────────────────────────────────────────────┐
│ Logo SkillGenome                      Masuk  [Mulai asesmen]│
├──────────────────────────────────────────────────────────┤
│  Your skill DNA,                   ╭──╮ ╭──╮               │
│  decoded.                           ╲╱   ╲╱   (heliks 3D)  │
│  Jawab 10 soal adaptif. Lihat…      ╱╲   ╱╲                │
│  [Mulai asesmen] [Coba lewat Bob]  ╰──╯ ╰──╯               │
├──────────────────────────────────────────────────────────┤
│ Cara kerja:  1 Jawab  →  2 Lihat genome  →  3 Ikuti jalur  │
├──────────────────────────────────────────────────────────┤
│ Contoh genome (radar interaktif)        Responsible AI     │
└──────────────────────────────────────────────────────────┘
```

#### 4.2 Onboarding `/onboarding`

| Aspek | Spesifikasi |
|---|---|
| Tujuan | Menetapkan target dan izin dalam 3 langkah, kurang dari 1 menit |
| Langkah | 1) Pilih target role: Data Analyst aktif, role lain tampil "segera hadir" dan nonaktif. 2) Persepsi kesiapan 1–5 (opsional, tidak memengaruhi skor, hanya untuk kartu "persepsi vs hasil") dan alias opsional. 3) Izin dan preferensi: penyimpanan data, mode tanpa timer, bahasa |
| Data | Disimpan di store `prefs`, `user_id` acak dibuat di klien |
| Komponen | Stepper (bernomor karena memang berurutan), RoleCard, ConsentRow, Switch |
| State | Validasi inline, tombol "Lanjut" nonaktif sampai pilihan valid. Error ditampilkan dengan penjelasan perbaikan |
| Interaksi | Transisi geser antar langkah 300 ms, hanya menjawab aksi "Lanjut" |
| Aksesibilitas | Fokus pindah ke judul langkah baru, progres dibacakan ("Langkah 2 dari 3") |

#### 4.3 Genome Dashboard `/genome` ⭐

| Aspek | Spesifikasi |
|---|---|
| Tujuan | Menyajikan hasil: seberapa dekat user dengan target role dan skill mana yang berpengaruh |
| Data | Hasil Flow 2 (mastery, θ, match) |
| Layout | Kolom ringkasan (match%, θ, tanggal snapshot, persepsi vs hasil) + area visual (radar dan galaksi) + daftar skill berurut prioritas |
| Visual | Radar (Recharts) selalu ada. Galaksi 3D dimuat dinamis di layar ≥ 1024 px. Di mobile, tab "Radar / Galaksi" |
| Daftar skill | Nama, bar penguasaan, gap, importance, tombol "Kenapa skor ini?" |
| Kartu persepsi vs hasil | "Kamu menilai kesiapanmu 4 dari 5. Hasil asesmen: 56,5% dari target Data Analyst." Nada netral, tanpa menghakimi |
| Aksi | "Lihat roadmap", "Buat Passport", "Lanjutkan di Bob" |
| State | Loading: kerangka (skeleton) radar dan baris skill. Kosong: ajakan "Ikuti asesmen untuk melihat genome-mu". Error: jelaskan penyebab dan tombol "Muat ulang" |
| Interaksi | Hitung naik match% (500 ms) saat pertama tampil. Hover/fokus skill menyorot titik radar dan node galaksi secara bersamaan |
| Aksesibilitas | Radar punya tabel data tersembunyi untuk pembaca layar. Galaksi bisa difokus per node dengan keyboard (panah) dan punya alternatif tabel |

```
┌─ Genome per 11 Okt 2026 ──────────────── [Roadmap] [Passport] ┐
│ ┌──────────────┐  ┌────────────────────────────────────────┐ │
│ │ Match   56,5%│  │   Radar  |  Galaksi                     │ │
│ │ θ       0,04 │  │                                        │ │
│ │ Persepsi 4/5 │  │      ◇ radar 8 skill / galaksi 3D       │ │
│ │ vs hasil     │  │                                        │ │
│ └──────────────┘  └────────────────────────────────────────┘ │
│ Skill menurut prioritas                                       │
│ Statistics   ▓▓░░░░░░░░ 24%  gap 56   [Kenapa skor ini?]      │
│ Python       ▓▓░░░░░░░░ 24%  gap 56   [Kenapa skor ini?]      │
└───────────────────────────────────────────────────────────────┘
```

#### 4.4 Roadmap `/roadmap`

| Aspek | Spesifikasi |
|---|---|
| Tujuan | Menunjukkan lima langkah berurutan dan dampaknya |
| Data | Hasil Flow 3 (langkah, resource, faktor) |
| Layout | Timeline vertikal berisi 5 langkah (bernomor karena berurutan) + panel what-if lengket (sticky) di kanan atau bawah di mobile |
| Kartu langkah | Skill, alasan satu kalimat, bar `share%` prioritas, sumber belajar (judul, jam, tautan), kotak centang "Tandai selesai (simulasi)" |
| What-if | Menandai langkah mensimulasikan skill mencapai target. Match% dihitung ulang di browser (< 50 ms) dengan port `genome-core.ts`. Tampil "56,5% → 74,8% (+18,3)" |
| Total | Estimasi jam seluruh langkah |
| State | Loading skeleton, kosong "Selesaikan asesmen dulu", error dengan tombol coba lagi |
| Interaksi | Angka match naik/turun selama 500 ms saat what-if berubah. Tombol "Setel ulang simulasi" |
| Aksesibilitas | Perubahan match diumumkan lewat `aria-live="polite"` |

```
┌ Roadmap menuju Data Analyst ────────────────── Total ± 46 jam ┐
│ 1 Statistics     ░░▓▓ 22,4%  [ ] Tandai selesai   ┌─────────┐ │
│ 2 Python         ░░▓▓ 21,0%  [ ] Tandai selesai   │ What-if │ │
│ 3 SQL            ░░▓▓ 19,0%  [ ] Tandai selesai   │ 56,5%   │ │
│ 4 Business       ░░▓▓ 18,2%  [ ] Tandai selesai   │  ↓      │ │
│ 5 Domain         ░░▓▓ 14,0%  [ ] Tandai selesai   │ 74,8%   │ │
│                                                    └─────────┘ │
└───────────────────────────────────────────────────────────────┘
```

#### 4.5 Skill Passport `/passport` ⭐

| Aspek | Spesifikasi |
|---|---|
| Tujuan | Menghasilkan artefak yang bisa dibagikan dan menunjukkan kekuatan agentic (dokumen + email) |
| Kartu | Alias, role target, tanggal, radar mini, 3 kekuatan teratas, QR ke `/passport/verify/[id]`, disclaimer |
| Alur | Draft → Konfirmasi (dialog) → Membuat (progres nyata) → Selesai |
| Formulir | Email, kotak izin "Kirim Passport ke email ini" dan "Tampilkan halaman verifikasi publik" (keduanya nonaktif secara default) |
| Dialog konfirmasi | Menyebut dengan jelas: dokumen apa yang dibuat, email dikirim ke alamat mana, apa yang tampil di halaman publik |
| Progres | Langkah nyata: "Membuat dokumen" → "Mengirim email". Tidak memakai animasi palsu |
| Momen utama | Kartu muncul dan confetti satu kali setelah berhasil (menjawab aksi pengguna). Dimatikan saat reduced motion |
| State | Error per langkah dengan solusi ("Dokumen dibuat, email gagal. Coba kirim ulang") |
| Aksesibilitas | QR disertai tautan teks, dialog menjebak fokus dan bisa ditutup dengan Esc |

```
┌ Skill Passport ────────────────────────────────────────────┐
│ ┌──────────────────────────────┐   Email: [______________]  │
│ │ Skill Passport               │   [x] Kirim ke email ini   │
│ │ Alias · Data Analyst         │   [ ] Halaman verifikasi   │
│ │ 11 Okt 2026                  │       publik               │
│ │  (radar mini)   ▒▒▒▒ QR ▒▒▒▒ │   [Buat Passport]          │
│ │ Kekuatan: Excel, DataViz …   │                            │
│ │ Estimasi, bukan pengganti    │                            │
│ │ konselor karier              │                            │
│ └──────────────────────────────┘                            │
└────────────────────────────────────────────────────────────┘
```

### Tier 2 — fungsional

#### 4.6 Adaptive Quiz `/assessment`

| Aspek | Spesifikasi |
|---|---|
| Tujuan | Menyelesaikan 10 soal dengan fokus penuh |
| Layout | Satu soal per layar: kemajuan (n dari 10), teks soal, 4 opsi sebagai radio card, tombol "Jawab" |
| Timer | Opsional dan **default nonaktif**. Bila aktif, hanya penanda waktu, tidak memotong jawaban otomatis |
| Opsi tambahan | "Tidak yakin" dihitung sebagai jawaban salah dan dijelaskan di antarmuka |
| Keyboard | Tombol 1–4 memilih opsi, Enter menjawab |
| Data | Soal dari Flow 1 (tanpa kunci jawaban). Pengiriman semua jawaban ke Flow 2 setelah soal ke-10 |
| State | Progres tersimpan di localStorage. Refresh melanjutkan dari soal terakhir |
| Interaksi | Transisi antar soal 300 ms, umpan balik tekan pada opsi |
| Aksesibilitas | Opsi berupa `radiogroup`, teks soal diumumkan saat berganti, kemajuan terbaca |

#### 4.7 Quiz Review `/assessment/review`

| Aspek | Spesifikasi |
|---|---|
| Tujuan | Belajar dari jawaban setelah dinilai |
| Layout | Accordion per soal: jawaban user, jawaban benar, penjelasan, label skill dan tingkat kesulitan |
| Filter | Semua, salah saja, per skill |
| Data | Kunci jawaban dan penjelasan baru ditampilkan setelah penilaian selesai |
| State | Kosong bila belum ada asesmen |

#### 4.8 Skill Detail `/genome/[skill]`

| Aspek | Spesifikasi |
|---|---|
| Tujuan | Memahami satu skill secara mendalam |
| Isi | Penguasaan saat ini, hasil per soal (benar/salah, kesulitan), grafik garis riwayat penguasaan antar asesmen, sumber belajar untuk skill ini, penjelasan faktor |
| State | Bila baru satu asesmen, grafik garis diganti penjelasan "Ulangi asesmen untuk melihat perkembangan" |

#### 4.9 Job Matcher `/jobs`

| Aspek | Spesifikasi |
|---|---|
| Tujuan | Memperlihatkan kecocokan dengan role |
| Isi | Daftar role dengan match%. Hanya Data Analyst yang dihitung, lainnya "segera hadir" |
| Detail role | Bobot skill yang dibutuhkan, rentang gaji dan jumlah lowongan **dari agregat dataset dengan label sumber dan cakupan** ("benchmark global") |
| Perbandingan | Bar tersusun: kebutuhan vs genome per skill |
| Catatan | Tidak boleh menampilkan angka lowongan atau gaji tanpa sumber |

#### 4.10 Progress `/progress`

| Aspek | Spesifikasi |
|---|---|
| Tujuan | Menjaga kebiasaan belajar |
| Isi | Heatmap ala GitHub (hari belajar dan percobaan asesmen), streak, target mingguan, garis match% antar asesmen |
| Data | `users.history` + check-in lokal |
| Aksesibilitas | Heatmap punya ringkasan teks ("12 hari aktif dalam 8 minggu") |

### Tier 3 — pendukung

#### 4.11 Community `/community`

| Aspek | Spesifikasi |
|---|---|
| Isi | Leaderboard anonim (alias) dan feed pencapaian |
| Aturan | Ikut serta hanya dengan izin (opt-in). Data demo diberi label "contoh data" |
| Privasi | Tidak menampilkan email atau nama asli |

#### 4.12 Insights `/insights`

| Aspek | Spesifikasi |
|---|---|
| Isi | Grid artikel pendek hasil RAG dari koleksi `skills` |
| Aturan | Setiap artikel berlabel "Dibuat AI" dan mencantumkan sumber. Data demo diberi label "contoh" |

#### 4.13 Settings `/settings`

| Aspek | Spesifikasi |
|---|---|
| Profil | Alias, bahasa |
| Aksesibilitas | Tanpa timer, kurangi animasi, matikan 3D |
| Panel Responsible AI | Cara kerja singkat, hasil uji bias, keterbatasan, daftar banding |
| Data saya | "Ekspor data (JSON)" dan "Hapus data saya" (dengan dialog konfirmasi) |
| Izin | Kirim email, halaman publik, komunitas. Semua default nonaktif |

---

## 5. Component Library

### 5.1 Struktur folder

```
app/                     rute (lihat bagian 3.1) + api/engine/[tool], api/me
components/
  ui/                    primitif shadcn (Base UI)
  atoms/  molecules/  organisms/
lib/    genome-core.ts  engine-local.ts  schemas.ts  motion.ts
store/  assessment.ts  genome.ts  prefs.ts
data/   questions.json  skills.json  galaxy-layout.json
```

### 5.2 Atoms

| Komponen | Props utama | Catatan |
|---|---|---|
| `Button` | `variant` (primary, quiet, danger), `size`, `loading` | Primary memakai `#4F46E5` dengan teks putih |
| `Badge` | `tone`, `icon` | Status dan kelompok skill |
| `Input` | `label`, `error`, `hint` | Label selalu terlihat |
| `Switch` | `checked`, `label`, `description` | Untuk izin dan preferensi |
| `RadioCard` | `value`, `label`, `shortcut` | Opsi soal dan pilihan role |
| `Skeleton` | `shape` | Status loading |
| `Tooltip` | `content` | Bukan satu-satunya sumber informasi penting |
| `Kbd` | `children` | Petunjuk pintasan 1–4 |
| `Metric` | `value`, `label`, `unit` | Angka besar bergaya mono |

### 5.3 Molecules

| Komponen | Isi | Catatan |
|---|---|---|
| `SkillChip` | Ikon + nama + level | Warna kelompok plus ikon |
| `ScoreBar` | Bar penguasaan dengan penanda target 80% | Teks nilai selalu tampil |
| `StatCard` | `Metric` + label + selisih | Kartu angka |
| `QuestionOption` | `RadioCard` + status benar/salah (di review) | Tidak mengandalkan warna saja |
| `StepperDots` | Langkah n dari m | Dibacakan pembaca layar |
| `ConsentRow` | Switch + penjelasan konsekuensi | Default nonaktif |
| `ExplainPopover` | Tombol "Kenapa skor ini?" + faktor | Memakai drawer di mobile |
| `ResourceCard` | Judul, jam, tautan | Tautan hanya dari data DB |
| `EmptyState` | Ikon, judul, ajakan aksi | Menjelaskan langkah berikutnya |
| `Toast` | Hasil aksi | Memakai kata yang sama dengan tombol ("Passport dibuat") |

### 5.4 Organisms

| Komponen | Isi | Data |
|---|---|---|
| `RadarGenome` | Radar 8 skill + tabel tersembunyi | `mastery` |
| `GenomeGalaxy` | Galaksi 3D, dimuat dinamis | `mastery`, `galaxy-layout.json` |
| `RoadmapTimeline` | 5 langkah + kotak centang | Hasil Flow 3 |
| `WhatIfPanel` | Match sebelum/sesudah | `genome-core.ts` |
| `PassportCard` | Kartu + QR | Genome + `passport_id` |
| `QuizShell` | Kemajuan, soal, opsi, timer opsional | Store `assessment` |
| `ReviewAccordion` | Tinjauan per soal | Hasil Flow 2 + seed soal |
| `ActivityHeatmap` | Grid 7 x N minggu | `history` |
| `ResponsibleAIPanel` | Cara kerja, uji bias, banding, data | Statis + API `/api/me` |
| `AppNav` | Top bar dan bottom tab | Rute |

### 5.5 Pemetaan shadcn/ui

`button`, `card`, `dialog`, `sheet` (drawer), `tabs`, `accordion`, `tooltip`, `switch`, `progress`, `skeleton`, `sonner` (toast), `form`, `radio-group`, `badge`. Komponen lain dibangun di atas primitif ini.

---

## 6. Data Visualization

### 6.1 Ringkasan

| Visual | Library | Dipakai di | Alternatif aksesibel |
|---|---|---|---|
| Radar | Recharts | Genome, Landing, Passport mini | Tabel data tersembunyi |
| Garis | Recharts | Skill Detail, Progress | Ringkasan teks + tabel |
| Batang | Recharts | Roadmap (share%), Jobs (kebutuhan vs genome) | Nilai di label |
| Heatmap | Grid CSS | Progress | Ringkasan teks |
| Galaksi 3D | R3F + drei | Genome | Radar dan tabel |
| Kartu statistik | Komponen sendiri | Genome, Progress | Teks |

### 6.2 Radar

| Aspek | Spesifikasi |
|---|---|
| Sumbu | 8 skill, skala 0–100% |
| Seri | Genome user (garis dan isi indigo transparan) dan target role (garis putus-putus cyan, 80% x importance) |
| Interaksi | Hover/fokus titik menampilkan nilai dan "Kenapa skor ini?" |
| Label | Selalu terlihat, tidak bergantung pada hover |

### 6.3 Galaksi 3D

Posisi node dihitung offline: proyeksi PCA matriks embedding skill ke 3 dimensi (menjelaskan ± 89% varians), dinormalisasi ke rentang ±2 dan disimpan di `data/galaxy-layout.json`.

| Skill | x | y | z |
|---|---|---|---|
| SQL | 1,75 | -0,45 | -0,86 |
| Python | 2,00 | 0,11 | -0,30 |
| Statistics | 0,51 | -0,65 | 1,34 |
| Excel | 0,64 | 0,44 | 0,33 |
| DataViz | -0,30 | 1,61 | 0,26 |
| BusinessAcumen | -1,47 | -0,61 | -0,07 |
| Communication | -1,90 | 0,49 | -0,53 |
| DomainKnowledge | -1,22 | -0,93 | -0,17 |

| Encoding | Data |
|---|---|
| Ukuran node | Importance untuk role target |
| Kecerahan dan emisi | Penguasaan (mastery) |
| Warna | Kelompok skill (bagian 2.7) |
| Garis antar node | Kemiripan cosine antar vektor skill ≥ 0,80 (5 garis): BusinessAcumen–DomainKnowledge 0,98, SQL–Python 0,95, BusinessAcumen–Communication 0,82, Python–Excel 0,81, Excel–DataViz 0,81 |
| Label | Selalu tampil untuk node yang sedang difokus, nama lain tampil saat kamera dekat |

| Aspek | Spesifikasi |
|---|---|
| Kontrol | Orbit pelan, zoom terbatas, tombol "Setel ulang kamera" |
| Sorotan | Memilih skill di daftar menyorot node, dan sebaliknya |
| Performa | Dimuat dinamis, anggaran ≤ 150 draw call, DPR dibatasi 1,5, berhenti merender saat tab tersembunyi |
| Fallback | Reduced motion, perangkat lemah, atau pengguna mematikan 3D: tampilkan radar |
| Aksesibilitas | Node bisa difokus dengan keyboard, tabel alternatif tersedia |

### 6.4 Garis dan batang

| Visual | Spesifikasi |
|---|---|
| Garis penguasaan | Sumbu X waktu asesmen, Y 0–100%, titik bermarker, garis target 80% putus-putus |
| Batang share% | Horizontal, urut prioritas, label nilai di ujung batang |
| Batang kebutuhan vs genome | Dua batang per skill (target role dan user) dengan pola berbeda, tidak hanya warna |

### 6.5 Heatmap

Grid 7 baris (hari) x 12 kolom (minggu). Lima level intensitas (0–4) memakai skala indigo, dengan pola isi berbeda untuk kebutuhan buta warna. Tiap sel punya `aria-label` ("Selasa 6 Okt: 2 aktivitas").

### 6.6 Kartu statistik

Angka bergaya mono, label di bawah, selisih terhadap asesmen sebelumnya (naik/turun dengan ikon dan teks, bukan hanya warna). Angka yang bukan hasil perhitungan sistem tidak boleh ditampilkan.

---

## 7. Antarmuka Responsible AI

| Elemen | Spesifikasi |
|---|---|
| "Kenapa skor ini?" | Drawer berisi faktor per skill: jawaban per soal, kesulitan soal, gap terhadap target, importance, dan `share%` kontribusi. Tombol "Ajukan banding" |
| Banding | Formulir singkat (skill dan catatan). Setelah dikirim, skill ditandai "ditinjau" |
| Disclaimer | Muncul di hasil, Passport, dan Settings: "Hasil ini estimasi dari 10 soal dan bukan pengganti konselor karier." |
| Keterbatasan | Daftar singkat: parameter soal belum dikalibrasi, data pasar global, genome adalah snapshot |
| Izin | Setiap izin berupa switch dengan penjelasan konsekuensi, default nonaktif |
| Data | "Ekspor data (JSON)" mengunduh dokumen user. "Hapus data saya" meminta konfirmasi lalu menampilkan hasilnya |
| Hasil uji bias | Ringkasan: "20 profil diuji dengan variasi nama, gender, kampus: selisih hasil 0" |

---

## 8. Responsive Breakpoints

| Breakpoint | Lebar | Penyesuaian |
|---|---|---|
| Base | < 640 px | Satu kolom, bottom tab, radar saja (galaksi lewat tab), tombol penuh lebar |
| `sm` | ≥ 640 px | Margin lebih lega, kartu dua kolom pada daftar |
| `md` | ≥ 768 px | Roadmap dan What-if berdampingan |
| `lg` | ≥ 1024 px | Top bar, radar dan galaksi berdampingan |
| `xl` | ≥ 1280 px | Kontainer maksimal 1200 px |
| `2xl` | ≥ 1536 px | Kontainer tetap 1200 px, ruang kosong dibiarkan |

| Aturan | Nilai |
|---|---|
| Target sentuh minimal | 44 x 44 px |
| Jarak antar target | ≥ 8 px |
| Orientasi | Portrait dan landscape didukung |
| Koneksi lambat | Galaksi dan heliks dimuat setelah konten utama, ada opsi "Matikan 3D" |

---

## 9. Aksesibilitas (target WCAG 2.2 AA)

| Area | Kriteria | Implementasi |
|---|---|---|
| Kontras | Teks ≥ 4,5 : 1, elemen UI ≥ 3 : 1 | Token di bagian 2.2, teks indigo kecil memakai `#A5B4FC` |
| Keyboard | Semua fungsi bisa dioperasikan | Urutan fokus logis, tidak ada jebakan fokus selain dialog |
| Fokus terlihat | Indikator jelas | Cincin 2 px `--primary-soft` dengan offset |
| Pembaca layar | Nama, peran, status | Label pada kontrol, `aria-live` untuk hasil what-if dan progres |
| Grafik | Ada padanan teks | Tabel data tersembunyi per grafik |
| Warna | Tidak menjadi satu-satunya penanda | Ikon, label, pola |
| Gerakan | Menghormati preferensi | `prefers-reduced-motion`, tombol "Kurangi animasi" |
| Timer | Tidak memaksa | Default nonaktif, tidak memotong jawaban |
| Waktu baca | Tidak terburu-buru | Tidak ada konten yang hilang otomatis |
| Bahasa | Dinyatakan | `lang="id"` atau `"en"` sesuai pilihan |
| Target sentuh | ≥ 44 px | Bagian 8 |
| Formulir | Label dan error jelas | Error menjelaskan masalah dan cara memperbaiki |
| Dialog | Fokus terkunci dan kembali | Esc menutup dialog |
| Low-bandwidth | Fungsi inti tanpa 3D | Mode tanpa 3D dan gambar ringan |

---

## 10. Microcopy

### 10.1 Prinsip

Kalimat biasa, kata kerja aktif, nama yang sama dari tombol sampai notifikasi, error menjelaskan masalah dan cara memperbaiki tanpa meminta maaf, kondisi kosong mengajak bertindak.

### 10.2 Contoh

| Konteks | Teks |
|---|---|
| CTA utama | Mulai asesmen |
| Tombol Passport | Buat Passport |
| Notifikasi sukses | Passport dibuat |
| Kosong (genome) | Ikuti asesmen untuk melihat genome-mu. |
| Kosong (roadmap) | Selesaikan asesmen dulu agar langkah belajar bisa disusun. |
| Error engine | Hasil belum bisa dimuat karena layanan tidak merespons. Muat ulang atau coba beberapa saat lagi. |
| Error email | Dokumen sudah dibuat, tetapi email belum terkirim. Periksa alamat email lalu kirim ulang. |
| Konfirmasi hapus | Semua data asesmenmu akan dihapus dan tidak bisa dikembalikan. Hapus data saya? |
| Disclaimer | Hasil ini estimasi dari 10 soal dan bukan pengganti konselor karier. |
| Role belum tersedia | Segera hadir. Saat ini asesmen tersedia untuk Data Analyst. |

---

## 11. Handoff dan Anggaran Kualitas

### 11.1 Anggaran performa

| Metrik | Batas |
|---|---|
| LCP landing | < 2,5 detik |
| Bundle awal | < 250 KB gzip (tanpa Three.js) |
| 3D | Dimuat dinamis, ≤ 150 draw call, DPR ≤ 1,5 |
| Interaksi what-if | < 50 ms |
| CLS | < 0,1 |

### 11.2 Checklist QA visual

| Cek | Cara |
|---|---|
| Kontras dan fokus | Alat kontras dan navigasi keyboard penuh |
| Reduced motion | Aktifkan preferensi sistem, pastikan 3D diganti radar |
| Mobile 360 px | Tidak ada scroll horizontal, target ≥ 44 px |
| State lengkap | Loading, kosong, error untuk setiap halaman Tier 1 |
| Konsistensi istilah | Nama aksi sama dari tombol sampai notifikasi |
| Angka bersumber | Tidak ada angka lowongan/gaji tanpa label sumber |

### 11.3 Batas pemangkasan bila waktu mepet `[REKOMENDASI]`

| Urutan pangkas | Pengganti |
|---|---|
| Galaksi 3D | Radar saja (tetap lolos semua kriteria) |
| Heliks 3D di landing | SVG statis |
| Confetti | Animasi kartu sederhana |
| Tier 3 (Community, Insights) | Halaman statis berlabel "contoh data" |
| Tier 2 selain Assessment | Halaman statis dengan data contoh |

Tier 1 dan Assessment tidak dipangkas. Rinciannya ada di [Task.md](./Task.md).