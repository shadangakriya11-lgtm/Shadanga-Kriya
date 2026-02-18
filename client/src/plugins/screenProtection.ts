import { registerPlugin } from '@capacitor/core';

export interface ScreenProtectionPlugin {
  enableProtection(): Promise<void>;
  disableProtection(): Promise<void>;
  showToast(options: { message: string }): Promise<void>;
  isScreenBeingCaptured(): Promise<{ isCaptured: boolean }>;
  addListener(
    eventName: 'screenCaptureChanged',
    listenerFunc: (info: { isCaptured: boolean }) => void
  ): Promise<any>;
  removeAllListeners(): Promise<void>;
}

const ScreenProtection = registerPlugin<ScreenProtectionPlugin>('ScreenProtection', {
  web: () => import('./screenProtection.web').then(m => new m.ScreenProtectionWeb()),
});

export default ScreenProtection;
