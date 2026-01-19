import { Capacitor } from "@capacitor/core";

interface HeadphoneDetectionPlugin {
  isConnected: () => Promise<{ isConnected: boolean }>;
  isAirplaneModeEnabled?: () => Promise<{ isEnabled: boolean }>;
}

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
    // On Android, use our native plugin if available
    if (Capacitor.getPlatform() === "android") {
      try {
        const { registerPlugin } = await import("@capacitor/core");
        const HeadphoneDetection = registerPlugin<HeadphoneDetectionPlugin>("HeadphoneDetection");

        if (HeadphoneDetection.isAirplaneModeEnabled) {
          const result = await HeadphoneDetection.isAirplaneModeEnabled();
          return result.isEnabled === true;
        }
      } catch (nativeError) {
        console.warn("Native airplane check failed, trying network status:", nativeError);
      }

      // Fallback to network status
      const { Network } = await import("@capacitor/network");
      const status = await Network.getStatus();
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
  // For native Android, use the native HeadphoneDetection plugin
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
    try {
      const { registerPlugin } = await import("@capacitor/core");
      const HeadphoneDetection = registerPlugin<HeadphoneDetectionPlugin>("HeadphoneDetection");
      const result = await HeadphoneDetection.isConnected();
      console.log("Native headphone detection result:", result);
      return result.isConnected === true;
    } catch (error) {
      console.error("Native headphone detection failed, falling back to web API:", error);
      // Fall through to web detection
    }
  }

  // Web/fallback detection
  try {
    // Request permission to enumerate devices (required on most browsers)
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (permError) {
      console.warn("Could not get audio permission:", permError);
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioOutputs = devices.filter(
      (device) => device.kind === "audiooutput"
    );

    console.log("Audio output devices:", audioOutputs.map(d => d.label || d.deviceId));

    const hasExternalAudio = audioOutputs.some((device) => {
      const label = device.label.toLowerCase();
      return (
        label.includes("headphone") ||
        label.includes("earphone") ||
        label.includes("headset") ||
        label.includes("bluetooth") ||
        label.includes("airpod") ||
        label.includes("wired") ||
        label.includes("external") ||
        label.includes("usb")
      );
    });

    if (hasExternalAudio) {
      return true;
    }

    if (audioOutputs.length > 2) {
      return true;
    }

    const audioInputs = devices.filter(
      (device) => device.kind === "audioinput"
    );

    const hasHeadsetMic = audioInputs.some((device) => {
      const label = device.label.toLowerCase();
      return (
        label.includes("headset") ||
        label.includes("wired") ||
        label.includes("headphone") ||
        label.includes("bluetooth")
      );
    });

    if (hasHeadsetMic) {
      return true;
    }

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