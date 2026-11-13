# SUBMISSION.md — Devpost draft for #BuildHybridAI 2026

> DRAFT — in English, ready to paste into the Devpost submission form.
> Do NOT submit until the checklist at the bottom is complete.
> The demo video (< 3 min, YouTube, English) still needs to be recorded.

---

## Project title

**AI Research Desk — notes in, briefs out, on-device first**

## Tagline

Your research notes, summarized and answered privately on your device —
with the cloud as a seamless fallback. One SDK, both worlds.

## Text description (Devpost "description" field)

### The problem

Researchers, students, and analysts drown in notes: pasted articles, meeting
summaries, documentation. Existing AI summarizers send all of that to the
cloud — slow, metered, and a privacy problem when the notes are sensitive.
On-device models fix the privacy and cost problem, but they are not on every
device, so an on-device-only app leaves half its users behind.

### What AI Research Desk does

AI Research Desk is a web app where you paste research notes and get three
things back, all grounded strictly in your notes:

1. **Summarize** — a structured brief (headings + bullets, under 250 words).
2. **Key takeaways** — the 5–8 most important points, one sentence each.
3. **Ask** — a question answered only from your notes, citing which note was
   used. If the notes do not cover the question, the app says so instead of
   inventing an answer.

Notes never leave the device except inside the prompt itself, and they are
stored only in the browser's local storage — there is no account, no server,
no database to leak them.

### How Firebase AI Logic is used (the core of this project)

Every AI call goes through the **Firebase AI Logic** JavaScript SDK — no other
model API is called anywhere in the production code path:

- The app initializes the Gemini Developer API backend with
  `getAI(app, { backend: new GoogleAIBackend() })`.
- It creates hybrid models with
  `getGenerativeModel(ai, { mode: InferenceMode.PREFER_ON_DEVICE, inCloudParams: { model: "gemini-2.5-flash-lite" } })`.
- Short tasks (summaries, takeaways) use `PREFER_ON_DEVICE`: they run on
  **Gemini Nano** in Chrome when the on-device model is available, and fall
  back to the cloud Gemini model automatically when it is not. Long or complex
  work can be routed cloud-first (`PREFER_IN_CLOUD`).
- The user can switch between all four modes — `PREFER_ON_DEVICE`,
  `ONLY_ON_DEVICE`, `PREFER_IN_CLOUD`, `ONLY_IN_CLOUD` — from the UI, and a
  **route badge** on every answer shows which inference route was used.
- `initializeDeviceModel()` is called on a user gesture (a button click), as
  the Chrome Prompt API requires, with live download progress while Gemini
  Nano downloads.
- **App Check is enforced** for AI Logic (reCAPTCHA v3 in production, debug
  tokens for local development, as accepted by the hackathon rules).
- Because on-device inference supports **single-turn text generation only**,
  every feature is deliberately designed as a single-turn `generateContent()`
  call with the notes embedded in the prompt — the constraint shaped the
  product, not the other way around.

### Why hybrid is the right architecture for this app

Summarizing your own notes is the ideal on-device workload: it is private
(the notes never leave the machine), free (no per-token bill), and works
offline. But a researcher on a device without Gemini Nano still needs the
same answer — so the same button, the same SDK call, falls back to the cloud.
The user gets one consistent experience; the SDK decides where the compute
happens. That is the whole point of hybrid inference, and this app is built
around it rather than bolting it on.

### Features

- Add / delete / clear research notes (local only, sample notes included).
- Summarize, key takeaways, and grounded Q&A with citations.
- Four inference modes with a visible route badge per answer.
- On-device model preparation with download progress.
- Streaming answers (typewriter effect) via `generateContentStream()`.
- Works with no account and no backend server.

### Value proposition

For anyone who reads and takes notes for a living, AI Research Desk turns a
pile of pasted research into a usable brief in seconds — privately on-device
when possible, in the cloud when necessary — without asking the user to care
which one ran. It is free to use (Gemini Developer API free tier) and needs
no sign-up.

### Built with

- Firebase AI Logic (hybrid inference: Gemini Nano on-device + Gemini cloud)
- Firebase App Check
- Vite + vanilla JavaScript (no framework, no backend server)
- Deployed on Firebase Hosting

### What was built during the submission period

The entire app is new, built 12 Nov 2026 during the submission period:
UI, notes store, prompt design, Firebase AI Logic hybrid integration
(all four inference modes, device-model preparation, streaming), App Check
setup. The app was first tested end-to-end with a local stand-in provider
(removed 12 Nov 2026, before submission — see README.md and
TEST-REPORT.md); the submitted code calls no model API other than
Firebase AI Logic.

---

## Platform selection

- [x] **Web (Chrome)** — primary platform (Best Web/Chrome App track).

## Links (fill in before submitting)

- **Code repository (public, Apache-2.0):** _TODO — create the public GitHub repo
  and paste the URL here. The repo must be public with the LICENSE file visible._
- **Hosted project URL:** _TODO — Firebase Hosting URL after `firebase deploy`
  (see DEPLOY.md)._
- **Demo video (YouTube, < 3 min, English):** _TODO — record after the Firebase
  path is live; must show the app running in Chrome, including the on-device
  route badge and a cloud fallback._

## Testing instructions (for judges)

1. Open the hosted URL in Chrome (desktop, version 139+ for on-device).
2. The app ships with two sample notes — click **Summarize notes** and watch
   the answer stream in, with the route badge showing on-device or cloud.
3. Add your own note, then **Ask** a question about it (e.g. "When does the
   hackathon close?") and check the citation.
4. Switch the inference mode to **On-device only** and re-run — on a device
   without Gemini Nano this correctly reports that on-device is unavailable.
5. Click **Prepare on-device model** to download Gemini Nano (first run only);
   enable `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` first.
6. No login, no payment, no API key is needed to test.

## Key facts for the form

- **Prizes:** $30,000 total — Grand Prize $10,000; 1st runner-up $7,000;
  2nd runner-up $4,000; $3,000 best app per platform.
- **Submission period:** 11 Nov 2026 1:30 PM PT – 30 Nov 2026 2:00 PM PT
  (closes 1 Dec 2026, 05:00 WIB).
- **Judging:** 10–16 Dec 2026; winners announced ~21 Dec 2026.
- **Official Rules:** published on the Devpost rules page (verified 12 Nov 2026).
  Indonesia is not among the excluded residencies.
- **License:** Apache License 2.0 (included in the repo root).

---

## ⛔ PRE-SUBMISSION CHECKLIST (all must be true before clicking Submit)

- [x] Demo mode REMOVED (done 12 Nov 2026, verified: stand-in file
      deleted, demo branch in the router deleted, dev-server proxy
      removed, env flag deleted; `npm run build` passes and `npm test`
      asserts no non-Firebase inference path in the bundle).
- [ ] Firebase project created (user step) and `.env` filled with the real
      web app config; App Check configured (reCAPTCHA v3 key).
- [ ] Cloud path verified live: Summarize + Ask work in Chrome against the
      real Firebase project (record the result in TEST-REPORT.md).
- [ ] On-device path verified live in Chrome 139+ (Gemini Nano download +
      on-device summary, route badge shows on-device) — or, if the test
      machine cannot run it, the video + description say so honestly.
- [ ] App deployed to Firebase Hosting; hosted URL tested in a clean browser.
- [ ] Public GitHub repo created (user step — agent must not create it),
      LICENSE visible, README accurate, no secrets in the repo (`.env` is
      gitignored; check `git status` for accidents).
- [ ] Demo video recorded (< 3 min, English, shows the app working on Web),
      uploaded to YouTube (public), link pasted in the form.
- [ ] Devpost form filled: title, tagline, description (above), platform
      Web selected, repo URL, hosted URL, video URL.
- [ ] Submitted before 30 Nov 2026 2:00 PM PT / 1 Dec 2026 05:00 WIB.
