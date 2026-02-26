/**
 * Offline Download Manager
 * Handles downloading, encrypting, and storing audio files for offline use
 */

import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";
import {
  createEncryptedPackage,
  decryptPackage,
  createAudioBlobUrl,
  revokeAudioBlobUrl,
  EncryptedAudioPackage,
} from "./audioEncryption";

const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api`;
const STORAGE_PREFIX = "sk_audio_";
const KEY_STORAGE_PREFIX = "sk_key_";
const DEVICE_ID_KEY = "sk_device_id";
const DOWNLOADS_INDEX_KEY = "sk_downloads_index";
const AUDIO_FOLDER = "sk_audio_files";

/**
 * Secure key storage helpers - uses native secure storage on mobile, falls back to Preferences on web
 */
const saveSecureKey = async (key: string, value: string): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    try {
      await SecureStoragePlugin.set({ key, value });
    } catch (error) {
      // Fallback to Preferences if secure storage fails
      console.warn("Secure storage failed, using fallback:", error);
      await Preferences.set({ key, value });
    }
  } else {
    // Web fallback - use regular preferences
    await Preferences.set({ key, value });
  }
};

const getSecureKey = async (key: string): Promise<string | null> => {
  if (Capacitor.isNativePlatform()) {
    try {
      const { value } = await SecureStoragePlugin.get({ key });
      return value;
    } catch (error) {
      // Try fallback preferences
      const { value } = await Preferences.get({ key });
      return value;
    }
  } else {
    const { value } = await Preferences.get({ key });
    return value;
  }
};

const removeSecureKey = async (key: string): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    try {
      await SecureStoragePlugin.remove({ key });
    } catch (error) {
      // Ignore errors for remove
    }
  }
  // Also remove from preferences (fallback cleanup)
  await Preferences.remove({ key });
};

/**
 * Save encrypted audio to filesystem (for large files) or Preferences (for small files/web)
 * For native: Always use chunking for files > 50MB to avoid crashes
 */
const saveAudioData = async (
  lessonId: string,
  encryptedPackage: EncryptedAudioPackage
): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    try {
      // Ensure directory exists
      try {
        await Filesystem.mkdir({
          path: AUDIO_FOLDER,
          directory: Directory.Data,
          recursive: true,
        });
      } catch (e) {
        // Directory might already exist
      }

      const metadata = {
        version: encryptedPackage.version,
        algorithm: encryptedPackage.algorithm,
        iv: encryptedPackage.iv,
        metadata: encryptedPackage.metadata
      };
      
      // Save metadata
      await Filesystem.writeFile({
        path: `${AUDIO_FOLDER}/${lessonId}_meta.json`,
        data: JSON.stringify(metadata),
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      
      const data = encryptedPackage.data;
      const FILE_SIZE_LIMIT = 50 * 1024 * 1024; // 50 MB limit for single file
      
      // For large files, always use chunking to avoid crashes
      if (data.length > FILE_SIZE_LIMIT) {
        console.log(`File size ${data.length} bytes exceeds limit, using chunked storage`);
        
        const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB chunks
        const numChunks = Math.ceil(data.length / CHUNK_SIZE);
        
        for (let i = 0; i < numChunks; i++) {
          const start = i * CHUNK_SIZE;
          let end = Math.min(start + CHUNK_SIZE, data.length);
          
          // IMPORTANT: Align to base64 boundary (multiple of 4)
          // Base64 strings must be split at positions divisible by 4
          if (end < data.length) {
            // Align end position to nearest 4-byte boundary
            const remainder = end % 4;
            if (remainder !== 0) {
              end = end - remainder;
            }
          }
          
          const chunk = data.substring(start, end);
          
          await Filesystem.writeFile({
            path: `${AUDIO_FOLDER}/${lessonId}_data_${i}.b64`,
            data: chunk,
            directory: Directory.Data,
            encoding: Encoding.UTF8,
          });
          
          console.log(`Written chunk ${i + 1}/${numChunks}, size: ${chunk.length} bytes`);
        }
        
        // Save chunk info
        await Filesystem.writeFile({
          path: `${AUDIO_FOLDER}/${lessonId}_chunks.json`,
          data: JSON.stringify({ numChunks }),
          directory: Directory.Data,
          encoding: Encoding.UTF8,
        });
        
        console.log(`File write completed in ${numChunks} chunks: ${lessonId}`);
      } else {
        // Small file, write directly
        console.log(`Writing encrypted data, size: ${data.length} bytes`);
        await Filesystem.writeFile({
          path: `${AUDIO_FOLDER}/${lessonId}_data.b64`,
          data: data,
          directory: Directory.Data,
          encoding: Encoding.UTF8,
        });
        console.log(`File write completed: ${lessonId}`);
      }
    } catch (error: any) {
      console.error("Filesystem write failed:", error);
      
      // Check for storage full errors
      if (
        error?.message?.includes("ENOSPC") ||
        error?.message?.includes("No space")
      ) {
        throw new Error(
          "Device storage is full. Please free up some space and try again."
        );
      }
      throw new Error(
        "Failed to save audio file. Please check your device storage."
      );
    }
  } else {
    // Web fallback - use Preferences (has size limits)
    const data = JSON.stringify(encryptedPackage);
    try {
      const storageKey = `${STORAGE_PREFIX}${lessonId}`;
      await Preferences.set({ key: storageKey, value: data });
    } catch (error: any) {
      console.error("Storage write failed:", error);
      if (
        error?.message?.includes("QuotaExceeded") ||
        error?.name === "QuotaExceededError"
      ) {
        throw new Error(
          "Storage limit reached. Offline downloads are only available in the mobile app. Please install the app to download lessons for offline use."
        );
      }
      throw new Error("Failed to save audio file. Storage may be full.");
    }
  }
};

/**
 * Load encrypted audio from filesystem or Preferences
 */
const loadAudioData = async (
  lessonId: string
): Promise<EncryptedAudioPackage | null> => {
  if (Capacitor.isNativePlatform()) {
    try {
      // Load metadata
      console.log(`Loading metadata for lesson ${lessonId}`);
      const metaResult = await Filesystem.readFile({
        path: `${AUDIO_FOLDER}/${lessonId}_meta.json`,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      const metadata = JSON.parse(metaResult.data as string);
      console.log(`Metadata loaded successfully`);
      
      // Check if file was saved in chunks
      try {
        const chunksInfo = await Filesystem.readFile({
          path: `${AUDIO_FOLDER}/${lessonId}_chunks.json`,
          directory: Directory.Data,
          encoding: Encoding.UTF8,
        });
        const { numChunks } = JSON.parse(chunksInfo.data as string);
        console.log(`Loading ${numChunks} chunks`);
        
        // Load all chunks
        let combinedData = '';
        for (let i = 0; i < numChunks; i++) {
          const chunkResult = await Filesystem.readFile({
            path: `${AUDIO_FOLDER}/${lessonId}_data_${i}.b64`,
            directory: Directory.Data,
            encoding: Encoding.UTF8,
          });
          combinedData += chunkResult.data as string;
          console.log(`Loaded chunk ${i + 1}/${numChunks}`);
        }
        
        console.log(`All chunks loaded, total size: ${combinedData.length} bytes`);
        return {
          ...metadata,
          data: combinedData
        };
      } catch (chunkError) {
        // Not chunked, try single file
        console.log(`Not chunked, loading single file`);
      }
      
      // Load encrypted data - try different formats
      console.log(`Loading encrypted data for lesson ${lessonId}`);
      const formats = ['.b64', '.dat', '.txt'];
      
      for (const ext of formats) {
        try {
          const dataResult = await Filesystem.readFile({
            path: `${AUDIO_FOLDER}/${lessonId}_data${ext}`,
            directory: Directory.Data,
            encoding: Encoding.UTF8,
          });
          console.log(`Loaded encrypted data from ${ext} file, size: ${(dataResult.data as string).length} bytes`);
          
          return {
            ...metadata,
            data: dataResult.data as string
          };
        } catch (e) {
          // Try next format
          continue;
        }
      }
      
      throw new Error("No data file found");
    } catch (error) {
      console.error("Failed to load new format, trying old format:", error);
      // Try old format for backward compatibility
      try {
        const result = await Filesystem.readFile({
          path: `${AUDIO_FOLDER}/${lessonId}.json`,
          directory: Directory.Data,
          encoding: Encoding.UTF8,
        });
        return JSON.parse(result.data as string);
      } catch (e) {
        console.error("Failed to load old format too:", e);
        return null;
      }
    }
  } else {
    // Web fallback
    const storageKey = `${STORAGE_PREFIX}${lessonId}`;
    const { value } = await Preferences.get({ key: storageKey });
    return value ? JSON.parse(value) : null;
  }
};

/**
 * Delete audio data from filesystem or Preferences
 */
const deleteAudioData = async (lessonId: string): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    // Delete metadata
    try {
      await Filesystem.deleteFile({
        path: `${AUDIO_FOLDER}/${lessonId}_meta.json`,
        directory: Directory.Data,
      });
    } catch (error) {
      // File might not exist
    }
    
    // Delete chunked files if they exist
    try {
      const chunksInfo = await Filesystem.readFile({
        path: `${AUDIO_FOLDER}/${lessonId}_chunks.json`,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      const { numChunks } = JSON.parse(chunksInfo.data as string);
      
      for (let i = 0; i < numChunks; i++) {
        try {
          await Filesystem.deleteFile({
            path: `${AUDIO_FOLDER}/${lessonId}_data_${i}.b64`,
            directory: Directory.Data,
          });
        } catch (e) {
          // Ignore
        }
      }
      
      await Filesystem.deleteFile({
        path: `${AUDIO_FOLDER}/${lessonId}_chunks.json`,
        directory: Directory.Data,
      });
    } catch (error) {
      // Not chunked
    }
    
    // Delete single data files (all formats)
    const formats = ['.b64', '.dat', '.txt', '.json'];
    for (const ext of formats) {
      try {
        await Filesystem.deleteFile({
          path: `${AUDIO_FOLDER}/${lessonId}_data${ext}`,
          directory: Directory.Data,
        });
      } catch (error) {
        // File might not exist
      }
      
      // Also try without _data prefix (old format)
      try {
        await Filesystem.deleteFile({
          path: `${AUDIO_FOLDER}/${lessonId}${ext}`,
          directory: Directory.Data,
        });
      } catch (error) {
        // File might not exist
      }
    }
  }
  
  // Also clean up Preferences (for migration/fallback)
  const storageKey = `${STORAGE_PREFIX}${lessonId}`;
  await Preferences.remove({ key: storageKey });
};

export interface DownloadedLesson {
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseTitle: string;
  durationSeconds: number;
  downloadedAt: string;
  fileSizeBytes: number;
}

export interface DownloadProgress {
  lessonId: string;
  status:
  | "pending"
  | "downloading"
  | "encrypting"
  | "saving"
  | "completed"
  | "error";
  progress: number;
  error?: string;
}

/**
 * Generate or retrieve a unique device ID
 */
export const getDeviceId = async (): Promise<string> => {
  const { value } = await Preferences.get({ key: DEVICE_ID_KEY });

  if (value) {
    return value;
  }

  // Generate new device ID
  const platform = Capacitor.getPlatform();
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  const newDeviceId = `${platform}-${timestamp}-${random}`;

  await Preferences.set({ key: DEVICE_ID_KEY, value: newDeviceId });
  return newDeviceId;
};

/**
 * Register device with backend
 */
export const registerDevice = async (token: string): Promise<void> => {
  const deviceId = await getDeviceId();
  const platform = Capacitor.getPlatform();
  const deviceName = `${platform.charAt(0).toUpperCase() + platform.slice(1)
    } Device`;

  const response = await fetch(`${API_BASE}/downloads/devices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ deviceId, deviceName, platform }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to register device");
  }
};

/**
 * Get download authorization from backend
 */
const authorizeDownload = async (
  lessonId: string,
  token: string
): Promise<{
  audioUrl: string;
  encryptionKey: string;
  lesson: { title: string; courseTitle: string; durationSeconds: number };
}> => {
  const deviceId = await getDeviceId();

  const response = await fetch(`${API_BASE}/downloads/authorize/${lessonId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ deviceId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to authorize download");
  }

  const data = await response.json();
  return {
    audioUrl: data.lesson.audioUrl,
    encryptionKey: data.encryption.key,
    lesson: {
      title: data.lesson.title,
      courseTitle: data.lesson.courseTitle,
      durationSeconds: data.lesson.durationSeconds,
    },
  };
};

/**
 * Confirm download with backend
 */
const confirmDownload = async (
  lessonId: string,
  fileSizeBytes: number,
  token: string
): Promise<void> => {
  const deviceId = await getDeviceId();

  await fetch(`${API_BASE}/downloads/confirm/${lessonId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ deviceId, fileSizeBytes }),
  });
};

/**
 * Get decryption key for playback
 */
export const getDecryptionKey = async (
  lessonId: string,
  token: string
): Promise<string> => {
  const deviceId = await getDeviceId();

  const response = await fetch(`${API_BASE}/downloads/decrypt/${lessonId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ deviceId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get decryption key");
  }

  const data = await response.json();
  return data.key;
};

/**
 * Get downloads index from storage
 */
const getDownloadsIndex = async (): Promise<
  Record<string, DownloadedLesson>
> => {
  const { value } = await Preferences.get({ key: DOWNLOADS_INDEX_KEY });
  return value ? JSON.parse(value) : {};
};

/**
 * Save downloads index to storage
 */
const saveDownloadsIndex = async (
  index: Record<string, DownloadedLesson>
): Promise<void> => {
  await Preferences.set({
    key: DOWNLOADS_INDEX_KEY,
    value: JSON.stringify(index),
  });
};

/**
 * Download and encrypt an audio file
 */
export const downloadLesson = async (
  lessonId: string,
  courseId: string,
  token: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<void> => {
  const updateProgress = (
    status: DownloadProgress["status"],
    progress: number,
    error?: string
  ) => {
    onProgress?.({ lessonId, status, progress, error });
  };

  try {
    updateProgress("pending", 0);

    // 1. Get authorization and encryption key
    const { audioUrl, encryptionKey, lesson } = await authorizeDownload(
      lessonId,
      token
    );

    updateProgress("downloading", 10);

    // 2. Download the audio file with timeout
    console.log(`Starting download from: ${audioUrl}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
    
    let chunks: Uint8Array[] = [];
    let receivedBytes = 0;
    
    try {
      const audioResponse = await fetch(audioUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!audioResponse.ok) {
        throw new Error(`Failed to download audio file: ${audioResponse.status} ${audioResponse.statusText}`);
      }

      const contentLength = audioResponse.headers.get("content-length");
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

      // Read with progress tracking
      const reader = audioResponse.body?.getReader();
      if (!reader) {
        throw new Error("Failed to read audio stream");
      }

      console.log(`Downloading audio, total size: ${totalBytes} bytes`);
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedBytes += value.length;

        if (totalBytes > 0) {
          const downloadProgress = 10 + (receivedBytes / totalBytes) * 50;
          updateProgress("downloading", Math.min(downloadProgress, 60));
          
          // Log progress every 10%
          if (receivedBytes % Math.floor(totalBytes / 10) < value.length) {
            console.log(`Download progress: ${Math.round((receivedBytes / totalBytes) * 100)}%`);
          }
        }
      }
      
      console.log(`Download completed: ${receivedBytes} bytes received`);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error("Download timeout. Please check your internet connection and try again.");
      }
      throw fetchError;
    }

    // Combine chunks into single ArrayBuffer
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const audioData = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      audioData.set(chunk, offset);
      offset += chunk.length;
    }

    updateProgress("encrypting", 65);

    // 3. Encrypt the audio with progress updates
    console.log(`Starting encryption for lesson ${lessonId}, size: ${audioData.buffer.byteLength} bytes`);
    const encryptedPackage = await createEncryptedPackage(
      audioData.buffer,
      encryptionKey,
      lessonId,
      (encryptProgress) => {
        // Map encryption progress from 65% to 75%
        const overallProgress = 65 + (encryptProgress / 100) * 10;
        updateProgress("encrypting", Math.round(overallProgress));
      }
    );
    console.log(`Encryption completed, encrypted size: ${encryptedPackage.data.length} bytes`);
    
    updateProgress("saving", 80);

    // 4. Save encrypted audio to storage (filesystem on native, preferences on web)
    console.log(`Starting file save for lesson ${lessonId}`);
    await saveAudioData(lessonId, encryptedPackage);
    console.log(`File save completed for lesson ${lessonId}`);

    // 4.5. Save encryption key for offline playback (using secure storage)
    const keyStorageKey = `${KEY_STORAGE_PREFIX}${lessonId}`;
    await saveSecureKey(keyStorageKey, encryptionKey);

    // 5. Update downloads index
    const index = await getDownloadsIndex();
    index[lessonId] = {
      lessonId,
      lessonTitle: lesson.title,
      courseId,
      courseTitle: lesson.courseTitle,
      durationSeconds: lesson.durationSeconds,
      downloadedAt: new Date().toISOString(),
      fileSizeBytes: encryptedPackage.data.length,
    };
    await saveDownloadsIndex(index);

    // 6. Confirm with backend
    await confirmDownload(lessonId, encryptedPackage.data.length, token);

    updateProgress("completed", 100);
  } catch (error) {
    console.error(`Download failed for lesson ${lessonId}:`, error);
    const errorMessage =
      error instanceof Error ? error.message : "Download failed";
    updateProgress("error", 0, errorMessage);
    throw error;
  }
};

/**
 * Check if a lesson is downloaded
 */
export const isLessonDownloaded = async (
  lessonId: string
): Promise<boolean> => {
  const index = await getDownloadsIndex();
  return !!index[lessonId];
};

/**
 * Get all downloaded lessons
 */
export const getDownloadedLessons = async (): Promise<DownloadedLesson[]> => {
  const index = await getDownloadsIndex();
  return Object.values(index);
};

/**
 * Get downloaded lessons for a specific course
 */
export const getDownloadedLessonsForCourse = async (
  courseId: string
): Promise<DownloadedLesson[]> => {
  const index = await getDownloadsIndex();
  return Object.values(index).filter((d) => d.courseId === courseId);
};

/**
 * Load and decrypt audio for playback
 * Uses cached encryption key for truly offline playback
 */
export const loadEncryptedAudio = async (
  lessonId: string,
  token: string
): Promise<string> => {
  // 1. Load encrypted package from storage
  const encryptedPackage = await loadAudioData(lessonId);

  if (!encryptedPackage) {
    throw new Error("Audio not found. Please download the lesson first.");
  }

  // 2. Get decryption key - first try cached key, then fallback to server
  let decryptionKey: string;

  // Try to get cached key first (for true offline playback) - uses secure storage on mobile
  const keyStorageKey = `${KEY_STORAGE_PREFIX}${lessonId}`;
  const cachedKey = await getSecureKey(keyStorageKey);

  if (cachedKey) {
    // Use cached key for offline playback
    decryptionKey = cachedKey;
  } else {
    // Fallback to server request (for backward compatibility)
    try {
      decryptionKey = await getDecryptionKey(lessonId, token);
      // Cache the key for future offline use (using secure storage)
      await saveSecureKey(keyStorageKey, decryptionKey);
    } catch (error) {
      throw new Error(
        "Failed to get decryption key. Please re-download the lesson while online."
      );
    }
  }

  // 3. Decrypt the audio
  const decryptedData = await decryptPackage(encryptedPackage, decryptionKey);

  // 4. Create blob URL for playback
  return createAudioBlobUrl(decryptedData);
};

/**
 * Delete a downloaded lesson
 */
export const deleteDownloadedLesson = async (
  lessonId: string,
  token?: string
): Promise<void> => {
  // Remove encrypted audio from storage
  await deleteAudioData(lessonId);

  // Remove cached encryption key (from secure storage)
  const keyStorageKey = `${KEY_STORAGE_PREFIX}${lessonId}`;
  await removeSecureKey(keyStorageKey);

  // Update index
  const index = await getDownloadsIndex();
  delete index[lessonId];
  await saveDownloadsIndex(index);

  // Notify backend if token available
  if (token) {
    const deviceId = await getDeviceId();
    try {
      await fetch(`${API_BASE}/downloads/${lessonId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deviceId }),
      });
    } catch (e) {
      // Ignore backend errors - local delete is sufficient
      console.warn("Failed to notify backend of deletion:", e);
    }
  }
};

/**
 * Delete all downloaded lessons for a specific course
 */
export const deleteDownloadsForCourse = async (
  courseId: string,
  token?: string
): Promise<number> => {
  const downloadsForCourse = await getDownloadedLessonsForCourse(courseId);

  let deletedCount = 0;
  for (const download of downloadsForCourse) {
    try {
      await deleteDownloadedLesson(download.lessonId, token);
      deletedCount++;
    } catch (e) {
      console.warn(`Failed to delete lesson ${download.lessonId}:`, e);
    }
  }

  return deletedCount;
};

/**
 * Clear all downloads
 */
export const clearAllDownloads = async (token?: string): Promise<void> => {
  const index = await getDownloadsIndex();

  // Delete all encrypted files
  for (const lessonId of Object.keys(index)) {
    await deleteAudioData(lessonId);
  }

  // Clear index
  await Preferences.remove({ key: DOWNLOADS_INDEX_KEY });

  console.log("All downloads cleared");
};

/**
 * Get total storage used by downloads
 */
export const getDownloadsStorageSize = async (): Promise<number> => {
  const index = await getDownloadsIndex();
  return Object.values(index).reduce((total, d) => total + d.fileSizeBytes, 0);
};

/**
 * Format bytes to human readable
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Export cleanup function for blob URLs
export { revokeAudioBlobUrl };
