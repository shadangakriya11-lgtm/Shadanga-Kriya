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
import FileConcatenation from "../plugins/fileConcatenation";
import {
  encryptChunk,
  decryptChunk,
  arrayBufferToBase64,
  ENCRYPTION_CHUNK_SIZE,
  ChunkManifest,
} from "./audioEncryption";

// Helper to convert hex to ArrayBuffer (if not already imported)
const hexToArrayBuffer = (hex: string): ArrayBuffer => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
};

// Helper to convert ArrayBuffer to hex
const arrayBufferToHex = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api`;
const STORAGE_PREFIX = "sk_audio_";
const KEY_STORAGE_PREFIX = "sk_key_";
const DEVICE_ID_KEY = "sk_device_id";
const DOWNLOADS_INDEX_KEY = "sk_downloads_index";
const AUDIO_FOLDER = "sk_audio_files";

// Download/decryption locks to prevent race conditions
const downloadLocks = new Map<string, Promise<void>>();
const decryptionLocks = new Map<string, Promise<string>>();

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
 * Split raw audio into 5 MB chunks, encrypt each one with AES-CTR, and write
 * the encrypted base64 text + a manifest to the filesystem.
 *
 * CTR mode is a stream cipher - no padding added, so audio structure stays intact!
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

  // Generate ONE base nonce for the entire file
  const baseNonce = crypto.getRandomValues(new Uint8Array(16));

  console.log(
    `[DL] Encrypting ${totalSize} bytes in ${numChunks} chunks of ${ENCRYPTION_CHUNK_SIZE} bytes using AES-CTR`
  );

  try {
    for (let i = 0; i < numChunks; i++) {
      const start = i * ENCRYPTION_CHUNK_SIZE;
      const end = Math.min(start + ENCRYPTION_CHUNK_SIZE, totalSize);
      const chunkData = audioData.slice(start, end);

      console.log(`[ENC] === Encrypting chunk ${i} ===`);
      console.log(`[ENC] Chunk ${i} byte range: ${start} to ${end} (size: ${chunkData.byteLength})`);
      
      // DEBUG: Log first 32 bytes of original chunk
      const firstBytes = new Uint8Array(chunkData.slice(0, 32));
      const firstBytesHex = Array.from(firstBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      console.log(`[ENC] Chunk ${i} first 32 bytes (ORIGINAL): ${firstBytesHex}`);

      // Encrypt this chunk with position-based counter (no padding!)
      const { encryptedBase64 } = await encryptChunk(chunkData, hexKey, baseNonce, i);
      console.log(`[ENC] Chunk ${i} encrypted size: ${encryptedBase64.length} chars`);

      // Write encrypted text to its own file
      const chunkPath = `${AUDIO_FOLDER}/${lessonId}_chunk_${i}.enc`;
      console.log(`[ENC] Writing chunk ${i} to: ${chunkPath}`);
      await Filesystem.writeFile({
        path: chunkPath,
        data: encryptedBase64,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });

      chunks.push({ encryptedSize: encryptedBase64.length });

      console.log(
        `[ENC] ✓ Chunk ${i + 1}/${numChunks} encrypted & saved (${encryptedBase64.length} chars)`
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
    version: 3,
    algorithm: "AES-256-CTR",
    chunkSize: ENCRYPTION_CHUNK_SIZE,
    totalChunks: numChunks,
    chunks,
    nonce: arrayBufferToHex(baseNonce.buffer),
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
  onProgress?: (progress: DownloadProgress) => void,
  retryCount: number = 0
): Promise<void> => {
  const MAX_RETRIES = 2;
  
  // Check if download is already in progress
  const existingDownload = downloadLocks.get(lessonId);
  if (existingDownload) {
    console.log(`[DL] Download already in progress for lesson ${lessonId}, waiting...`);
    return existingDownload;
  }

  const updateProgress = (
    status: DownloadProgress["status"],
    progress: number,
    error?: string
  ) => {
    onProgress?.({ lessonId, status, progress, error });
  };

  // Create download promise and store it
  const downloadPromise = (async () => {
    try {
      console.log(`[DL] ========== DOWNLOAD START ==========`);
      console.log(`[DL] Lesson ID: ${lessonId}`);
      console.log(`[DL] Platform: ${Capacitor.getPlatform()}`);
      console.log(`[DL] Attempt: ${retryCount + 1}/${MAX_RETRIES + 1}`);
      
      updateProgress("pending", 0);

    // 1. Authorize
    console.log(`[DL] Step 1: Authorizing download...`);
    const { audioUrl, encryptionKey, lesson } = await authorizeDownload(
      lessonId,
      token
    );
    console.log(`[DL] Authorization successful`);
    console.log(`[DL] Audio URL: ${audioUrl.substring(0, 100)}...`);
    updateProgress("downloading", 10);

    // 2. Determine download URL - use proxy for iOS to avoid CORS issues
    const platform = Capacitor.getPlatform();
    const isIOS = platform === 'ios';
    const deviceId = await getDeviceId();
    
    let downloadUrl = audioUrl;
    if (isIOS) {
      // Use backend proxy for iOS to avoid CORS and signed URL issues
      downloadUrl = `${API_BASE}/downloads/proxy/${lessonId}?deviceId=${encodeURIComponent(deviceId)}`;
      console.log(`[DL] Using proxy URL for iOS`);
    } else {
      console.log(`[DL] Using direct URL for ${platform}`);
    }

    // 3. Stream-download the audio
    console.log(`[DL] Step 2: Starting download...`);
    console.log(`[DL] Download URL length: ${downloadUrl.length} chars`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600_000); // 10 min timeout for large files

    let chunks: Uint8Array[] = [];
    let receivedBytes = 0;

    try {
      // For iOS, we need to be more careful with fetch options
      const fetchOptions: RequestInit = {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Accept': 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8',
          // Add auth header for proxy endpoint
          ...(isIOS ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: isIOS ? 'include' : 'omit',
        mode: 'cors',
        cache: 'no-store',
      };
      
      console.log(`[DL] Starting fetch...`);
      const audioResponse = await fetch(downloadUrl, fetchOptions);
      clearTimeout(timeoutId);
      
      console.log(`[DL] Response status: ${audioResponse.status}`);
      console.log(`[DL] Response ok: ${audioResponse.ok}`);

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
      
      console.error(`[DL] ========== FETCH ERROR ==========`);
      console.error(`[DL] Error type: ${typeof fetchError}`);
      console.error(`[DL] Error name: ${fetchError?.name}`);
      console.error(`[DL] Error message: ${fetchError?.message}`);
      console.error(`[DL] Error toString: ${fetchError?.toString()}`);
      console.error(`[DL] Error stack:`, fetchError?.stack);
      console.error(`[DL] Full error object:`, JSON.stringify(fetchError, Object.getOwnPropertyNames(fetchError)));
      
      // Create detailed error message for user
      const errorInfo = {
        name: fetchError?.name || 'Unknown',
        message: fetchError?.message || 'Unknown error',
        platform: Capacitor.getPlatform(),
        isIOS: isIOS,
        url: isIOS ? 'proxy' : 'direct',
        attempt: retryCount + 1,
      };
      
      const detailedError = `Download failed on ${errorInfo.platform}\n` +
        `Error: ${errorInfo.name}\n` +
        `Message: ${errorInfo.message}\n` +
        `URL type: ${errorInfo.url}\n` +
        `Attempt: ${errorInfo.attempt}/${MAX_RETRIES + 1}`;
      
      // Retry logic for network errors
      if (retryCount < MAX_RETRIES && 
          (fetchError.name === "AbortError" || 
           fetchError.message.includes("Failed to fetch") || 
           fetchError.message.includes("Network") ||
           fetchError.message.includes("Load failed") ||
           fetchError.message.includes("network"))) {
        console.log(`[DL] Retrying download... (${retryCount + 1}/${MAX_RETRIES})`);
        downloadLocks.delete(lessonId); // Clear lock before retry
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
        return downloadLesson(lessonId, courseId, token, onProgress, retryCount + 1);
      }
      
      if (fetchError.name === "AbortError") {
        throw new Error(detailedError + "\n\nTimeout after 10 minutes");
      }
      
      // Throw detailed error
      throw new Error(detailedError);
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
    console.log(`[DL] ========== DOWNLOAD COMPLETE ==========`);
  } catch (error) {
    console.error(`[DL] ========== DOWNLOAD FAILED ==========`);
    console.error(`[DL] Final error for lesson ${lessonId}:`, error);
    const errorMessage =
      error instanceof Error ? error.message : "Download failed: " + String(error);
    updateProgress("error", 0, errorMessage);
    throw error;
  } finally {
    // Remove lock when done (success or failure)
    downloadLocks.delete(lessonId);
  }
  })();

  // Store the promise
  downloadLocks.set(lessonId, downloadPromise);
  
  return downloadPromise;
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
 * file on disk. Returns a web-accessible URL for the temp file that can
 * be passed straight to `new Audio(url)`.
 *
 * Uses AES-CTR mode - no padding, so audio structure stays perfect!
 * Peak memory ≈ 2 × chunkSize ≈ 10 MB (one encrypted + one decrypted buffer
 * exist at the same time; both are released before the next iteration).
 */
export const loadEncryptedAudio = async (
  lessonId: string,
  token: string
): Promise<string> => {
  // Check if decryption is already in progress
  const existingDecryption = decryptionLocks.get(lessonId);
  if (existingDecryption) {
    console.log(`[DL] Decryption already in progress for lesson ${lessonId}, waiting...`);
    return existingDecryption;
  }

  // Create decryption promise and store it
  const decryptionPromise = (async () => {
    try {
      // 1. Load manifest
      let manifest: ChunkManifest;
  try {
    const manifestResult = await Filesystem.readFile({
      path: `${AUDIO_FOLDER}/${lessonId}_manifest.json`,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    manifest = JSON.parse(manifestResult.data as string);
    
    // Check version compatibility
    if (manifest.version !== 3) {
      throw new Error(
        `This lesson was downloaded with an older version (v${manifest.version}). ` +
        `Please delete and re-download the lesson to use the new encryption format.`
      );
    }
    
    // Verify it's CTR mode
    if (manifest.algorithm !== "AES-256-CTR") {
      throw new Error(
        `Incompatible encryption algorithm: ${manifest.algorithm}. ` +
        `Please re-download the lesson.`
      );
    }
    
    // Verify nonce exists
    if (!manifest.nonce) {
      throw new Error(
        `Missing encryption nonce. Please re-download the lesson.`
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("version")) {
      throw error; // Re-throw version errors
    }
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

  // 3. Get base nonce from manifest
  const baseNonce = new Uint8Array(hexToArrayBuffer(manifest.nonce));

  // 4. Decrypt chunk-by-chunk → write to temp .mp3 on disk
  const tempPath = `${AUDIO_FOLDER}/${lessonId}_temp.mp3`;

  // Remove stale temp file
  try {
    await Filesystem.deleteFile({ path: tempPath, directory: Directory.Data });
  } catch {
    // Ignore
  }

  try {
    for (let i = 0; i < manifest.totalChunks; i++) {
      console.log(`[DL] === Processing chunk ${i} ===`);
      console.log(`[DL] Reading: ${AUDIO_FOLDER}/${lessonId}_chunk_${i}.enc`);
      
      // Read encrypted base64 text (~6.7 MB for a 5 MB chunk)
      const chunkResult = await Filesystem.readFile({
        path: `${AUDIO_FOLDER}/${lessonId}_chunk_${i}.enc`,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      const encryptedBase64 = chunkResult.data as string;
      console.log(`[DL] Encrypted chunk ${i} size: ${encryptedBase64.length} chars`);

      // Decrypt → raw audio ArrayBuffer (~5 MB) - EXACT original bytes!
      console.log(`[DL] Decrypting chunk ${i} with chunkIndex=${i}`);
      const decryptedBuffer = await decryptChunk(
        encryptedBase64,
        decryptionKey,
        baseNonce,
        i
      );
      console.log(`[DL] Decrypted chunk ${i} size: ${decryptedBuffer.byteLength} bytes`);
      
      // DEBUG: Log first 32 bytes of each chunk to verify order
      const firstBytes = new Uint8Array(decryptedBuffer.slice(0, 32));
      const firstBytesHex = Array.from(firstBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      console.log(`[DL] Chunk ${i} first 32 bytes: ${firstBytesHex}`);

      // Write each chunk to a separate temp file first
      const chunkTempPath = `${AUDIO_FOLDER}/${lessonId}_temp_chunk_${i}.mp3`;
      const decryptedBase64 = arrayBufferToBase64(decryptedBuffer);
      
      await Filesystem.writeFile({
        path: chunkTempPath,
        data: decryptedBase64,
        directory: Directory.Data,
      });
      
      console.log(`[DL] ✓ Chunk ${i + 1}/${manifest.totalChunks} written to temp file`);
    }
    
    // Concatenate all temp chunk files using native plugin
    console.log(`[DL] Concatenating ${manifest.totalChunks} temp files using native plugin...`);
    
    // Build array of input paths
    const inputPaths: string[] = [];
    for (let i = 0; i < manifest.totalChunks; i++) {
      inputPaths.push(`${AUDIO_FOLDER}/${lessonId}_temp_chunk_${i}.mp3`);
    }
    
    // Use native plugin to concatenate
    const result = await FileConcatenation.concatenateFiles({
      outputPath: tempPath,
      inputPaths,
    });
    
    console.log(`[DL] ✓ Native concatenation complete: ${result.totalBytes} bytes`);
    
    // Clean up temp chunk files
    for (let i = 0; i < manifest.totalChunks; i++) {
      const chunkTempPath = `${AUDIO_FOLDER}/${lessonId}_temp_chunk_${i}.mp3`;
      try {
        await Filesystem.deleteFile({
          path: chunkTempPath,
          directory: Directory.Data,
        });
      } catch {
        // Ignore deletion errors
      }
    }
    console.log(`[DL] ✓ All temp chunks deleted`);
    
    
    console.log(`[DL] ✓ All chunks concatenated successfully!`);
    
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

  // 5. Convert file path to a web-accessible URL
  const fileInfo = await Filesystem.getUri({
    path: tempPath,
    directory: Directory.Data,
  });

  // DEBUG: Log file size to verify it matches original
  try {
    const stat = await Filesystem.stat({
      path: tempPath,
      directory: Directory.Data,
    });
    console.log(`[DL] ✓ Decrypted file size: ${stat.size} bytes (original: ${manifest.metadata.originalSize} bytes)`);
    
    if (stat.size !== manifest.metadata.originalSize) {
      console.error(`[DL] ❌ SIZE MISMATCH! Decrypted: ${stat.size}, Original: ${manifest.metadata.originalSize}`);
    } else {
      console.log(`[DL] ✓ File size matches perfectly!`);
    }
  } catch (e) {
    console.warn('[DL] Could not verify file size:', e);
  }

  return Capacitor.convertFileSrc(fileInfo.uri);
    } catch (error) {
      // Clean up on error
      try {
        await Filesystem.deleteFile({
          path: tempPath,
          directory: Directory.Data,
        });
      } catch {
        // Ignore
      }
      throw error;
    } finally {
      // Remove lock when done (success or failure)
      decryptionLocks.delete(lessonId);
    }
  })();

  // Store the promise
  decryptionLocks.set(lessonId, decryptionPromise);
  
  return decryptionPromise;
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
