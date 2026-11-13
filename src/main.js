/**
 * main.js — UI wiring for AI Research Desk.
 * All AI calls go through src/ai.js (Firebase AI Logic only).
 */
import {
  FIREBASE_MODES,
  initDeviceModel,
  providerInfo,
  refreshOnDeviceStatus,
  runTask,
} from "./ai.js";
import { addNote, clearNotes, deleteNote, loadNotes, saveNotes, seedNotes } from "./notes.js";

const $ = (id) => document.getElementById(id);

const MODE_MAP = {
  auto: FIREBASE_MODES.AUTO,
  "on-device": FIREBASE_MODES.ON_DEVICE_ONLY,
  "cloud-first": FIREBASE_MODES.CLOUD_FIRST,
  "cloud-only": FIREBASE_MODES.CLOUD_ONLY,
};

let notes = loadNotes();
let busy = false;

function esc(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function renderNotes() {
  const list = $("notes-list");
  if (notes.length === 0) {
    list.innerHTML = `<li><p>No notes yet. Add one above, or reload the sample notes.</p></li>`;
    return;
  }
  list.innerHTML = notes
    .map(
      (n) =>
        `<li><h4>${esc(n.title)}</h4><p>${esc(n.body)}</p>` +
        `<button class="del" data-id="${n.id}">Delete</button></li>`,
    )
    .join("");
  list.querySelectorAll(".del").forEach((btn) => {
    btn.addEventListener("click", () => {
      notes = deleteNote(btn.dataset.id);
      renderNotes();
    });
  });
}

function setBusy(b) {
  busy = b;
  ["btn-summarize", "btn-keypoints", "btn-ask", "prepare-device"].forEach((id) => {
    $(id).disabled = b;
  });
}

function setOutput(text, route, meta) {
  $("output").textContent = text;
  $("route-badge").textContent = route || "—";
  $("output-meta").textContent = meta || "";
}

async function run(task) {
  if (busy) return;
  const question = $("question").value.trim();
  if (task === "ask" && !question) {
    setOutput("Type a question about your notes first.", "", "");
    return;
  }
  if (notes.length === 0) {
    setOutput("Add at least one note first — the AI only answers from your notes.", "", "");
    return;
  }
  setBusy(true);
  setOutput("Thinking…", "running…", "");
  const started = performance.now();
  try {
    const mode = MODE_MAP[$("mode-select").value] || FIREBASE_MODES.AUTO;
    const result = await runTask(task, notes, question, {
      mode,
      onChunk: (_chunk, full) => {
        $("output").textContent = full;
      },
    });
    const secs = ((performance.now() - started) / 1000).toFixed(1);
    setOutput(
      result.text || "(empty response)",
      result.route,
      `Task: ${task} · ${secs}s · mode: ${result.mode}`,
    );
  } catch (err) {
    console.error(err);
    setOutput(
      `Error: ${err.message || err}\n\n` +
        "Check the Firebase setup in README.md: .env config, App Check debug token, and AI Logic enabled in the console.",
      "error",
      "",
    );
  } finally {
    setBusy(false);
  }
}

async function initProviderUI() {
  const info = providerInfo();
  const badge = $("provider-badge");
  badge.textContent = info.label;
  badge.classList.add("firebase");
  $("footer-mode").textContent =
    "Inference: Firebase AI Logic hybrid (Gemini Nano on-device → Gemini cloud).";

  if (!info.firebase) {
    const banner = $("setup-banner");
    banner.classList.remove("hidden");
    banner.innerHTML =
      `<strong>Firebase is not configured yet.</strong> AI buttons will fail until you add your web app config to <code>.env</code> ` +
      `(copy <code>.env.example</code> → <code>.env</code>). Missing: <code>${info.firebaseStatus.missing.join(", ")}</code>. ` +
      `Creating the Firebase project is a step only the user can do — see README.md “Setup”.`;
  }

  // On-device (Gemini Nano) availability probe — Chrome Prompt API.
  const status = await refreshOnDeviceStatus();
  const label =
    status === "available"
      ? "On-device model (Gemini Nano): available — summaries can run privately on this device."
      : status === "downloading"
        ? "On-device model (Gemini Nano): downloading…"
        : status === "downloadable"
          ? "On-device model (Gemini Nano): downloadable — click “Prepare on-device model”."
          : status === "unavailable"
            ? "On-device model (Gemini Nano): unavailable on this device — cloud fallback will be used."
            : "On-device model (Gemini Nano): not detected (needs Chrome 139+ on desktop).";
  $("nano-status").textContent = `On-device model status: ${label}`;
}

$("add-note").addEventListener("click", () => {
  const title = $("note-title").value;
  const body = $("note-body").value.trim();
  if (!body) return;
  notes = addNote(title, body);
  $("note-title").value = "";
  $("note-body").value = "";
  renderNotes();
});

$("load-sample").addEventListener("click", () => {
  notes = seedNotes();
  renderNotes();
});

$("clear-notes").addEventListener("click", () => {
  notes = clearNotes();
  renderNotes();
});

$("btn-summarize").addEventListener("click", () => run("summarize"));
$("btn-keypoints").addEventListener("click", () => run("keypoints"));
$("btn-ask").addEventListener("click", () => run("ask"));
$("question").addEventListener("keydown", (e) => {
  if (e.key === "Enter") run("ask");
});

$("prepare-device").addEventListener("click", async () => {
  const btn = $("prepare-device");
  btn.disabled = true;
  $("device-progress").textContent = "Starting on-device model…";
  try {
    // initializeDeviceModel() must run on a user gesture — this click is it.
    await initDeviceModel((p) => {
      $("device-progress").textContent = `Downloading on-device model: ${Math.round(p * 100)}%`;
    });
    $("device-progress").textContent = "On-device model ready.";
    await initProviderUI();
  } catch (err) {
    $("device-progress").textContent = `Could not prepare on-device model: ${err.message || err}`;
  } finally {
    btn.disabled = false;
  }
});

renderNotes();
initProviderUI();
