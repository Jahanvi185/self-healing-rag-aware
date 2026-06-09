// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     port: 5173,
//     proxy: {
//       "/ask":     "http://localhost:8000",
//       "/ingest":  "http://localhost:8000",
//       "/health":  "http://localhost:8000",
//       "/stats":   "http://localhost:8000",
//     }
//   }
// });
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // This loads your environment variables from Vercel
  const env = loadEnv(mode, process.cwd(), '');
  const API_URL = env.VITE_API_URL || "http://localhost:8000";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/ask": { target: API_URL, changeOrigin: true, secure: false },
        "/ingest": { target: API_URL, changeOrigin: true, secure: false },
        "/health": { target: API_URL, changeOrigin: true, secure: false },
        "/stats": { target: API_URL, changeOrigin: true, secure: false },
      },
    },
  };
});