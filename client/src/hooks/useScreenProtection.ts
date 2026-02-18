import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import ScreenProtection from '../plugins/screenProtection';

export const useScreenProtection = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Enable protection when component mounts
    ScreenProtection.enableProtection();

    // Listen for screen capture changes (iOS)
    const listener = ScreenProtection.addListener(
      'screenCaptureChanged',
      (info) => {
        if (info.isCaptured) {
          ScreenProtection.showToast({
            message: 'Screen recording is not allowed',
          });
        }
      }
    );

    // Cleanup
    return () => {
      listener.then(l => l.remove());
      ScreenProtection.disableProtection();
    };
  }, []);

  return {
    showToast: (message: string) => {
      if (Capacitor.isNativePlatform()) {
        ScreenProtection.showToast({ message });
      }
    },
    checkScreenCapture: async () => {
      if (Capacitor.isNativePlatform()) {
        const result = await ScreenProtection.isScreenBeingCaptured();
        return result.isCaptured;
      }
      return false;
    },
  };
};
