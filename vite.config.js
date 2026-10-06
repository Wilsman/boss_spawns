import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { changelogPlugin } from "./vite-plugin-changelog.ts";

export default defineConfig({
  plugins: [react(), changelogPlugin()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  server: {
    port: 5173,
  },
});
