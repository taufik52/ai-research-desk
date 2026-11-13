# CIPOZ-STEPS.md — Langkah yang hanya Cipoz bisa lakukan (Firebase Hybrid AI Hackathon)

> Bahasa Indonesia. Semua langkah di bawah ini butuh akun/login Cipoz
> (Google/Firebase, GitHub, YouTube, Devpost). Agen TIDAK boleh
> melakukannya. Aplikasi "AI Research Desk" sudah siap di
> `~/workspace/firebase-hybrid-ai/` — mode demo sudah DIHAPUS 12 Nov 2026,
> build + test lolos 17/17. Yang tersisa hanyalah langkah-langkah ini.
>
> **Tenggat submit: 1 Des 2026 05:00 WIB** (30 Nov 2026 14:00 PT).
> **Biaya: $0** — semua langkah di bawah ini gratis (Gemini Developer API
> free tier, tanpa billing; Firebase Hosting free tier; Devpost gratis).

---

## Bagian A — Buat Firebase project + isi `.env` (paling penting, ~15 menit)

1. Buka https://console.firebase.google.com/ di browser Cipoz, login
   dengan akun Google Cipoz.
2. Klik **Add project** (atau **Create a project**). Nama project bebas,
   mis. `ai-research-desk`. Google Analytics **tidak perlu** dicentang.
   Klik Create, tunggu sampai selesai.
3. Di dalam project, buka menu **AI Services → AI Logic → Get started**
   (di console kiri, bagian "Build"). Pilih provider
   **Gemini Developer API** (free tier, no billing), selesaikan guided
   workflow sampai selesai. Langkah ini sekaligus mengaktifkan penegakan
   **App Check** untuk AI Logic.
4. Daftarkan Web app: buka **Project settings** (ikon gerigi) →
   **Your apps** → klik ikon Web (`</>`). Nickname bebas, mis.
   `ai-research-desk-web`. JANGAN centang "Firebase Hosting" dulu di sini
   (hosting diurus di Bagian C). Klik Register, lalu salin blok
   **SDK setup and configuration** (firebaseConfig): `apiKey`,
   `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`,
   `appId`.
5. Di laptop/VM, buka file `~/workspace/firebase-hybrid-ai/.env`
   (atau minta agen mengisinya dari nilai yang Cipoz tempel), isi:
   - `VITE_FIREBASE_API_KEY=` ← apiKey
   - `VITE_FIREBASE_AUTH_DOMAIN=` ← authDomain
   - `VITE_FIREBASE_PROJECT_ID=` ← projectId
   - `VITE_FIREBASE_STORAGE_BUCKET=` ← storageBucket
   - `VITE_FIREBASE_MESSAGING_SENDER_ID=` ← messagingSenderId
   - `VITE_FIREBASE_APP_ID=` ← appId
   - `VITE_CLOUD_MODEL=gemini-2.5-flash-lite` (sudah terisi, jangan diubah)
   - `VITE_APPCHECK_DEBUG=true` (biarkan true untuk testing localhost)
   
   ⚠️ JANGAN pernah kirim isi `.env` ke siapa pun dan jangan commit —
   file ini sudah di-`.gitignore`.
6. **App Check — reCAPTCHA v3 (untuk production):** di console, buka
   **App Check** → tab **Apps** → pilih web app → **Register** →
   pilih provider **reCAPTCHA v3**, lalu masukkan site key yang Cipoz
   buat di https://www.google.com/recaptcha/admin (pilih tipe v3,
   daftarkan domain hosting nanti, mis. `ai-research-desk.web.app`).
   Tempel site key ke `.env` sebagai `VITE_RECAPTCHA_SITE_KEY=`.
   (Untuk testing localhost saja, debug provider di langkah 7 sudah cukup;
   reCAPTCHA wajib sebelum submit/deploy production.)
7. **App Check — debug token (untuk localhost):** dengan
   `VITE_APPCHECK_DEBUG=true` di `.env`, jalankan `npm run dev` di folder
   proyek, buka http://localhost:5173, buka browser console — akan muncul
   token debug App Check. Salin token itu, daftarkan di console:
   **App Check → Apps → Manage debug tokens → Add debug token**.
   (Debug token diterima untuk submission hackathon.)
8. **Verifikasi jalur cloud jalan:** di browser yang sama, klik
   **Summarize notes** (sample notes sudah ada). Jawaban harus muncul
   dengan route badge `cloud (gemini-2.5-flash-lite)`. Lalu klik **Ask**,
   tanya mis. "When does the hackathon close?" — jawaban harus mengutip
   Note 2. Kalau muncul error App Check, ulangi langkah 7. Beri tahu agen
   hasilnya supaya dicatat di TEST-REPORT.md.
9. **Verifikasi on-device Gemini Nano (opsional tapi sangat disarankan
   untuk video):** pakai Chrome desktop 139+. Buka
   `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` → pilih
   **Enabled** → restart Chrome. Di app, klik **Prepare on-device
   model**, tunggu download selesai, lalu klik Summarize lagi — route
   badge harus menunjukkan on-device (Gemini Nano). Kalau perangkat
   Cipoz tidak mendukung, catat itu dengan jujur di deskripsi Devpost
   (bukan alasan gagal submit).

## Bagian B — Repo GitHub publik (~10 menit)

10. Buka https://github.com/new di browser Cipoz (login akun GitHub
    Cipoz). Repository name: `ai-research-desk`. Pilih **Public**.
    JANGAN centang "Add a README" / ".gitignore" / "license" (semuanya
    sudah ada di folder lokal).
11. Push folder lokal ke repo baru itu (minta agen menjalankan
    perintahnya — agen sudah punya akses git lokal; yang Cipoz lakukan
    hanya membuat repo kosong di atas):
    `git init && git add . && git commit -m "AI Research Desk — #BuildHybridAI 2026" && git remote add origin <URL repo> && git push -u origin main`
12. Cek di GitHub: file `LICENSE` terlihat, README tampil, dan pastikan
    **tidak ada file `.env`** di repo (cek tab file — kalau ada,
    hapus dari git dan beri tahu agen).

## Bagian C — Deploy Firebase Hosting (~10 menit)

13. Di terminal: `npm install -g firebase-tools`, lalu
    `firebase login` (browser akan meminta login Google — pakai akun
    yang sama dengan project Firebase).
14. Di folder proyek: `firebase init hosting` → pilih project dari
    Bagian A → public directory: `dist` → single-page app: **Yes** →
    JANGAN overwrite `index.html`.
15. `npm run build && firebase deploy --only hosting`. Catat URL yang
    dicetak, mis. `https://ai-research-desk.web.app`. Uji URL itu di
    jendela Chrome bersih (mode Incognito): Summarize harus jalan.
16. Tempel URL hosting ke `SUBMISSION.md` (bagian Links) dan ke form
    Devpost nanti.

## Bagian D — Video demo (< 3 menit, Bahasa Inggris)

17. Rekam layar (mis. OBS / perekam bawaan) dengan alur ini (total
    < 3 menit, narasi Bahasa Inggris):
    - 0:00–0:20 — buka URL hosting, tunjukkan 2 sample notes.
    - 0:20–1:00 — klik **Summarize notes**, jawaban mengalir (streaming),
      tunjukkan route badge.
    - 1:00–1:40 — ganti mode inference (mis. On-device only), klik
      **Ask** "When does the hackathon close?", tunjukkan sitasi Note 2.
    - 1:40–2:30 — klik **Prepare on-device model** (atau tunjukkan status
      Gemini Nano) + tambah 1 note sendiri lalu summarize lagi.
    - 2:30–2:55 — penutup: gratis, tanpa akun, semua inference lewat
      Firebase AI Logic.
18. Upload ke YouTube sebagai **Public** (bukan Unlisted), judul mis.
    "AI Research Desk — #BuildHybridAI 2026". Salin link videonya.

## Bagian E — Submit Devpost (sebelum 1 Des 2026 05:00 WIB)

19. Buka https://firebasehybridaihackathon.devpost.com/ → login →
    **Submit** / **Enter** (atau buka submission yang sudah dibuat).
20. Isi form dari draf lengkap di `SUBMISSION.md` (sudah siap tempel):
    title, tagline, description, platform **Web** dicentang.
21. Tempel 3 link: **repo GitHub** (Bagian B), **hosted URL**
    (Bagian C), **video YouTube** (Bagian D).
22. Centang checklist di bawah `SUBMISSION.md` satu per satu — semuanya
    harus benar sebelum klik Submit. Khususnya: tidak ada rahasia di
    repo, video < 3 menit, dan project tetap live sampai penjurian
    selesai (16 Des 2026).
23. Klik **Submit** sebelum **1 Des 2026 05:00 WIB**. Simpan/screenshot
    halaman konfirmasi sebagai bukti.

---

## Kalau mentok di satu langkah

- Error App Check (`app-check/...` di console) → ulangi langkah 6–7.
- Error `ai/...` saat generate → cek AI Logic sudah enabled + provider
  Gemini Developer API terpilih (langkah 3).
- Halaman blank setelah deploy → pastikan `npm run build` menghasilkan
  `dist/` dan `firebase.json` menunjuk `hosting.public` ke `dist`.
- Selain itu: beri tahu agen pesan error persisnya (screenshot/teks),
  agen akan mendiagnosis tanpa menyentuh akun Cipoz.
