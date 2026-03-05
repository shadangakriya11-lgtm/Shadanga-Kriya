import { WebPlugin } from '@capacitor/core';
import type { FileConcatenationPlugin } from './fileConcatenation';

export class FileConcatenationWeb extends WebPlugin implements FileConcatenationPlugin {
  async concatenateFiles(): Promise<{ success: boolean; totalBytes: number }> {
    throw new Error('FileConcatenation is not supported on web');
  }
}
