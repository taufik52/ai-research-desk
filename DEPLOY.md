# DEPLOY.md — deploy AI Research Desk to Firebase Hosting

> All steps below are for the user (Cipoz). Nothing here was executed by the
> agent: there is no Firebase project, no Firebase login, and no hosted URL
> yet. Steps 1–4 are the blockers; step 5+ takes ~10 minutes once they exist.

## Prerequisites (user steps — do these first)

1. **Create the Firebase project** (Firebase console → Add project).
   Any name works, e.g. `ai-research-desk`. Google Analytics is NOT required.
2. **Enable AI Logic**: console → **AI Services → AI Logic → Get started**,
   choose the **Gemini Developer API** provider (free tier, no billing),
   finish the guided workflow. This enforces **App Check** for AI Logic.
3. **Register the Web app**: Project settings → Your apps → Web app (`</>`),
   copy the SDK config (`apiKey`, `authDomain`, `projectId`,
   `storageBucket`, `messagingSenderId`, `appId`).
4. **App Check**: App Check → register the web app with a **reCAPTCHA v3**
   site key (production). For localhost testing, use the debug provider
   instead (see README.md "Setup" — debug token from the browser console,
   registered under App Check → Apps → Manage debug tokens).

## 0. Demo mode — already removed (12 Nov 2026)

The local demo mode that used to exist for testing without a Firebase
project was deleted before submission: stand-in file deleted, demo branch
in the router deleted, dev-server proxy deleted, env flag deleted.
Nothing to do here — but verify before deploying:

```bash
cd ~/workspace/firebase-hybrid-ai
npm run build   # must pass
npm test        # asserts no non-Firebase inference path in dist/ and src/
```

## 1. Fill in the config

```bash
cp .env.example .env
# paste the values from prerequisite step 3 into VITE_FIREBASE_*
# paste the reCAPTCHA v3 site key into VITE_RECAPTCHA_SITE_KEY
# VITE_APPCHECK_DEBUG=true only for localhost testing; remove for production
```

## 2. Verify locally against the real Firebase project

```bash
npm install
npm run dev   # http://localhost:5173
```

- Click **Summarize notes** with the sample notes. The route badge should show
  the cloud model (`gemini-2.5-flash-lite`) on a machine without Gemini Nano.
- In Chrome 139+ desktop, enable
  `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`, click
  **Prepare on-device model**, wait for the download, then summarize again —
  the route badge should show on-device (Gemini Nano).
- If App Check blocks calls, check the browser console for the debug token
  and register it (prerequisite step 4).

## 3. Install Firebase CLI and log in (user step)

```bash
npm install -g firebase-tools
firebase login            # opens the browser — user signs in with Google
firebase init hosting     # choose the project from step 1; public dir: dist
                          # single-page app: Yes; do NOT overwrite index.html
```

`.firebaserc` is created by `firebase init` (it contains your project id, so
it cannot be pre-made). NOTE: `firebase.json` is already pre-made in this
repo (hosting `public: dist`, SPA rewrite to `/index.html`, no-cache on
`index.html`) — `firebase init hosting` will keep/confirm it; only
`.firebaserc` still needs to be created by the init step.

## 4. Build + deploy

```bash
npm run build
firebase deploy --only hosting
```

The CLI prints the Hosting URL, e.g.
`https://ai-research-desk.web.app`. Test it in a clean Chrome window.

## 5. After deploy

- Paste the Hosting URL into SUBMISSION.md and the Devpost form.
- Record the video against the **hosted** URL (not localhost) — it must show
  the project functioning on the platform it was built for.
- Keep the site up and free of charge until the judging period ends
  (16 Dec 2026) — the rules require the project to stay available for
  testing by the sponsor, administrator, and judges.

## Rollback / troubleshooting

- `firebase hosting:channel:deploy preview-name` — preview URL without
  touching production.
- App Check errors in the console (`app-check/...`) → re-check the site key
  and the debug token registration; AI Logic calls are rejected while App
  Check is misconfigured.
- `Firebase: Error (ai/...)` on generate → check AI Logic is enabled in the
  console and the Gemini Developer API provider is selected.
- Blank page after deploy → make sure `npm run build` output is in `dist/`
  and `firebase.json` points `hosting.public` at `dist`.
