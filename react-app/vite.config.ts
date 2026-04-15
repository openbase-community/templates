import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";

const cdnBaseUrl = "$${cdn_base_url}";
const useCdnBase = process.env.VITE_USE_CDN === "true";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  base: useCdnBase ? cdnBaseUrl : "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
