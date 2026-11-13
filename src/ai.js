/**
 * ai.js — provider router.
 *
 * ONLY path: Firebase AI Logic (src/firebase.js). All inference goes through
 * the Firebase AI Logic SDK, as the #BuildHybridAI rules require.
 *
 * HISTORY: until 12 Nov 2026 this file also routed to a local stand-in
 * provider when a demo flag was set in .env, so the UI could be tested
 * end-to-end on a VM without a Firebase project. That mode was REMOVED
 * on 12 Nov 2026 (see PAUSE-NOTE.md §9): the stand-in file was deleted,
 * the demo branch and the dev-server proxy were removed, and the test
 * suite was replaced with a submission-safe smoke test (test/e2e.test.mjs).
 * The demo generate crash fix (streaming + capped tokens) was verified
 * BEFORE removal — the old test went 14/14 PASS on 12 Nov 2026 ~05:36 WIB —
 * and its evidence is recorded in TEST-REPORT.md.
 */

import {
  FIREBASE_MODES,
  firebaseStatus,
  generateText as fbGenerate,
  generateTextStream as fbGenerateStream,
  initDeviceModel,
  refreshOnDeviceStatus,
} from "./firebase.js";

export function providerInfo() {
  const fb = firebaseStatus();
  return {
    provider: "firebase-ai-logic",
    label: "Firebase AI Logic (hybrid inference)",
    firebase: fb.configured,
    firebaseStatus: fb,
  };
}

/** Build the single-turn prompt for a task, grounding the model in the notes. */
export function buildPrompt(task, notes, input) {
  const notesBlock =
    notes.length === 0
      ? "(No notes saved yet.)"
      : notes.map((n, i) => `--- Note ${i + 1}: ${n.title} ---\n${n.body}`).join("\n\n");
  if (task === "summarize") {
    return (
      `You are a research assistant. Summarize the research notes below into a concise brief.\n` +
      `Use clear headings and bullet points. Keep it under 250 words. ` +
      `Only use information present in the notes; if something is unclear, say so.\n\n` +
      `RESEARCH NOTES:\n${notesBlock}`
    );
  }
  if (task === "keypoints") {
    return (
      `You are a research assistant. Extract the 5-8 most important takeaways from the research notes below.\n` +
      `Return them as a numbered list, each one sentence. Do not add facts that are not in the notes.\n\n` +
      `RESEARCH NOTES:\n${notesBlock}`
    );
  }
  // task === "ask"
  return (
    `You are a research assistant. Answer the question below using ONLY the research notes provided.\n` +
    `If the notes do not contain the answer, say "The notes do not cover this." and do not invent facts.\n` +
    `Keep the answer short and cite which note(s) you used (e.g. "Note 2").\n\n` +
    `QUESTION: ${input}\n\nRESEARCH NOTES:\n${notesBlock}`
  );
}

/**
 * Run one AI task. Single-turn only (on-device inference does not support
 * chat sessions). Returns { text, mode, route }.
 */
export async function runTask(task, notes, input, { mode, onChunk } = {}) {
  const prompt = buildPrompt(task, notes, input);
  const fbMode = mode || FIREBASE_MODES.AUTO;
  if (onChunk) {
    return fbGenerateStream(prompt, { mode: fbMode, onChunk });
  }
  return fbGenerate(prompt, { mode: fbMode });
}

export { FIREBASE_MODES, initDeviceModel, refreshOnDeviceStatus };
