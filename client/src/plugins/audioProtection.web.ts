import { WebPlugin } from '@capacitor/core';
import type { AudioProtectionPlugin } from './audioProtection';

export class AudioProtectionWeb extends WebPlugin implements AudioProtectionPlugin {
  async startMonitoring(): Promise<void> {
    console.log('Audio protection monitoring is only available on native platforms');
  }

  async stopMonitoring(): Promise<void> {
    console.log('Audio protection monitoring is only available on native platforms');
  }

  async isScreenRecording(): Promise<{ isRecording: boolean }> {
    return { isRecording: false };
  }
}
