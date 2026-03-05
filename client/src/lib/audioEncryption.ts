/**
 * Audio Encryption Utilities — V3 Chunk-based with AES-CTR
 * AES-256-CTR encryption with position-based counters for memory-efficient processing.
 *
 * Each 5 MB audio chunk is encrypted independently using CTR mode (stream cipher).
 * CTR mode does NOT add padding, so audio file structure remains intact - no corruption!
 * Decryption happens one chunk at a time, keeping peak WebView memory usage around 10-15 MB
 * regardless of total file size.
 *
 * Key advantage over CBC: No padding = no audio frame corruption at chunk boundaries.
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
  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-CTR" }, false, [
    "encrypt",
    "decrypt",
  ]);
};

// ---------------------------------------------------------------------------
// Chunk manifest type
// ---------------------------------------------------------------------------

export interface ChunkInfo {
  /** Size of the encrypted base64 text stored on disk */
  encryptedSize: number;
}

export interface ChunkManifest {
  version: 3;
  algorithm: "AES-256-CTR";
  chunkSize: number;
  totalChunks: number;
  chunks: ChunkInfo[];
  nonce: string; // Base nonce/IV for CTR mode
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
 * Encrypt a single chunk using AES-CTR with position-based counter.
 * CTR mode is a stream cipher - no padding added, so audio structure stays intact!
 * 
 * @param chunkData - Raw audio bytes for this chunk
 * @param hexKey - AES-256 key (hex encoded)
 * @param baseNonce - Base nonce/IV (16 bytes)
 * @param chunkIndex - Position of this chunk (0, 1, 2, ...)
 * @returns Encrypted data as base64 string
 */
export const encryptChunk = async (
  chunkData: ArrayBuffer,
  hexKey: string,
  baseNonce: Uint8Array,
  chunkIndex: number
): Promise<{ encryptedBase64: string }> => {
  const key = await importKey(hexKey);

  // Create counter for this chunk position
  // We need to add (chunkIndex * ENCRYPTION_CHUNK_SIZE / 16) to the base nonce
  // But we must avoid overflow, so we do the math in smaller steps
  const counter = new Uint8Array(baseNonce);
  
  // Calculate how many AES blocks (16 bytes each) to skip
  // Do division first to avoid overflow: (chunkIndex * (ENCRYPTION_CHUNK_SIZE / 16))
  const blocksPerChunk = ENCRYPTION_CHUNK_SIZE / 16; // 327680 blocks per 5MB chunk
  const blockOffset = chunkIndex * blocksPerChunk;
  
  console.log(`[CTR] Chunk ${chunkIndex}: blocksPerChunk=${blocksPerChunk}, blockOffset=${blockOffset}`);
  console.log(`[CTR] Base nonce: ${Array.from(baseNonce).map(b => b.toString(16).padStart(2, '0')).join('')}`);
  
  // Add block offset to counter (big-endian addition)
  // We need to handle this as a 128-bit integer addition
  let carry = Math.floor(blockOffset);
  for (let i = 15; i >= 0 && carry > 0; i--) {
    const sum = counter[i] + (carry & 0xFF);
    counter[i] = sum & 0xFF;
    carry = Math.floor(carry / 256) + Math.floor(sum / 256);
  }
  
  console.log(`[CTR] Final counter: ${Array.from(counter).map(b => b.toString(16).padStart(2, '0')).join('')}`);

  // Encrypt with CTR mode (no padding!)
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-CTR", counter, length: 64 },
    key,
    chunkData
  );

  return {
    encryptedBase64: arrayBufferToBase64(encryptedBuffer),
  };
};

/**
 * Decrypt a single encrypted chunk using AES-CTR.
 * @param encryptedBase64 - base64-encoded ciphertext read from disk
 * @param hexKey          - hex-encoded AES-256 key
 * @param baseNonce       - base nonce/IV (16 bytes)
 * @param chunkIndex      - position of this chunk (0, 1, 2, ...)
 * @returns the decrypted raw audio bytes (exact original, no padding!)
 */
export const decryptChunk = async (
  encryptedBase64: string,
  hexKey: string,
  baseNonce: Uint8Array,
  chunkIndex: number
): Promise<ArrayBuffer> => {
  const key = await importKey(hexKey);
  const dataBuffer = base64ToArrayBuffer(encryptedBase64);

  // Recreate the same counter used during encryption
  const counter = new Uint8Array(baseNonce);
  
  // Calculate block offset (same as encryption)
  const blocksPerChunk = ENCRYPTION_CHUNK_SIZE / 16;
  const blockOffset = chunkIndex * blocksPerChunk;
  
  console.log(`[CTR-DEC] Chunk ${chunkIndex}: blocksPerChunk=${blocksPerChunk}, blockOffset=${blockOffset}`);
  console.log(`[CTR-DEC] Base nonce: ${Array.from(baseNonce).map(b => b.toString(16).padStart(2, '0')).join('')}`);
  
  // Add block offset to counter (big-endian addition)
  let carry = Math.floor(blockOffset);
  for (let i = 15; i >= 0 && carry > 0; i--) {
    const sum = counter[i] + (carry & 0xFF);
    counter[i] = sum & 0xFF;
    carry = Math.floor(carry / 256) + Math.floor(sum / 256);
  }
  
  console.log(`[CTR-DEC] Final counter: ${Array.from(counter).map(b => b.toString(16).padStart(2, '0')).join('')}`);

  // Decrypt with CTR mode
  return crypto.subtle.decrypt(
    { name: "AES-CTR", counter, length: 64 },
    key,
    dataBuffer
  );
};
