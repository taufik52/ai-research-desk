# AI Research Desk — #BuildHybridAI 2026

A web app that turns your pasted research notes into a concise brief and
answers questions **grounded only in those notes**. Built with
**Firebase AI Logic hybrid inference**: prompts run on-device with
**Gemini Nano** (Chrome desktop) when available and fall back to a cloud
Gemini model when they are not — one SDK, one call, no backend of your own.

> **Platform:** Web (Chrome) · **Prize track:** Best Web/Chrome App ($3,000) and Grand Prize ($10,000)
> **Hackathon:** #BuildHybridAI 2026 — submissions 11–30 Nov 2026, close 30 Nov 2026 2:00 PM PT
> (1 Dec 2026, 05:00 WIB) · **Status:** app built; local demo mode
> **removed 12 Nov 2026** (see below) and the app builds + smoke-tests
> clean in its submitted, Firebase-only form; Firebase project + live
> verification are the remaining steps for the user (Cipoz).

---

## What it does

1. **Paste research notes** — articles, meeting summaries, docs. Notes are stored
   only in the browser (`localStorage`); nothing is uploaded anywhere except
   inside a prompt sent to the AI provider.
2. **Summarize** — a structured brief (<250 words, headings + bullets).
3. **Key takeaways** — the 5–8 most important points, one sentence each.
4. **Ask** — a question answered strictly from the notes, with the note(s)
   cited. If the notes do not cover it, the model says so instead of inventing.
5. **Inference-mode control** — Auto (on-device first, cloud fallback),
   On-device only, Cloud first, Cloud only. A "Prepare on-device model"
   button triggers the Gemini Nano download on a user gesture (required by
   the Chrome Prompt API) with live download progress.
6. **Route badge** — every answer shows which inference route was used
   (on-device vs cloud), so the hybrid behavior is visible, not magic.

### Why hybrid matters here

Summarizing your own notes is the perfect on-device job: it is private
(your notes never leave the machine), free, and works offline. But not every
device has Gemini Nano — so the same button seamlessly falls back to the
cloud Gemini model. Long, complex documents get routed cloud-first, short
notes stay on-device. One SDK call, both worlds.

---

## ⚠️ READ FIRST: what is real Firebase AI Logic vs. what is still unproven

This distinction is the most important thing in this repo. Be honest about it.

| Piece | Status | File(s) |
|---|---|---|
| Firebase AI Logic SDK integration (real code, not a mock) | ✅ **Real.** `getAI` + `GoogleAIBackend`, `getGenerativeModel({ mode: InferenceMode.PREFER_ON_DEVICE, inCloudParams: { model: "gemini-2.5-flash-lite" } })`, `initializeDeviceModel()`, `generateContent()` / `generateContentStream()`. Verified against the installed SDK (firebase 13.3.0) — imports resolve and model objects construct. Follows the official docs verbatim: https://firebase.google.com/docs/ai-logic/hybrid-on-device-inference | `src/firebase.js` |
| App Check (required by AI Logic) | ✅ **Real code**, needs user setup: reCAPTCHA v3 site key in `.env`, debug token registered in the console for localhost | `src/firebase.js` (`initFirebase`) |
| Firebase project / web app config | ❌ **Not created.** No account or project was created by the agent. `.env` is empty by design. Creating the project is a step only the user (Cipoz) can do. | `.env` (see Setup) |
| On-device Gemini Nano run | ⏳ **Not yet exercised.** Needs Chrome 139+ desktop with the Prompt API flag and the model downloaded. The VM has no such Chrome session. Code path is real; the run is unproven until tested in a real Chrome. | `src/firebase.js` (`initDeviceModel`) |
| Cloud Gemini call via Firebase | ⏳ **Not yet exercised.** Needs the Firebase project above. | `src/firebase.js` (`generateText`) |
| Local demo mode (stand-in provider) | 🗑️ **REMOVED 12 Nov 2026.** The app was first tested end-to-end against a local stand-in provider so the UI/UX could be exercised on a VM without a Firebase project. That mode called a local model server directly — **not** Firebase AI Logic — so it was deleted before submission: stand-in file deleted, demo branch in the router deleted, dev-server proxy deleted, env flag deleted. The generate crash found during that testing (~5 min timeout) was diagnosed and fixed first (streaming + capped tokens; old test 14/14 PASS 12 Nov 2026 ~05:36 WIB — evidence in TEST-REPORT.md), and only then was the mode removed. `npm test` now asserts the submitted code contains no non-Firebase inference path. | `src/ai.js` (history note), `TEST-REPORT.md` |

---

## Setup (for the user — Cipoz)

### 1. Create the Firebase project (only you can do this)

1. Go to the [Firebase console](https://console.firebase.google.com/) and create a project (any name, e.g. `ai-research-desk`).
2. In the console go to **AI Services → AI Logic → Get started**. Choose the **Gemini Developer API** provider (free tier, no billing) and complete the guided workflow. This step also **enforces App Check** for AI Logic.
3. Register a **Web app** in Project settings → Your apps, and copy the SDK config.
4. In **App Check**, add a reCAPTCHA v3 site key (or use the debug provider for localhost — see below).

### 2. Configure the app

```bash
cd firebase-hybrid-ai
cp .env.example .env
# fill in VITE_FIREBASE_* from the Firebase console (step 1.3)
# set VITE_RECAPTCHA_SITE_KEY from step 1.4
npm install
```

For **local development with App Check enforced**, set `VITE_APPCHECK_DEBUG=true`
in `.env`. On the first run, open the browser console — it prints an
**App Check debug token**. Register it in the Firebase console →
**App Check → Apps → Manage debug tokens**. Debug tokens are accepted in
hackathon submissions.

### 3. Run

```bash
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
npm run preview  # serve the production build on http://localhost:4173
npm test         # submission-safe smoke test (build + bundle + dev server; see TEST-REPORT.md)
```

### 4. On-device model (Chrome desktop)

1. Use Chrome 139+ on desktop.
2. Enable `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` → **Enabled**, restart Chrome.
3. In the app, click **Prepare on-device model** (a user gesture is required)
   and wait for the download to finish.
4. Summaries will then run on-device; the route badge will say so.

---

## How the hybrid routing works (code map)

```
User clicks Summarize / Key takeaways / Ask
  → src/main.js run(task)
  → src/ai.js runTask() — builds ONE single-turn prompt (notes embedded)
      (on-device inference supports single-turn text only — no chat sessions,
       so every feature is deliberately a single-turn generateContent call)
  → src/firebase.js generateText()/generateTextStream()
      → getGenerativeModel(ai, { mode, inCloudParams: { model: "gemini-2.5-flash-lite" } })
      → mode PREFER_ON_DEVICE: Gemini Nano if available, else cloud
      → mode ONLY_ON_DEVICE: Nano or throw   ·   PREFER_IN_CLOUD / ONLY_IN_CLOUD: cloud
```

The SDK routes internally and does not expose which backend actually ran.
The route badge therefore reports the **expected** route honestly
(mode + live Gemini Nano availability from `LanguageModel.availability()`),
never a guessed fact.

---

## Deploy

See [DEPLOY.md](DEPLOY.md) — Firebase Hosting (`firebase deploy`) in ~10 steps.

## Submission draft

See [SUBMISSION.md](SUBMISSION.md) — the full Devpost text description draft
(English), feature list, and what still needs recording (demo video < 3 min).

## Test evidence

See [TEST-REPORT.md](TEST-REPORT.md) — what was tested, exact results, and
what is still unproven (Firebase cloud call, Gemini Nano run).

## License

Apache License 2.0 — see [LICENSE](LICENSE). (Apache is the preferred license
for this hackathon.)

## Rules compliance notes

- **All AI inference through Firebase AI Logic:** true in the submitted
  configuration (demo mode removed 12 Nov 2026 — see the table above;
  `npm test` asserts no non-Firebase inference path in the bundle).
  No other model API is called by the production code path.
- **App Check:** enforced; debug tokens accepted in submissions.
- **Free to use:** the app is free; cloud inference uses the Gemini Developer
  API free tier.
- **New project:** built entirely during the submission period (11–30 Nov 2026).
- **English:** the app UI and all submission materials are in English.
- **Eligibility:** Indonesia is not on the excluded-residents list
  (Brazil, Italy, Quebec, Crimea, Cuba, Iran, Syria, North Korea, Sudan,
  Belarus, Russia). Official Rules were published and read on 12 Nov 2026 —
  see SUBMISSION.md for the key dates.
