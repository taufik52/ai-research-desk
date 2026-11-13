import { defineConfig } from "vite";

// NOTE (12 Nov 2026): the dev-server proxy for the old local demo mode
// that used to live here was removed together with that mode.
// All inference now goes through Firebase AI Logic only. This config keeps
// just the IPv4 bind fix: Vite 8 defaults to ::1 only on this VM, which
// rejects 127.0.0.1.
export default defineConfig({
  server: {
    host: "127.0.0.1", // bind IPv4 explicitly: Vite 8 defaults to ::1 only on this VM
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
  },
});
