/**
 * Audio Encryption Utilities — V2 Chunk-based
 * AES-256-CBC encryption with per-chunk IVs for memory-efficient processing.
 *
 * Each 5 MB audio chunk is encrypted independently so that decryption can
 * happen one chunk at a time, keeping peak WebView memory usage around 10-15 MB
 * regardless of total file size.
 */

/** Chunk size for encryption: 5 MB of raw audio per chunk */
export const ENCRYPTION_CHUNK_SIZE = 5 * 1024 * 1024;

// ---------------------------------------------------------------------------
// Hex helpers
// ---------------------------------------------------------------------------

const hexToArrayBuffer = (hex: string): ArrayBuffer => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
};

const arrayBufferToHex = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

// ---------------------------------------------------------------------------
// Base64 helpers (chunk-safe)
// ---------------------------------------------------------------------------

/**
 * Convert an ArrayBuffer to a Base64 string.
 *
 * Sub-chunks are sized at 8190 bytes (divisible by 3) so that intermediate
 * btoa() calls never produce padding — only the final sub-chunk may have it.
 */
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  const SUB_CHUNK = 8190; // divisible by 3 → no intermediate '=' padding
  let result = "";

  for (let i = 0; i < bytes.length; i += SUB_CHUNK) {
    const end = Math.min(i + SUB_CHUNK, bytes.length);
    const chunk = bytes.subarray(i, end);
    let binary = "";
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
    result += btoa(binary);
  }

  return result;
};

/**
 * Convert a Base64 string back to an ArrayBuffer.
 */
export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// ---------------------------------------------------------------------------
// AES key import
// ---------------------------------------------------------------------------

const importKey = async (hexKey: string): Promise<CryptoKey> => {
  const keyBytes = hexToArrayBuffer(hexKey.substring(0, 64)); // 32 bytes = AES-256
  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-CBC" }, false, [
    "encrypt",
    "decrypt",
  ]);
};

// ---------------------------------------------------------------------------
// Chunk manifest type
// ---------------------------------------------------------------------------

export interface ChunkInfo {
  /** Hex-encoded IV for this chunk */
  iv: string;
  /** Size of the encrypted base64 text stored on disk */
  encryptedSize: number;
}

export interface ChunkManifest {
  version: 2;
  algorithm: "AES-256-CBC";
  chunkSize: number;
  totalChunks: number;
  chunks: ChunkInfo[];
  metadata: {
    lessonId: string;
    originalSize: number;
    encryptedAt: string;
  };
}

// ---------------------------------------------------------------------------
// Single-chunk encrypt / decrypt
// ---------------------------------------------------------------------------

/**
 * Encrypt a single chunk (up to ENCRYPTION_CHUNK_SIZE) with a fresh random IV.
 * Returns the hex IV and the encrypted data as a base64 string.
 */
export const encryptChunk = async (
  chunkData: ArrayBuffer,
  hexKey: string
): Promise<{ iv: string; encryptedBase64: string }> => {
  const key = await importKey(hexKey);
  const iv = crypto.getRandomValues(new Uint8Array(16));

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    key,
    chunkData
  );

  return {
    iv: arrayBufferToHex(iv.buffer),
    encryptedBase64: arrayBufferToBase64(encryptedBuffer),
  };
};

/**
 * Decrypt a single encrypted chunk.
 * @param encryptedBase64 - base64-encoded ciphertext read from disk
 * @param iv              - hex-encoded IV used during encryption
 * @param hexKey          - hex-encoded AES-256 key
 * @returns the decrypted raw audio bytes
 */
export const decryptChunk = async (
  encryptedBase64: string,
  iv: string,
  hexKey: string
): Promise<ArrayBuffer> => {
  const key = await importKey(hexKey);
  const ivBuffer = hexToArrayBuffer(iv);
  const dataBuffer = base64ToArrayBuffer(encryptedBase64);

  return crypto.subtle.decrypt(
    { name: "AES-CBC", iv: ivBuffer },
    key,
    dataBuffer
  );
};
