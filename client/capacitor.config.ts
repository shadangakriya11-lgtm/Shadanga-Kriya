import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.shadangakriya.app",
  appName: "Shadanga Kriya",
  webDir: "dist",
  ios: {
    contentInset: "always",
    allowsLinkPreview: true,
    scrollEnabled: true,
    backgroundColor: "#fdfcfa",
  },
  android: {
    allowMixedContent: true,
    backgroundColor: "#fdfcfa",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#fdfcfa",
      showSpinner: false,
      iosSpinnerStyle: "small",
      androidSpinnerStyle: "large",
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#fdfcfa",
      overlaysWebView: false,
    },
  },
};

export default config;
