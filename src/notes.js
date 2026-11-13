/**
 * notes.js — tiny local notes store (localStorage). No backend, no account.
 * Notes are the "research" the AI summarizes / answers questions about.
 * They never leave the device except inside a prompt sent to the AI provider.
 */

const KEY = "ai-research-desk.notes.v1";

export function loadNotes() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seedNotes();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return seedNotes();
    return parsed;
  } catch {
    return seedNotes();
  }
}

export function saveNotes(notes) {
  localStorage.setItem(KEY, JSON.stringify(notes));
}

export function seedNotes() {
  const notes = [
    {
      id: "seed-1",
      title: "Firebase AI Logic — hybrid inference",
      body: "Hybrid inference runs prompts on-device (Gemini Nano in Chrome) when a local model is available and falls back to a cloud Gemini model when it is not. On-device inference needs Chrome 139+ on desktop and Firebase AI Logic SDK v12.5.0+. It supports single-turn text generation only, no chat sessions. App Check is enforced for AI Logic; debug tokens are accepted in submissions.",
      createdAt: Date.now(),
    },
    {
      id: "seed-2",
      title: "Hackathon — #BuildHybridAI 2026",
      body: "Submissions run 11-30 Nov 2026 and close 30 Nov 2026 at 2:00 PM PT (1 Dec 2026, 05:00 WIB). Total prizes $30,000: Grand Prize $10,000, 1st runner-up $7,000, 2nd runner-up $4,000, and $3,000 for the best app on each platform (Web, Android, iOS). Submission needs a public repo with an open-source license, a demo video under 3 minutes on YouTube, and a text description. All AI inference must go through Firebase AI Logic.",
      createdAt: Date.now(),
    },
  ];
  saveNotes(notes);
  return notes;
}

export function addNote(title, body) {
  const notes = loadNotes();
  const note = { id: `n-${Date.now()}`, title: title.trim() || "Untitled note", body, createdAt: Date.now() };
  notes.unshift(note);
  saveNotes(notes);
  return notes;
}

export function deleteNote(id) {
  const notes = loadNotes().filter((n) => n.id !== id);
  saveNotes(notes);
  return notes;
}

export function clearNotes() {
  saveNotes([]);
  return [];
}
