import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeAuth } from "./lib/api";

// Import platform testing utilities (only in development)
if (import.meta.env.DEV) {
  import('./lib/platformDetection.test');
}

// Initialize auth before rendering app
// This loads the token from persistent storage (Preferences/localStorage)
const init = async () => {
  try {
    console.log("[Main] Starting auth initialization...");
    const hasToken = await initializeAuth();
    console.log("[Main] Auth initialized, hasToken:", hasToken);
  } catch (error) {
    console.error("[Main] Failed to initialize auth:", error);
  }

  // Render app after auth is initialized
  createRoot(document.getElementById("root")!).render(<App />);
};

init();
