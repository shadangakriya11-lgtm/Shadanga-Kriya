import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';

export function useFocusMode(isActive: boolean) {
    useEffect(() => {
        // Only run on native platforms
        if (!Capacitor.isNativePlatform()) return;

        const enableFocus = async () => {
            try {
                // 1. Hide Status Bar (Immersive)
                await StatusBar.hide();
            } catch (err) {
                console.warn('Failed to enable Focus Mode:', err);
            }
        };

        const disableFocus = async () => {
            try {
                // 2. Show Status Bar
                await StatusBar.show();
            } catch (err) {
                console.warn('Failed to disable Focus Mode:', err);
            }
        };

        if (isActive) {
            enableFocus();
        } else {
            disableFocus();
        }

        // Cleanup on unmount
        return () => {
            if (isActive && Capacitor.isNativePlatform()) {
                disableFocus();
            }
        };
    }, [isActive]);
}
