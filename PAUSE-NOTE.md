# PAUSE-NOTE — Firebase Hybrid AI Hackathon ("AI Research Desk")

**Status: DI-PAUSE oleh Cipoz, 12 Nov 2026 ~11:30 WIB** ("Gas WorldIsFlat sekarang,
drop yang lain dulu" — koordinator mem-pause 11 program termasuk Firebase).
Pekerjaan dihentikan di tengah pengujian E2E. **Jangan lanjutkan sendiri —
tunggu sinyal lanjut dari Cipoz/parent.**

Terakhir dikerjakan: 12 Nov 2026, 04:18–04:35 WIB (sesi build).

---

## 1. Apa yang sudah jadi

Aplikasi web **"AI Research Desk"** — user menempel catatan/riset, AI meringkas
(<250 kata), mengambil key takeaways, dan menjawab pertanyaan yang di-grounding
hanya pada catatan itu (dengan sitasi nomor catatan; bila catatan tidak
mencakup jawaban, model bilang begitu, bukan mengarang). Dibangun penuh selama
submission period (12 Nov 2026).

**Integrasi Firebase AI Logic — KODE NYATA, bukan mock** (`src/firebase.js`):
- `getAI(app, { backend: new GoogleAIBackend() })`, `getGenerativeModel(ai,
  { mode: InferenceMode.PREFER_ON_DEVICE, inCloudParams: { model:
  "gemini-2.5-flash-lite" } })`, `initializeDeviceModel()` (dipanggil dari
  klik user, sesuai syarat Prompt API), `generateContent()` /
  `generateContentStream()`.
- Empat mode inference di UI: Auto (PREFER_ON_DEVICE), On-device only,
  Cloud first, Cloud only + route badge per jawaban.
- App Check: kode reCAPTCHA v3 + debug provider (token debug dari console).
- Desain single-turn (on-device hanya mendukung single-turn text, bukan chat).
- **Terverifikasi terhadap SDK terpasang firebase 13.3.0**: semua export ada,
  model object berhasil di-construct (`generateContent`,
  `generateContentStream`, `initializeDeviceModel` = function).

**Dokumen (Bahasa Inggris, sesuai aturan submission):** README.md (dengan
tabel jujur "real vs demo"), SUBMISSION.md (draf lengkap Devpost + checklist
pre-submit), DEPLOY.md (langkah deploy Firebase Hosting), LICENSE Apache-2.0
(lisensi yang disyaratkan hackathon — Apache preferred).

**Aturan resmi dicek ulang 12 Nov 2026:** Official Rules SUDAH TERBIT di
`firebasehybridaihackathon.devpost.com/rules` (sebelumnya "not yet available").
Tutup 30 Nov 2026 14:00 PT = **1 Des 2026 05:00 WIB**. Hadiah $30.000
(Grand $10.000, runner-up $7.000/$4.000, $3.000 per platform). Indonesia TIDAK
masuk daftar residen yang dikecualikan. Syarat kunci: semua inference HARUS
lewat Firebase AI Logic; App Check wajib (debug token diterima); repo publik
+ lisensi open-source; video demo <3 mnt di YouTube.

## 2. Daftar file (semua di `~/workspace/firebase-hybrid-ai/`)

| File | Isi / status |
|---|---|
| `index.html` | UI app (notes + ask panel + route badge) |
| `src/main.js` | Wiring UI |
| `src/firebase.js` | **Jalur produksi: Firebase AI Logic (nyata)** |
| `src/ai.js` | Router provider (Firebase default; demo hanya bila flag on) |
| `src/demo.js` | **Mode demo lokal Ollama — HARUS DIHAPUS sebelum submit** (lihat §4) |
| `src/notes.js` | Store catatan (localStorage) + 2 sample notes |
| `src/style.css` | Styling |
| `vite.config.js` | Vite + proxy `/ollama` (demo only) + `host: 127.0.0.1` (fix bug listen ::1) |
| `package.json` / `package-lock.json` | firebase 13.3.0, vite 8.3.8, script `dev/build/preview/test` |
| `.env` / `.env.example` | `.env` lokal: Firebase config KOSONG + `VITE_DEMO_MODE=ollama` (demo on). `.env` di-`.gitignore`. |
| `.gitignore` | node_modules/, dist/, .env |
| `test/e2e-demo.test.mjs` | Test E2E mode demo (`npm test`) |
| `README.md` / `SUBMISSION.md` / `DEPLOY.md` / `LICENSE` | Dokumen + lisensi Apache-2.0 |
| `dist/` | Hasil `vite build` terakhir (boleh dihapus/regenerate) |
| `node_modules/` | Sudah terinstal (npm install selesai, 150 packages) |

**Tidak ada yang dibuat di luar folder ini.** Tidak ada akun/login, tidak ada
project Firebase, tidak ada repo GitHub, tidak ada pendaftaran/submit Devpost
(sesuai aturan tugas).

## 3. Bukti test (yang lolos)

`npm test` terakhir (12 Nov ~04:29 WIB): **12 dari 14 cek PASS**
- `vite build` exit 0; bundle `dist/` terhasilkan.
- Bundle terbukti berisi kode Firebase AI Logic: `getAI`, `prefer_on_device`,
  `initializeDeviceModel`, `gemini-2.5-flash-lite`.
- Dev server melayani `index.html` ("AI Research Desk", memuat `/src/main.js`).
- Ollama terjangkau via proxy `/ollama`; model `qwen2.5:3b` terinstal.
- Dua bug ditemukan + diperbaiki saat testing: (1) Vite 8 listen di `::1`
  saja sehingga `127.0.0.1` ditolak — diperbaiki dengan `host: "127.0.0.1"`;
  (2) `server.kill()` via npx meninggalkan proses vite yatim — test kini
  spawn binary vite langsung.

## 4. Yang BELUM selesai / gagal saat pause (jujur)

1. **Test E2E mode demo BELUM hijau penuh (12/14).** Cek terakhir — generate
   ringkasan via Ollama — **crash setelah ~5 menit** dengan Node
   `HeadersTimeoutError` (undici default headers-timeout 300 dtk): Ollama
   qwen2.5:3b sangat lambat di VM yang sedang padat (load ~18) dan respons
   non-streaming tidak kunjung mengirim header. Bukan bug aplikasi; test
   perlu perbaikan saat lanjut: pakai `stream: true` + timeout eksplisit yang
   panjang, atau batasi `num_predict` (mis. 150 token) di request generate.
   Bukti: `llama-server` terpantau aktif meng-generate saat crash.
2. **Jalur Firebase (cloud) BELUM PERNAH dijalankan end-to-end** — butuh
   Firebase project + config (langkah Cipoz, lihat §5). Kode terverifikasi
   secara konstruksi (import + construct), bukan via panggilan live.
3. **Gemini Nano on-device BELUM PERNAH dijalankan** — butuh Chrome 139+
   desktop + flag Prompt API + download model. Kode path nyata, run belum
   terbukti.
4. **Mode demo Ollama MASIH AKTIF dan MASIH ADA di repo** (`src/demo.js`,
   proxy `/ollama`, `VITE_DEMO_MODE=ollama`). Ini melanggar aturan hackathon
   ("all inference must go through Firebase AI Logic") **bila ikut terkirim**.
   Penghapusan wajib sebelum submit — checklist ada di README §"READ FIRST"
   dan SUBMISSION.md. Jangan deploy/submit dalam keadaan ini.
5. **Belum ada:** repo GitHub publik, deploy Firebase Hosting, video demo,
   pendaftaran/submit Devpost (semuanya langkah Cipoz / pasca-Firebase).

## 5. Blocker (langkah yang hanya Cipoz bisa lakukan)

1. **Buat Firebase project** di console.firebase.google.com + jalankan guided
   workflow AI Logic (pilih Gemini Developer API, free tier) + daftarkan Web
   app → isi `VITE_FIREBASE_*` di `.env` (+ `VITE_RECAPTCHA_SITE_KEY` untuk
   App Check; debug token untuk localhost).
2. **Buat repo GitHub publik** (agen dilarang membuat repo; login gh VM adalah
   taufik52 — repo lokal saja selama ini) + push folder ini.
3. **Rekam video demo** (<3 mnt, Bahasa Inggris, tampilkan app jalan di
   Chrome incl. route badge) → upload YouTube publik.
4. **Daftar + submit di Devpost** sebelum **1 Des 2026 05:00 WIB**.

## 6. Langkah berikut saat dilanjutkan (berurutan)

1. Perbaiki test demo: streaming + `num_predict` kecil + timeout panjang;
   jalankan `npm test` sampai **14/14 PASS** (bukti UI end-to-end).
2. Setelah Cipoz menyelesaikan blocker #1: matikan demo mode, verifikasi live
   jalur Firebase cloud (Summarize + Ask) di Chrome, catat hasil di
   TEST-REPORT.md (file ini belum dibuat — buat saat verifikasi live).
3. Verifikasi on-device Gemini Nano di Chrome 139+ (download model via tombol
   "Prepare on-device model", cek route badge on-device).
4. Hapus total mode demo (file + proxy + env) → `npm run build` bersih
   (`grep -r ollama dist/ src/` kosong).
5. Deploy Firebase Hosting (ikuti DEPLOY.md) → uji URL hosting di browser
   bersih.
6. Cipoz: repo publik → video demo → isi form Devpost dari SUBMISSION.md →
   submit sebelum tenggat.

## 7. Keputusan yang butuh Cipoz

- **Lanjut atau drop?** Program ini di-pause karena Cipoz memerintahkan gas
  WorldIsFlat sekarang. Bila WorldIsFlat makan waktu, tenggat Firebase
  (1 Des 05:00 WIB) tetap jauh — tapi keputusan lanjut/tidak tetap di Cipoz.
- **Buat Firebase project + isi `.env`** (blocker #1) — tidak bisa diwakilkan.
- **Buat repo GitHub publik + video demo + submit Devpost** — langkah tangan
  Cipoz.
- **Nama project Firebase / nama repo** bila ada preferensi (default yang
  dipakai di dokumen: `ai-research-desk`).

## 8. Integritas file saat pause

- Tidak ada server dev/preview yang masih jalan (dicek: port 5173/4173/5199
  kosong).
- Semua file di §2 utuh; `test/e2e-demo.test.mjs` lolos `node --check`.
- Tidak ada file setengah-tulis: file terakhir yang ditulis adalah dokumen
  (README/SUBMISSION/DEPLOY) dan perbaikan test — semuanya selesai ditulis
  sebelum perintah pause.
- Tidak ada proses latar yang dibiarkan berjalan untuk program ini.

---

## 9. RESUME 12 Nov 2026 ~05:20–05:45 WIB (agen program, atas perintah "Gas semuanya yang bisa jalan")

Sesi ini mengerjakan item (a) dan (c) dari §4/§6. Status pause oleh Cipoz
tetap berlaku untuk hal lain; yang dikerjakan hanya yang diperintahkan
parent di sesi resume ini.

### (a) Crash generate demo ~5 mnt — DIAGNOSIS + PERBAIKAN TERVERIFIKASI ✅

- **Penyebab pasti:** test lama pakai generate NON-streaming dengan jumlah
  token TAK TERBATAS ke qwen2.5:3b. Di VM 1,5 CPU ini model jalan
  ~0,3–1,5 token/dtk saat padat, jadi ringkasan panjang butuh >300 dtk —
  sementara undici (Node fetch) baru mengirim header SETELAH seluruh
  respons non-streaming siap → kena default headers-timeout 300 dtk
  (`HeadersTimeoutError`). Bukan bug aplikasi: `llama-server` terpantau
  aktif meng-generate saat crash.
- **Perbaikan:** `stream: true` (header datang bersama token pertama) +
  `options: { num_predict: 150 }` (batasi total kerja) + abort timeout
  eksplisit 900 dtk — diterapkan di `test/e2e-demo.test.mjs`.
- **Bukti ukur 12 Nov 2026:**
  - Header streaming tiba dalam **14,2 dtk** (VM tenang, load ~1) dan
    **115,8 dtk** (VM padat, load ~25, antre di belakang generate lain) —
    keduanya jauh di bawah batas 300 dtk.
  - Probe 40 token selesai **54,8 dtk** dengan ringkasan benar.
  - Di bawah kontensi ekstrem (load 25) stream 150 token TIDAK selesai
    dalam 600 dtk — total waktu tetap tergantung beban VM; yang hilang
    adalah crash-nya, bukan lambatnya.
  - **`npm test` segar 12 Nov ~05:36 WIB: 14/14 PASS, ALL CHECKS PASSED.**
    Generate demo: ringkasan 282 karakter dalam 80,6 dtk (chunk pertama
    1,1 dtk), menyebut hybrid/on-device + hadiah $30.000 / tenggat 30 Nov.
    Log: `/tmp/firebase-npm-test.log` (VM-local).

### (c) Mode demo Ollama DIHAPUS TOTAL dari repo ✅

- **Dihapus:** `src/demo.js` (file), cabang demo di `src/ai.js`
  (import + `DEMO_MODE` + cabang `providerInfo`/`runTask` + export
  `demoHealth`), referensi demo di `src/main.js` (import, banner demo,
  pesan error demo, guard `prepare-device`, saran `VITE_DEMO_MODE` di
  banner setup), proxy `/ollama` di `vite.config.js` (server + preview),
  elemen `#demo-banner` di `index.html`, style `.badge.demo` /
  `.banner.demo` di `src/style.css`, `VITE_DEMO_MODE`/`VITE_DEMO_MODEL`
  di `.env` + `.env.example`, dan seluruh instruksi demo di README.md,
  SUBMISSION.md, DEPLOY.md (checklist demo-removal di SUBMISSION.md
  dicentang `[x]`).
- **Diganti:** test lama `test/e2e-demo.test.mjs` → `test/e2e.test.mjs`
  (smoke test submission-safe: build + isi bundle Firebase + TIDAK ADA
  jalur non-Firebase di bundle + kebersihan source tree + dev server
  melayani app Firebase-only). `package.json` script `test` diperbarui.
- **Verifikasi pasca-penghapusan 12 Nov ~05:40 WIB:**
  - `npm run build` exit 0 (570 ms, 20 modules).
  - `grep -ri ollama dist/ src/` → bersih (kosong).
  - `grep` seluruh repo (di luar PAUSE-NOTE.md, TEST-REPORT.md, dan file
    test itu sendiri yang butuh string-nya untuk assertion): TIDAK ADA
    lagi referensi `ollama` / `VITE_DEMO_MODE` / `DEMO_MODE` / `demo.js` /
    `demoGenerate` / `demoHealth`.
  - **`npm test` segar: 17/17 PASS, ALL CHECKS PASSED.** Log:
    `/tmp/firebase-npm-test-postremoval.log` (VM-local).
  - Tidak ada server dev/preview liar yang tersisa (port 5199 bebas).
- **File baru:** `TEST-REPORT.md` (bukti test lengkap + batasan jujur),
  `CIPOZ-STEPS.md` (instruksi Bahasa Indonesia bernomor untuk Cipoz:
  buat Firebase project + isi `.env`, repo GitHub, deploy Hosting,
  video demo, submit Devpost).
- **Sisa kata "demo" di repo:** hanya catatan historis ("demo mode
  removed…") di PAUSE-NOTE.md / TEST-REPORT.md / komentar `src/ai.js`,
  field `demo video` (deliverable video) di sample note + SUBMISSION.md,
  dan string assertion di `test/e2e.test.mjs`. Tidak ada lagi kode,
  instruksi, atau jalur yang bisa mengaktifkan mode demo.

### Blocker tersisa (tidak berubah — hanya Cipoz bisa)

1. Buat Firebase project + isi `.env` (lihat `CIPOZ-STEPS.md` Bagian A).
2. Repo GitHub publik + deploy Hosting + video demo + submit Devpost
   sebelum **1 Des 2026 05:00 WIB** (lihat `CIPOZ-STEPS.md` Bagian B–E).
3. Jalur cloud Firebase + Gemini Nano on-device BELUM PERNAH jalan live —
   baru bisa diverifikasi setelah blocker #1 selesai.
