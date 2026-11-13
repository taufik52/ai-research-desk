# VIDEO-SCRIPT.md — Demo video script (< 3 min, English)

> For Cipoz to record AFTER the Firebase project is live and the app is
> deployed to Firebase Hosting (see CIPOZ-STEPS.md Bagian A–C). Record
> against the **hosted URL**, not localhost. Total target: **~2:45**.
> Upload to YouTube as **Public**, title:
> **"AI Research Desk — #BuildHybridAI 2026"**.

## Setup before recording

- Chrome desktop 139+, window maximized, bookmarks bar hidden.
- Open the hosted URL (e.g. `https://ai-research-desk.web.app`).
- The app ships with 2 sample notes — do NOT clear them.
- If the machine supports Gemini Nano: enable
  `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` → Enabled,
  restart Chrome, click **Prepare on-device model** BEFORE recording and
  wait for the download. If it is not supported, say so honestly on camera
  (script line in 1:40–2:30 covers it) — the cloud fallback is the demo.
- Mute notifications. Record screen + voice (OBS or built-in recorder).

## Shot list + narration (read the lines aloud while doing the action)

### 0:00–0:20 — Opening (20s)
**On screen:** hosted URL, the two sample notes visible.
> "Hi, this is AI Research Desk — a web app that turns your research notes
> into a brief and answers, privately on your device when possible, and in
> the cloud when needed. Everything runs through Firebase AI Logic."

### 0:20–1:00 — Summarize, streaming + route badge (40s)
**On screen:** click **Summarize notes**. Answer streams in; point at the
route badge.
> "I paste my notes here — nothing leaves the browser except inside the
> prompt itself. I click Summarize, and the answer streams in. This badge
> shows where it ran: on-device with Gemini Nano when available, or the
> cloud Gemini model as a fallback. Same button, same SDK call."

### 1:00–1:40 — Ask with citation (40s)
**On screen:** switch mode to **On-device only** (or leave Auto), type
"When does the hackathon close?" in Ask, click **Ask**, point at the
"Note 2" citation.
> "Now a question, answered only from my notes. When does the hackathon
> close? The answer cites Note 2 — and if the notes don't cover a question,
> it says so instead of inventing an answer."

### 1:40–2:30 — On-device model + own note (50s)
**On screen:** click **Prepare on-device model** (show progress / ready
state), add one short note of your own, click **Key takeaways**.
> "On-device needs one tap — Prepare on-device model downloads Gemini Nano,
> on a user gesture, as Chrome requires. [If Nano is unavailable on this
> machine, say: 'On this machine Nano isn't available, so the cloud
> fallback runs instead — that's the hybrid point.'] Let me add a note of
> my own… and the key takeaways come back, still grounded in my notes."

### 2:30–2:45 — Close (15s)
**On screen:** the app, route badge visible.
> "AI Research Desk: free to use, no account, no backend — all inference
> through Firebase AI Logic, on-device first, cloud when needed. Thank you."

## Checklist before uploading

- [ ] Video is under 3:00 (target ~2:45).
- [ ] Narration is in English; the app running is the hosted URL.
- [ ] Route badge is visible in at least one shot.
- [ ] No API key, debug token, or `.env` content is visible on screen.
- [ ] Uploaded to YouTube as **Public**; link pasted into SUBMISSION.md
      and the Devpost form.
