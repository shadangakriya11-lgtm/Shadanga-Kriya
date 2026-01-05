import { Capacitor } from "@capacitor/core";

/**
 * Check if the device is in airplane/flight mode
 * Note: This feature is platform-specific and may have limitations
 */
export async function isAirplaneModeEnabled(): Promise<boolean> {
  // For web, we cannot directly detect airplane mode
  if (!Capacitor.isNativePlatform()) {
    console.warn(
      "Airplane mode detection is only available on native platforms"
    );
    return false;
  }

  try {
    // On Android, we can check network connectivity
    // If all network types are unavailable, likely in airplane mode
    if (Capacitor.getPlatform() === "android") {
      const { Network } = await import("@capacitor/network");
      const status = await Network.getStatus();

      // If not connected to any network type, likely in airplane mode
      return !status.connected;
    }

    // On iOS, airplane mode detection is more complex
    // We'll use network connectivity as a proxy
    if (Capacitor.getPlatform() === "ios") {
      const { Network } = await import("@capacitor/network");
      const status = await Network.getStatus();

      // If not connected to any network type, likely in airplane mode
      return !status.connected;
    }

    return false;
  } catch (error) {
    console.error("Error checking airplane mode:", error);
    return false;
  }
}

/**
 * Check if earphones/headphones are connected
 */
export async function areEarphonesConnected(): Promise<boolean> {
  // For web, we can use Web Audio API to detect audio output devices
  if (!Capacitor.isNativePlatform()) {
    try {
      // Request permission to enumerate devices
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = devices.filter(
        (device) => device.kind === "audiooutput"
      );

      // Check if there are any audio output devices besides the default speaker
      // This is a heuristic - not perfect but works in most cases
      return (
        audioOutputs.length > 1 ||
        audioOutputs.some(
          (device) =>
            device.label.toLowerCase().includes("headphone") ||
            device.label.toLowerCase().includes("earphone") ||
            device.label.toLowerCase().includes("headset") ||
            device.label.toLowerCase().includes("bluetooth")
        )
      );
    } catch (error) {
      console.error("Error checking earphones on web:", error);
      return false;
    }
  }

  try {
    // For native platforms, we need a custom plugin or check audio route
    // As a fallback, we'll use a manual confirmation approach

    // Check if audio output route has changed
    // This would require a native plugin for accurate detection
    // For now, return false to prompt manual confirmation
    console.warn("Native earphone detection requires additional setup");
    return false;
  } catch (error) {
    console.error("Error checking earphones:", error);
    return false;
  }
}

/**
 * Monitor network status changes
 */
export function onNetworkStatusChange(
  callback: (isConnected: boolean) => void
) {
  if (!Capacitor.isNativePlatform()) {
    // For web, use online/offline events
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }

  // For native platforms
  import("@capacitor/network").then(({ Network }) => {
    Network.addListener("networkStatusChange", (status) => {
      callback(status.connected);
    });
  });

  return () => {
    import("@capacitor/network").then(({ Network }) => {
      Network.removeAllListeners();
    });
  };
}

/**
 * Request the user to enable airplane mode with platform-specific instructions
 */
export function getAirplaneModeInstructions(): string {
  const platform = Capacitor.getPlatform();

  if (platform === "android") {
    return "Swipe down from the top of your screen and tap the airplane icon, or go to Settings > Network & Internet > Airplane mode";
  } else if (platform === "ios") {
    return "Open Control Center by swiping down from the top-right corner (or up from bottom on older devices) and tap the airplane icon";
  } else {
    return "Please enable airplane mode on your device to prevent interruptions";
  }
}

/**
 * Open device settings for airplane mode
 */
export async function openAirplaneModeSettings() {
  if (!Capacitor.isNativePlatform()) {
    alert(getAirplaneModeInstructions());
    return;
  }

  try {
    // Try to open settings app
    if (Capacitor.getPlatform() === "android") {
      // On Android, we can try to open network settings
      window.open("app-settings:", "_system");
    } else if (Capacitor.getPlatform() === "ios") {
      // On iOS, open settings app
      window.open("app-settings:", "_system");
    }
  } catch (error) {
    console.error("Error opening settings:", error);
    alert(getAirplaneModeInstructions());
  }
}
