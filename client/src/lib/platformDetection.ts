import { Capacitor } from '@capacitor/core';

/**
 * Platform detection utilities for handling iOS App Store compliance
 * 
 * iOS App Store requires "Reader" app mode:
 * - No payment UI (Buy buttons, prices, payment modals)
 * - No purchase-related text ("Buy", "Purchase", "Price")
 * - Users must purchase on website, then access content in iOS app
 */

/**
 * Check if running on iOS native app
 */
export const isIOSApp = (): boolean => {
  return Capacitor.getPlatform() === 'ios';
};

/**
 * Check if running on Android native app
 */
export const isAndroidApp = (): boolean => {
  return Capacitor.getPlatform() === 'android';
};

/**
 * Check if running in web browser
 */
export const isWebPlatform = (): boolean => {
  return Capacitor.getPlatform() === 'web';
};

/**
 * Check if running on any native platform (iOS or Android)
 */
export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Check if payment features should be shown
 * Returns false for iOS (Reader app mode), true for web/Android
 */
export const shouldShowPaymentFeatures = (): boolean => {
  return !isIOSApp();
};

/**
 * Check if pricing information should be displayed
 * Returns false for iOS (Reader app mode), true for web/Android
 */
export const shouldShowPricing = (): boolean => {
  return !isIOSApp();
};

/**
 * Get platform-specific message for locked courses
 */
export const getLockedCourseMessage = (): string => {
  if (isIOSApp()) {
    // Apple compliance: Cannot mention website, purchase, or any external links
    return 'This course is not available in your account.';
  }
  return 'Purchase this course to unlock all lessons and content.';
};

/**
 * Get platform name for debugging/logging
 */
export const getPlatformName = (): string => {
  return Capacitor.getPlatform();
};
