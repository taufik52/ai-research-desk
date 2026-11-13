/**
 * e2e.test.mjs — submission-safe smoke test of AI Research Desk.
 *
 * What it proves (run with `npm test`):
 *  1. Vite builds the app without errors (Firebase AI Logic code compiles).
 *  2. The built bundle actually imports firebase/ai (not just named in README)
 *     — the Devpost rule requires the SDK to be imported and called.
 *  3. The built bundle contains NO non-Firebase inference path: no Ollama,
 *     no /ollama proxy, no demo-mode code. (The old local Ollama demo mode
 *     was removed from this repo on 12 Nov 2026 — see PAUSE-NOTE.md §9.)
 *  4. The dev server serves the app HTML, and the served page is the
 *     Firebase-only app (no demo banner element, no demo references).
 *  5. The source tree contains no demo/Ollama references at all.
 *
 * What it does NOT prove (honest limits, see TEST-REPORT.md):
 *  - The Firebase AI Logic path live (needs a real Firebase project +
 *    App Check debug token — a step only the user can do). That path is
 *    verified by construction: imports resolve, model objects construct,
 *    and the code follows the official docs verbatim.
 *  - On-device Gemini Nano (needs Chrome 139+ desktop with the Prompt API).
 *
 * HISTORY: until 12 Nov 2026 this file was test/e2e-demo.test.mjs and
 * exercised the local Ollama demo end-to-end (including a live generate).
 * The demo generate crash (~5 min HeadersTimeoutError) was diagnosed and
 * FIXED first — streaming + num_predict:150 — and the fixed test went
 * 14/14 PASS on 12 Nov 2026 ~05:36 WIB (evidence in TEST-REPORT.md).
 * Only then was the demo mode deleted, and this file replaced it.
 */
import { spawn } from "node:child_process";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));

let failures = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures++;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitFor(url, timeoutMs = 180000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
    } catch { /* retry */ }
    await sleep(500);
  }
  return null;
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { cwd: ROOT, stdio: "pipe", ...opts });
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (out += d));
    p.on("close", (code) => resolve({ code, out }));
  });
}

function walkFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", "dist", ".git"].includes(entry.name)) continue;
      walkFiles(full, out);
    } else if (/\.(js|mjs|html|css|json|md)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

// --- 1. Build ---------------------------------------------------------------
console.log("== 1. vite build ==");
const build = await run("npx", ["vite", "build"], { env: { ...process.env } });
check("vite build exits 0", build.code === 0, build.code !== 0 ? build.out.slice(-500) : "");
const bundleFiles = [];
{
  const assets = path.join(ROOT, "dist", "assets");
  if (existsSync(assets)) {
    for (const f of readdirSync(assets)) if (f.endsWith(".js")) bundleFiles.push(path.join(assets, f));
  }
}
check("dist bundle produced", bundleFiles.length > 0);

// --- 2. Bundle really contains firebase/ai code -----------------------------
const bundleText = bundleFiles.map((f) => readFileSync(f, "utf8")).join("\n");
check("bundle imports firebase/ai (getAI)", bundleText.includes("getAI"));
check("bundle contains hybrid mode PREFER_ON_DEVICE", bundleText.includes("prefer_on_device"));
check("bundle contains initializeDeviceModel", bundleText.includes("initializeDeviceModel"));
check("bundle contains cloud model gemini-2.5-flash-lite", bundleText.includes("gemini-2.5-flash-lite"));

// --- 2b. Streaming path returns the route badge value -----------------------
// main.js always streams (onChunk), so generateTextStream MUST return `route`
// or the badge ends up "—" after every task (bug found + fixed 13 Nov 2026).
const firebaseSrc = readFileSync(path.join(ROOT, "src", "firebase.js"), "utf8");
check(
  "generateTextStream returns route",
  firebaseSrc.includes("return { text, mode: String(mode), route: expectedRoute(mode) };"),
);

// --- 3. Bundle contains NO non-Firebase inference path ----------------------
console.log("== 2. no demo / non-Firebase inference in bundle ==");
check("bundle has no /ollama references", !bundleText.includes("/ollama"));
check("bundle has no 'ollama' string", !/ollama/i.test(bundleText));
check("bundle has no demo-mode flag", !/VITE_DEMO_MODE|DEMO_MODE/i.test(bundleText));
check("bundle has no demo provider label", !/demo-ollama|local Ollama/i.test(bundleText));

// --- 4. Source tree is clean ------------------------------------------------
console.log("== 3. source tree clean ==");
const srcFiles = walkFiles(ROOT).filter(
  (f) => !f.includes(`${path.sep}test${path.sep}`) && !f.endsWith("PAUSE-NOTE.md") && !f.endsWith("TEST-REPORT.md"),
);
const badFiles = [];
for (const f of srcFiles) {
  const text = readFileSync(f, "utf8");
  if (/ollama/i.test(text) || /VITE_DEMO_MODE|DEMO_MODE|demo\.js|demoGenerate|demoHealth/i.test(text)) {
    badFiles.push(path.relative(ROOT, f));
  }
}
check("no demo/Ollama references in source (excl. test + notes)", badFiles.length === 0, badFiles.join(", "));
check("src/demo.js deleted", !existsSync(path.join(ROOT, "src", "demo.js")));

// --- 5. Dev server serves the Firebase-only app ----------------------------
console.log("== 4. dev server serves app ==");
// Spawn the vite binary directly (not via npx) so server.kill() actually
// stops it — killing npx leaves the vite child orphaned on this VM.
// First page load triggers Vite's dep optimizer for firebase (large), which
// is slow on this 1.5-CPU VM — waitFor allows 180s for that reason.
const server = spawn(
  "node",
  ["node_modules/vite/bin/vite.js", "--port", "5199", "--strictPort"],
  {
    cwd: ROOT,
    stdio: "pipe",
    env: { ...process.env },
  },
);
try {
  const page = await waitFor("http://127.0.0.1:5199/");
  check("dev server serves index", !!page);
  if (page) {
    const html = await page.text();
    check("index contains 'AI Research Desk'", html.includes("AI Research Desk"));
    check("index loads /src/main.js", html.includes("/src/main.js"));
    check("served page has no demo banner", !html.includes("demo-banner"));
    check("served page has no Ollama reference", !/ollama/i.test(html));
    check("served page has Firebase setup banner", html.includes("setup-banner"));
  }
} finally {
  server.kill("SIGTERM");
}

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
