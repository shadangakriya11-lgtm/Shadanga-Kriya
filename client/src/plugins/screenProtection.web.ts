import { WebPlugin } from '@capacitor/core';
import type { ScreenProtectionPlugin } from './screenProtection';

export class ScreenProtectionWeb extends WebPlugin implements ScreenProtectionPlugin {
  async enableProtection(): Promise<void> {
    console.log('Screen protection is only available on native platforms');
  }

  async disableProtection(): Promise<void> {
    console.log('Screen protection is only available on native platforms');
  }

  async showToast(options: { message: string }): Promise<void> {
    console.log('Toast:', options.message);
    // For web, you could use your existing toast notification system
  }

  async isScreenBeingCaptured(): Promise<{ isCaptured: boolean }> {
    return { isCaptured: false };
  }
}
