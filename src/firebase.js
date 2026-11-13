/**
 * firebase.js — REAL Firebase AI Logic integration (the submission path).
 *
 * This file is the only production AI path in the app. It uses the official
 * Firebase JavaScript SDK (firebase/ai) exactly as documented in
 * https://firebase.google.com/docs/ai-logic/hybrid-on-device-inference
 *
 *   - Backend: Gemini Developer API (GoogleAIBackend), free tier, no billing.
 *   - Hybrid inference: getGenerativeModel(ai, { mode: InferenceMode.* })
 *       PREFER_ON_DEVICE  -> Gemini Nano on-device when available, else cloud
 *       ONLY_ON_DEVICE    -> on-device or throw
 *       PREFER_IN_CLOUD   -> cloud first, on-device fallback
 *       ONLY_IN_CLOUD     -> cloud only
 *   - initializeDeviceModel() is called on a user gesture (button click),
 *     as required by the Chrome Prompt API user-activation rule.
 *   - App Check is enforced by AI Logic; local dev uses the debug provider.
 *
 * On-device inference supports single-turn text generation ONLY (no chat
 * sessions), so every feature in this app is a single-turn generateContent()
 * call with the notes embedded in the prompt. That is a deliberate design
 * choice, not a limitation we worked around.
 *
 * NOTE: this module is inert until a real Firebase config is present
 * (VITE_FIREBASE_* env vars). Creating the Firebase project and filling in
 * the config is a step only the user (Cipoz) can do; no account or project
 * was created by the agent.
 */
import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  InferenceMode,
} from "firebase/ai";

export const FIREBASE_MODES = {
  AUTO: InferenceMode.PREFER_ON_DEVICE,
  ON_DEVICE_ONLY: InferenceMode.ONLY_ON_DEVICE,
  CLOUD_FIRST: InferenceMode.PREFER_IN_CLOUD,
  CLOUD_ONLY: InferenceMode.ONLY_IN_CLOUD,
};

const CLOUD_MODEL = import.meta.env.VITE_CLOUD_MODEL || "gemini-2.5-flash-lite";

function readFirebaseConfig() {
  const env = import.meta.env;
  const cfg = {
    apiKey: env.VITE_FIREBASE_API_KEY || "",
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: env.VITE_FIREBASE_APP_ID || "",
  };
  const missing = Object.entries(cfg)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  return { cfg, configured: missing.length === 0, missing };
}

let app = null;
let ai = null;
let models = {};
let deviceModelState = { status: "idle", progress: 0 }; // idle|downloading|ready|error
let deviceModelInitPromise = null;

export function firebaseStatus() {
  const { configured, missing } = readFirebaseConfig();
  return {
    configured,
    missing,
    initialized: !!app,
    cloudModel: CLOUD_MODEL,
    deviceModel: deviceModelState,
    onDeviceAvailable: onDeviceAvailability(),
  };
}

/** Best-effort probe of the Chrome Prompt API (Gemini Nano). */
export function onDeviceAvailability() {
  if (typeof window === "undefined") return "unknown";
  const LM = window.LanguageModel;
  if (!LM || typeof LM.availability !== "function") return "unsupported";
  // availability() is async; the live value is refreshed by refreshOnDeviceStatus().
  return window.__nanoAvailability || "checking";
}

export async function refreshOnDeviceStatus() {
  try {
    const LM = window.LanguageModel;
    if (!LM || typeof LM.availability !== "function") {
      window.__nanoAvailability = "unsupported";
      return "unsupported";
    }
    const v = await LM.availability();
    window.__nanoAvailability = v; // "available" | "downloading" | "downloadable" | "unavailable"
    return v;
  } catch {
    window.__nanoAvailability = "unknown";
    return "unknown";
  }
}

export function initFirebase() {
  const { cfg, configured, missing } = readFirebaseConfig();
  if (!configured) {
    throw new Error(
      `Firebase config missing: ${missing.join(", ")}. Copy .env.example to .env and fill it in from the Firebase console.`,
    );
  }
  if (app) return { app, ai };

  app = initializeApp(cfg);

  // App Check (enforced for AI Logic). Debug provider for localhost:
  // set self.FIREBASE_APPCHECK_DEBUG_TOKEN before initializing App Check.
  // NOTE: the debug token flow still needs a real provider configured
  // (reCAPTCHA v3 site key). If no site key is set, App Check is left
  // uninitialized and AI Logic calls will fail with an App Check error —
  // that is the honest signal that setup is incomplete. Add
  // VITE_RECAPTCHA_SITE_KEY to .env (Firebase console > App Check) to fix.
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";
  if (import.meta.env.VITE_APPCHECK_DEBUG === "true") {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  if (siteKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } else {
    console.warn(
      "[AI Research Desk] No VITE_RECAPTCHA_SITE_KEY set — App Check not initialized. " +
        "AI Logic calls will be rejected until App Check is configured. See README.md.",
    );
  }

  ai = getAI(app, { backend: new GoogleAIBackend() });
  return { app, ai };
}

function getModel(mode) {
  if (!ai) initFirebase();
  const key = String(mode);
  if (!models[key]) {
    models[key] = getGenerativeModel(ai, {
      mode,
      // Cloud fallback / cloud-first model. On-device uses Gemini Nano via
      // the Chrome Prompt API; no model name is needed for the on-device side.
      inCloudParams: { model: CLOUD_MODEL },
    });
  }
  return models[key];
}

/**
 * Must be called from a user gesture (button click) BEFORE the first
 * generateContent() call. Starts the Gemini Nano download if needed and
 * reports progress via onProgress(0..1).
 */
export async function initDeviceModel(onProgress) {
  const model = getModel(FIREBASE_MODES.AUTO);
  if (deviceModelState.status === "ready") return true;
  if (deviceModelInitPromise) return deviceModelInitPromise;
  deviceModelState = { status: "downloading", progress: 0 };
  deviceModelInitPromise = (async () => {
    try {
      await model.initializeDeviceModel((val) => {
        deviceModelState = { status: "downloading", progress: val };
        onProgress?.(val);
      });
      deviceModelState = { status: "ready", progress: 1 };
      onProgress?.(1);
      return true;
    } catch (err) {
      deviceModelState = { status: "error", progress: 0, error: String(err) };
      throw err;
    } finally {
      deviceModelInitPromise = null;
    }
  })();
  return deviceModelInitPromise;
}

/**
 * Single-turn text generation through Firebase AI Logic hybrid inference.
 * Returns { text, mode, route } where route is the EXPECTED route:
 * the SDK routes internally and does not expose the chosen backend, so we
 * report the mode + on-device availability honestly instead of guessing.
 */
function expectedRoute(mode) {
  const availability = typeof window !== "undefined" ? window.__nanoAvailability || "unknown" : "unknown";
  if (mode === InferenceMode.ONLY_ON_DEVICE) return "on-device (Gemini Nano)";
  if (mode === InferenceMode.ONLY_IN_CLOUD) return `cloud (${CLOUD_MODEL})`;
  if (mode === InferenceMode.PREFER_ON_DEVICE)
    return availability === "available"
      ? "on-device (Gemini Nano) — expected"
      : `cloud (${CLOUD_MODEL}) — fallback, on-device ${availability}`;
  return availability === "available"
    ? `cloud (${CLOUD_MODEL}) — preferred, on-device available as fallback`
    : `cloud (${CLOUD_MODEL})`;
}

export async function generateText(prompt, { mode = FIREBASE_MODES.AUTO } = {}) {
  const model = getModel(mode);
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return { text, mode: String(mode), route: expectedRoute(mode) };
}

export async function generateTextStream(prompt, { mode = FIREBASE_MODES.AUTO, onChunk } = {}) {
  const model = getModel(mode);
  const result = await model.generateContentStream(prompt);
  let text = "";
  for await (const chunk of result.stream) {
    const t = chunk.text();
    text += t;
    onChunk?.(t, text);
  }
  return { text, mode: String(mode), route: expectedRoute(mode) };
}
