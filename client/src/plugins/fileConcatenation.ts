import { registerPlugin } from '@capacitor/core';

export interface FileConcatenationPlugin {
  concatenateFiles(options: {
    outputPath: string;
    inputPaths: string[];
  }): Promise<{ success: boolean; totalBytes: number }>;
}

const FileConcatenation = registerPlugin<FileConcatenationPlugin>('FileConcatenation', {
  web: () => import('./fileConcatenation.web').then(m => new m.FileConcatenationWeb()),
});

export default FileConcatenation;
