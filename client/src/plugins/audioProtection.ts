import { registerPlugin } from '@capacitor/core';

export interface AudioProtectionPlugin {
  startMonitoring(): Promise<void>;
  stopMonitoring(): Promise<void>;
  isScreenRecording(): Promise<{ isRecording: boolean }>;
  addListener(
    eventName: 'screenRecordingChanged',
    listenerFunc: (info: { isRecording: boolean }) => void
  ): Promise<any>;
  removeAllListeners(): Promise<void>;
}

const AudioProtection = registerPlugin<AudioProtectionPlugin>('AudioProtection', {
  web: () => import('./audioProtection.web').then(m => new m.AudioProtectionWeb()),
});

export default AudioProtection;
