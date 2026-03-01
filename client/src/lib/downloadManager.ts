/**
 * Offline Download Manager — V2 Chunk-based
 *
 * Downloads audio, encrypts in 5 MB chunks (each with its own IV), and stores
 * each chunk as a separate file.  During playback the chunks are decrypted one
 * at a time and appended to a temporary .mp3 file on disk so that peak memory
 * stays around 10-15 MB regardless of audio size.
 */

import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";
import {
  encryptChunk,
  decryptChunk,
  arrayBufferToBase64,
  ENCRYPTION_CHUNK_SIZE,
  ChunkManifest,
} from "./audioEncryption";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api`;
const STORAGE_PREFIX = "sk_audio_";
const KEY_STORAGE_PREFIX = "sk_key_";
const DEVICE_ID_KEY = "sk_device_id";
const DOWNLOADS_INDEX_KEY = "sk_downloads_index";
const AUDIO_FOLDER = "sk_audio_files";

// ---------------------------------------------------------------------------
// Secure key storage helpers
// ---------------------------------------------------------------------------

const saveSecureKey = async (key: string, value: string): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    try {
      await SecureStoragePlugin.set({ key, value });
    } catch (error) {
      console.warn("Secure storage failed, using fallback:", error);
      await Preferences.set({ key, value });
    }
  } else {
    await Preferences.set({ key, value });
  }
};

const getSecureKey = async (key: string): Promise<string | null> => {
  if (Capacitor.isNativePlatform()) {
    try {
      const { value } = await SecureStoragePlugin.get({ key });
      return value;
    } catch (error) {
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
    } catch {
      // Ignore
    }
  }
  await Preferences.remove({ key });
};

// ---------------------------------------------------------------------------
// Filesystem helpers
// ---------------------------------------------------------------------------

const ensureAudioFolder = async (): Promise<void> => {
  try {
    await Filesystem.mkdir({
      path: AUDIO_FOLDER,
      directory: Directory.Data,
      recursive: true,
    });
  } catch {
    // Directory might already exist
  }
};

// ---------------------------------------------------------------------------
// Encrypt + save (download-time)
// ---------------------------------------------------------------------------

/**
 * Split raw audio into 5 MB chunks, encrypt each one independently, and write
 * the encrypted base64 text + a manifest to the filesystem.
 *
 * Peak memory ≈ 2 × chunkSize (one raw + one encrypted) ≈ 10 MB.
 */
const encryptAndSaveChunks = async (
  lessonId: string,
  audioData: ArrayBuffer,
  hexKey: string,
  onProgress?: (progress: number) => void
): Promise<ChunkManifest> => {
  await ensureAudioFolder();

  const totalSize = audioData.byteLength;
  const numChunks = Math.ceil(totalSize / ENCRYPTION_CHUNK_SIZE);
  const chunks: ChunkManifest["chunks"] = [];

  console.log(
    `[DL] Encrypting ${totalSize} bytes in ${numChunks} chunks of ${ENCRYPTION_CHUNK_SIZE} bytes`
  );

  try {
    for (let i = 0; i < numChunks; i++) {
      const start = i * ENCRYPTION_CHUNK_SIZE;
      const end = Math.min(start + ENCRYPTION_CHUNK_SIZE, totalSize);
      const chunkData = audioData.slice(start, end);

      // Encrypt this chunk (fresh IV each time)
      const { iv, encryptedBase64 } = await encryptChunk(chunkData, hexKey);

      // Write encrypted text to its own file
      await Filesystem.writeFile({
        path: `${AUDIO_FOLDER}/${lessonId}_chunk_${i}.enc`,
        data: encryptedBase64,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });

      chunks.push({ iv, encryptedSize: encryptedBase64.length });

      console.log(
        `[DL] Chunk ${i + 1}/${numChunks} encrypted & saved (${encryptedBase64.length} chars)`
      );
      onProgress?.(Math.round(((i + 1) / numChunks) * 100));
    }
  } catch (error) {
    // Cleanup partial files on failure
    for (let j = 0; j < chunks.length; j++) {
      try {
        await Filesystem.deleteFile({
          path: `${AUDIO_FOLDER}/${lessonId}_chunk_${j}.enc`,
          directory: Directory.Data,
        });
      } catch {
        // Ignore
      }
    }
    throw error;
  }

  const manifest: ChunkManifest = {
    version: 2,
    algorithm: "AES-256-CBC",
    chunkSize: ENCRYPTION_CHUNK_SIZE,
    totalChunks: numChunks,
    chunks,
    metadata: {
      lessonId,
      originalSize: totalSize,
      encryptedAt: new Date().toISOString(),
    },
  };

  // Persist the manifest
  await Filesystem.writeFile({
    path: `${AUDIO_FOLDER}/${lessonId}_manifest.json`,
    data: JSON.stringify(manifest),
    directory: Directory.Data,
    encoding: Encoding.UTF8,
  });

  return manifest;
};

// ---------------------------------------------------------------------------
// Delete helpers
// ---------------------------------------------------------------------------

/**
 * Remove all encrypted chunk files + manifest for a lesson.
 */
const deleteAudioData = async (lessonId: string): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    // Read manifest to discover chunk count
    try {
      const manifestResult = await Filesystem.readFile({
        path: `${AUDIO_FOLDER}/${lessonId}_manifest.json`,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      const manifest: ChunkManifest = JSON.parse(
        manifestResult.data as string
      );

      for (let i = 0; i < manifest.totalChunks; i++) {
        try {
          await Filesystem.deleteFile({
            path: `${AUDIO_FOLDER}/${lessonId}_chunk_${i}.enc`,
            directory: Directory.Data,
          });
        } catch {
          // Ignore
        }
      }
    } catch {
      // Manifest missing — nothing to clean
    }

    // Delete manifest
    try {
      await Filesystem.deleteFile({
        path: `${AUDIO_FOLDER}/${lessonId}_manifest.json`,
        directory: Directory.Data,
      });
    } catch {
      // Ignore
    }

    // Delete temp playback file if it exists
    try {
      await Filesystem.deleteFile({
        path: `${AUDIO_FOLDER}/${lessonId}_temp.mp3`,
        directory: Directory.Data,
      });
    } catch {
      // Ignore
    }
  }

  // Clean up from Preferences (web fallback / legacy)
  await Preferences.remove({ key: `${STORAGE_PREFIX}${lessonId}` });
};

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Device helpers
// ---------------------------------------------------------------------------

export const getDeviceId = async (): Promise<string> => {
  const { value } = await Preferences.get({ key: DEVICE_ID_KEY });
  if (value) return value;

  const platform = Capacitor.getPlatform();
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  const newDeviceId = `${platform}-${timestamp}-${random}`;

  await Preferences.set({ key: DEVICE_ID_KEY, value: newDeviceId });
  return newDeviceId;
};

export const registerDevice = async (token: string): Promise<void> => {
  const deviceId = await getDeviceId();
  const platform = Capacitor.getPlatform();
  const deviceName = `${platform.charAt(0).toUpperCase() + platform.slice(1)} Device`;

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

// ---------------------------------------------------------------------------
// Backend helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Downloads index (stored in Preferences, always small)
// ---------------------------------------------------------------------------

const getDownloadsIndex = async (): Promise<Record<string, DownloadedLesson>> => {
  const { value } = await Preferences.get({ key: DOWNLOADS_INDEX_KEY });
  return value ? JSON.parse(value) : {};
};

const saveDownloadsIndex = async (
  index: Record<string, DownloadedLesson>
): Promise<void> => {
  await Preferences.set({
    key: DOWNLOADS_INDEX_KEY,
    value: JSON.stringify(index),
  });
};

// ---------------------------------------------------------------------------
// Download & encrypt a lesson
// ---------------------------------------------------------------------------

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

    // 1. Authorize
    const { audioUrl, encryptionKey, lesson } = await authorizeDownload(
      lessonId,
      token
    );
    updateProgress("downloading", 10);

    // 2. Stream-download the audio
    console.log(`[DL] Starting download from: ${audioUrl}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300_000); // 5 min

    let chunks: Uint8Array[] = [];
    let receivedBytes = 0;

    try {
      const audioResponse = await fetch(audioUrl, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!audioResponse.ok) {
        throw new Error(
          `Failed to download audio file: ${audioResponse.status} ${audioResponse.statusText}`
        );
      }

      const contentLength = audioResponse.headers.get("content-length");
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
      const reader = audioResponse.body?.getReader();
      if (!reader) throw new Error("Failed to read audio stream");

      console.log(`[DL] Downloading audio, total size: ${totalBytes} bytes`);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedBytes += value.length;

        if (totalBytes > 0) {
          const dlProgress = 10 + (receivedBytes / totalBytes) * 50;
          updateProgress("downloading", Math.min(dlProgress, 60));
        }
      }
      console.log(`[DL] Download completed: ${receivedBytes} bytes`);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === "AbortError") {
        throw new Error(
          "Download timeout. Please check your internet connection and try again."
        );
      }
      throw fetchError;
    }

    // Combine fetch chunks into one ArrayBuffer
    const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
    const audioData = new Uint8Array(totalLength);
    let offset = 0;
    for (const c of chunks) {
      audioData.set(c, offset);
      offset += c.length;
    }
    // Release fetch-chunk references
    chunks = [];

    updateProgress("encrypting", 65);

    // 3. Encrypt in 5 MB chunks & save each to disk
    console.log(
      `[DL] Starting chunk encryption for lesson ${lessonId}, size: ${audioData.byteLength} bytes`
    );
    const manifest = await encryptAndSaveChunks(
      lessonId,
      audioData.buffer,
      encryptionKey,
      (encProgress) => {
        // Map encryption progress 65 → 85
        const overall = 65 + (encProgress / 100) * 20;
        updateProgress(
          encProgress < 100 ? "encrypting" : "saving",
          Math.round(overall)
        );
      }
    );
    console.log(`[DL] Encryption completed: ${manifest.totalChunks} chunks`);

    updateProgress("saving", 88);

    // 4. Save encryption key for offline playback
    await saveSecureKey(`${KEY_STORAGE_PREFIX}${lessonId}`, encryptionKey);

    // 5. Update downloads index
    const totalEncryptedSize = manifest.chunks.reduce(
      (sum, c) => sum + c.encryptedSize,
      0
    );
    const index = await getDownloadsIndex();
    index[lessonId] = {
      lessonId,
      lessonTitle: lesson.title,
      courseId,
      courseTitle: lesson.courseTitle,
      durationSeconds: lesson.durationSeconds,
      downloadedAt: new Date().toISOString(),
      fileSizeBytes: totalEncryptedSize,
    };
    await saveDownloadsIndex(index);

    // 6. Confirm with backend
    await confirmDownload(lessonId, totalEncryptedSize, token);

    updateProgress("completed", 100);
  } catch (error) {
    console.error(`[DL] Download failed for lesson ${lessonId}:`, error);
    const errorMessage =
      error instanceof Error ? error.message : "Download failed";
    updateProgress("error", 0, errorMessage);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Check / list downloads
// ---------------------------------------------------------------------------

export const isLessonDownloaded = async (
  lessonId: string
): Promise<boolean> => {
  const index = await getDownloadsIndex();
  return !!index[lessonId];
};

export const getDownloadedLessons = async (): Promise<DownloadedLesson[]> => {
  const index = await getDownloadsIndex();
  return Object.values(index);
};

export const getDownloadedLessonsForCourse = async (
  courseId: string
): Promise<DownloadedLesson[]> => {
  const index = await getDownloadsIndex();
  return Object.values(index).filter((d) => d.courseId === courseId);
};

// ---------------------------------------------------------------------------
// Load & decrypt for playback  (chunk-by-chunk → temp file → native path)
// ---------------------------------------------------------------------------

/**
 * Decrypt a downloaded lesson chunk-by-chunk and write the result to a temp
 * file on disk.  Returns a web-accessible URL for the temp file that can
 * be passed straight to `new Audio(url)`.
 *
 * Peak memory ≈ 2 × chunkSize ≈ 10 MB (one encrypted + one decrypted buffer
 * exist at the same time; both are released before the next iteration).
 */
export const loadEncryptedAudio = async (
  lessonId: string,
  token: string
): Promise<string> => {
  // 1. Load manifest
  let manifest: ChunkManifest;
  try {
    const manifestResult = await Filesystem.readFile({
      path: `${AUDIO_FOLDER}/${lessonId}_manifest.json`,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    manifest = JSON.parse(manifestResult.data as string);
  } catch {
    throw new Error("Audio not found. Please download the lesson first.");
  }

  // 2. Obtain decryption key (prefer cached → fallback to server)
  let decryptionKey: string;
  const keyStorageKey = `${KEY_STORAGE_PREFIX}${lessonId}`;
  const cachedKey = await getSecureKey(keyStorageKey);

  if (cachedKey) {
    decryptionKey = cachedKey;
  } else {
    try {
      decryptionKey = await getDecryptionKey(lessonId, token);
      await saveSecureKey(keyStorageKey, decryptionKey);
    } catch {
      throw new Error(
        "Failed to get decryption key. Please re-download the lesson while online."
      );
    }
  }

  // 3. Decrypt chunk-by-chunk → write to temp .mp3 on disk
  const tempPath = `${AUDIO_FOLDER}/${lessonId}_temp.mp3`;

  // Remove stale temp file
  try {
    await Filesystem.deleteFile({ path: tempPath, directory: Directory.Data });
  } catch {
    // Ignore
  }

  try {
    for (let i = 0; i < manifest.totalChunks; i++) {
      // Read encrypted base64 text (~6.7 MB for a 5 MB chunk)
      const chunkResult = await Filesystem.readFile({
        path: `${AUDIO_FOLDER}/${lessonId}_chunk_${i}.enc`,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      const encryptedBase64 = chunkResult.data as string;

      // Decrypt → raw audio ArrayBuffer (~5 MB)
      const decryptedBuffer = await decryptChunk(
        encryptedBase64,
        manifest.chunks[i].iv,
        decryptionKey
      );

      // Convert to base64 so Filesystem can write as binary
      const decryptedBase64 = arrayBufferToBase64(decryptedBuffer);

      // Write / append raw binary audio to temp file
      if (i === 0) {
        await Filesystem.writeFile({
          path: tempPath,
          data: decryptedBase64,
          directory: Directory.Data,
          // no encoding → data is treated as base64, written as binary
        });
      } else {
        await Filesystem.appendFile({
          path: tempPath,
          data: decryptedBase64,
          directory: Directory.Data,
        });
      }

      console.log(
        `[DL] Decrypted chunk ${i + 1}/${manifest.totalChunks}`
      );
    }
  } catch (error) {
    // Clean up temp file on failure
    try {
      await Filesystem.deleteFile({
        path: tempPath,
        directory: Directory.Data,
      });
    } catch {
      // Ignore
    }
    console.error("[DL] Decryption failed:", error);
    throw new Error(
      "Failed to decrypt audio. The file may be corrupted or the key is invalid."
    );
  }

  // 4. Convert file path to a web-accessible URL
  const fileInfo = await Filesystem.getUri({
    path: tempPath,
    directory: Directory.Data,
  });

  return Capacitor.convertFileSrc(fileInfo.uri);
};

// ---------------------------------------------------------------------------
// Cleanup temp playback file
// ---------------------------------------------------------------------------

/**
 * Delete the temporary decrypted .mp3 created by `loadEncryptedAudio`.
 * Call this when the player unmounts or the user navigates away.
 */
export const cleanupTempAudio = async (lessonId: string): Promise<void> => {
  try {
    await Filesystem.deleteFile({
      path: `${AUDIO_FOLDER}/${lessonId}_temp.mp3`,
      directory: Directory.Data,
    });
    console.log(`[DL] Temp audio cleaned up for lesson ${lessonId}`);
  } catch {
    // File might not exist — that's fine
  }
};

// ---------------------------------------------------------------------------
// Delete a downloaded lesson
// ---------------------------------------------------------------------------

export const deleteDownloadedLesson = async (
  lessonId: string,
  token?: string
): Promise<void> => {
  // Remove encrypted chunks + manifest + temp file
  await deleteAudioData(lessonId);

  // Remove cached encryption key
  await removeSecureKey(`${KEY_STORAGE_PREFIX}${lessonId}`);

  // Update index
  const index = await getDownloadsIndex();
  delete index[lessonId];
  await saveDownloadsIndex(index);

  // Notify backend (best effort)
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
      console.warn("Failed to notify backend of deletion:", e);
    }
  }
};

/**
 * Delete all downloaded lessons for a specific course.
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
 * Clear all downloads.
 */
export const clearAllDownloads = async (token?: string): Promise<void> => {
  const index = await getDownloadsIndex();

  for (const lessonId of Object.keys(index)) {
    await deleteAudioData(lessonId);
  }

  await Preferences.remove({ key: DOWNLOADS_INDEX_KEY });
  console.log("[DL] All downloads cleared");
};

// ---------------------------------------------------------------------------
// Storage size helpers
// ---------------------------------------------------------------------------

export const getDownloadsStorageSize = async (): Promise<number> => {
  const index = await getDownloadsIndex();
  return Object.values(index).reduce((total, d) => total + d.fileSizeBytes, 0);
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
