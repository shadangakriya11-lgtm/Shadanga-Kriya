import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeAuth } from "./lib/api";
import { Capacitor } from "@capacitor/core";

// Import platform testing utilities (only in development)
if (import.meta.env.DEV) {
  import('./lib/platformDetection.test');
}

const applyMotionProfile = () => {
  const root = document.documentElement;
  const addClass = (className: string) => {
    root.classList.add(className);
    if (document.body) {
      document.body.classList.add(className);
    }
  };

  const isNativeShell = Capacitor.isNativePlatform();
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouchShell =
    !isNativeShell && window.matchMedia("(hover: none) and (pointer: coarse)").matches;

  if (isNativeShell) {
    addClass("native-shell");
    return;
  }

  if (isTouchShell || prefersReducedMotion) {
    addClass("touch-shell");
  }
};

// Initialize auth before rendering app
// This loads the token from persistent storage (Preferences/localStorage)
const init = async () => {
  applyMotionProfile();

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
