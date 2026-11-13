# TEST-REPORT.md — AI Research Desk test evidence

> Honest record of what was tested, exact results, and what is still
> unproven. Updated 12 Nov 2026 ~05:40 WIB (after demo-mode removal).

## 1. Current state (submission form — Firebase only)

**`npm test` (test/e2e.test.mjs) — run 13 Nov 2026 ~18:50 WIB — 18/18 PASS,
ALL CHECKS PASSED** (fresh re-run after the route-badge fix below; the
previous 17/17 PASS was 12 Nov 2026 ~05:40 WIB).

### 1a. Route-badge bug found + fixed 13 Nov 2026 ~18:50 WIB

- **Bug:** `main.js` always calls `runTask()` with an `onChunk` callback,
  so every task takes the streaming path (`generateTextStream`). That
  function returned `{ text, mode }` with **no `route`**, while `run()`
  displays `result.route` in the route badge — so after every task the
  badge fell back to "—" and the hybrid route was never visible. The
  non-streaming `generateText()` returned `route` correctly; only the
  path the UI actually uses was broken.
- **Fix (`src/firebase.js`):** route logic extracted into one shared
  `expectedRoute(mode)` helper, used by both `generateText()` and
  `generateTextStream()`; the stream function now returns
  `{ text, mode, route }`. No behavior change to the AI calls themselves.
- **Test:** new 18th check in `test/e2e.test.mjs` asserts
  `generateTextStream` returns `route` (source-level assertion);
  full suite re-run 18/18 PASS. Live visual confirmation still needs a
  real Chrome + Firebase project (user step).

The smoke test checks, without any demo/non-Firebase path:

1. `vite build` exits 0; `dist/` bundle produced.
2. Bundle imports `firebase/ai` (`getAI`), contains `prefer_on_device`,
   `initializeDeviceModel`, cloud model `gemini-2.5-flash-lite`.
3. Bundle contains NO `/ollama` reference, no `ollama` string, no demo-mode
   flag, no demo provider label.
4. Source tree (excluding this file, PAUSE-NOTE.md, and the test file
   itself) contains no demo/Ollama references; `src/demo.js` deleted.
5. Dev server serves `index.html` ("AI Research Desk", loads `/src/main.js`),
   served page has no demo banner and no Ollama reference, has the Firebase
   setup banner.
6. `generateTextStream` returns `route` (added 13 Nov 2026 — the UI always
   streams, so the route badge depends on this; see §1a).

## 2. History — demo-mode end-to-end test (before removal)

Until 12 Nov 2026 the app had a local demo mode (stand-in provider via a
local model server) so the UI could be tested end-to-end on a VM without a
Firebase project. That mode was **removed on 12 Nov 2026** (see
PAUSE-NOTE.md §9). Its test evidence, kept here for honesty:

### 2a. The ~5 min crash — diagnosed and FIXED

- **Symptom (12 Nov ~04:29 WIB):** `npm test` 12/14 PASS; the generate
  check crashed after ~5 min with Node `HeadersTimeoutError` (undici
  default headers-timeout 300 s).
- **Root cause (verified 12 Nov 2026):** the old test used a NON-streaming
  generate with an UNBOUNDED token count against qwen2.5:3b. On this
  1.5-CPU VM the model runs at ~0.3–1.5 tokens/s under load, so a long
  summary takes >300 s — but for a non-streaming call undici only sends
  headers AFTER the whole response is ready, tripping its 300 s
  headers-timeout. Not an app bug: the model server was observed actively
  generating when the crash happened.
- **Fix:** streaming (`stream: true`, headers arrive with the first token)
  + `num_predict: 150` (caps total work) + explicit 900 s abort timeout.
- **Measurements (12 Nov 2026):**
  - Streaming headers arrived in **14.2 s** (quiet VM, load ~1) and
    **115.8 s** (loaded VM, load ~25, queued behind another generation) —
    both well under the 300 s headers-timeout.
  - 40-token streaming probe completed in **54.8 s** with a correct
    one-sentence summary.
  - Under extreme contention (load 25) a 150-token stream did NOT finish
    within 600 s — total time stays load-dependent; the crash (headers
    timeout) is gone, slowness under contention is not.
- **Result after fix — `npm test` 12 Nov 2026 ~05:36 WIB: 14/14 PASS,
  ALL CHECKS PASSED.** Generate returned a 282-char summary in 80.6 s
  (first chunk 1.1 s), mentioning hybrid/on-device and the $30,000 prize /
  30 Nov deadline. Full log: `/tmp/firebase-npm-test.log` (VM-local).

### 2b. Earlier test evidence (12 Nov ~04:29 WIB, pre-fix)

- `vite build` exit 0; bundle contained Firebase AI Logic code.
- Dev server served `index.html`; local model reachable via dev proxy;
  qwen2.5:3b installed.
- Two bugs found + fixed during testing: (1) Vite 8 listened on `::1`
  only, rejecting `127.0.0.1` — fixed with `host: "127.0.0.1"`;
  (2) `server.kill()` via npx left an orphaned vite process — tests now
  spawn the vite binary directly.

## 3. What is STILL unproven (honest limits)

- **Firebase cloud call via AI Logic:** never run live — needs a Firebase
  project + config + App Check (user step, see CIPOZ-STEPS.md). Verified
  only by construction: imports resolve against firebase 13.3.0, model
  objects construct, code follows the official docs verbatim.
- **On-device Gemini Nano:** never run — needs Chrome 139+ desktop with
  the Prompt API flag and the model downloaded. Code path is real; the
  run is unproven until tested in a real Chrome.
- **Deployed hosting URL / video / Devpost submission:** not done (user steps).
