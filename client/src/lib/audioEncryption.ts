/**
 * Audio Encryption Utilities
 * AES-256-CBC encryption for offline audio files
 *
 * This uses the Web Crypto API for secure encryption/decryption
 */

// Convert hex string to ArrayBuffer
const hexToArrayBuffer = (hex: string): ArrayBuffer => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
};

// Convert ArrayBuffer to hex string
const arrayBufferToHex = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

// Convert ArrayBuffer to Base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

// Convert Base64 to ArrayBuffer
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Import a hex key string as a CryptoKey for AES-256-CBC
 */
const importKey = async (hexKey: string): Promise<CryptoKey> => {
  // Take first 32 bytes (256 bits) for AES-256
  const keyBytes = hexToArrayBuffer(hexKey.substring(0, 64));

  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-CBC" }, false, [
    "encrypt",
    "decrypt",
  ]);
};

/**
 * Encrypt audio data using AES-256-CBC
 * Returns: IV (16 bytes hex) + encrypted data (base64)
 */
export const encryptAudio = async (
  audioData: ArrayBuffer,
  hexKey: string
): Promise<{ iv: string; encryptedData: string }> => {
  try {
    const key = await importKey(hexKey);

    // Generate random IV (16 bytes for AES-CBC)
    const iv = crypto.getRandomValues(new Uint8Array(16));

    // Encrypt
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "AES-CBC", iv },
      key,
      audioData
    );

    return {
      iv: arrayBufferToHex(iv.buffer),
      encryptedData: arrayBufferToBase64(encryptedBuffer),
    };
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt audio");
  }
};

/**
 * Decrypt audio data using AES-256-CBC
 */
export const decryptAudio = async (
  encryptedData: string,
  iv: string,
  hexKey: string
): Promise<ArrayBuffer> => {
  try {
    const key = await importKey(hexKey);
    const ivBuffer = hexToArrayBuffer(iv);
    const dataBuffer = base64ToArrayBuffer(encryptedData);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv: ivBuffer },
      key,
      dataBuffer
    );

    return decryptedBuffer;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error(
      "Failed to decrypt audio. The file may be corrupted or the key is invalid."
    );
  }
};

/**
 * Create an encrypted audio package
 * Format: JSON with iv, data, and metadata
 */
export interface EncryptedAudioPackage {
  version: number;
  algorithm: string;
  iv: string;
  data: string;
  metadata: {
    lessonId: string;
    originalSize: number;
    encryptedAt: string;
    checksum: string;
  };
}

/**
 * Generate a simple checksum for integrity verification
 */
const generateChecksum = (data: string): string => {
  let hash = 0;
  for (let i = 0; i < Math.min(data.length, 1000); i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

/**
 * Package encrypted audio with metadata
 */
export const createEncryptedPackage = async (
  audioData: ArrayBuffer,
  hexKey: string,
  lessonId: string
): Promise<EncryptedAudioPackage> => {
  const { iv, encryptedData } = await encryptAudio(audioData, hexKey);

  return {
    version: 1,
    algorithm: "AES-256-CBC",
    iv,
    data: encryptedData,
    metadata: {
      lessonId,
      originalSize: audioData.byteLength,
      encryptedAt: new Date().toISOString(),
      checksum: generateChecksum(encryptedData),
    },
  };
};

/**
 * Decrypt an encrypted audio package
 */
export const decryptPackage = async (
  pkg: EncryptedAudioPackage,
  hexKey: string
): Promise<ArrayBuffer> => {
  // Verify checksum
  const checksum = generateChecksum(pkg.data);
  if (checksum !== pkg.metadata.checksum) {
    throw new Error(
      "Audio file integrity check failed. File may be corrupted."
    );
  }

  return decryptAudio(pkg.data, pkg.iv, hexKey);
};

/**
 * Convert decrypted ArrayBuffer to playable Blob URL
 */
export const createAudioBlobUrl = (
  audioData: ArrayBuffer,
  mimeType = "audio/mpeg"
): string => {
  const blob = new Blob([audioData], { type: mimeType });
  return URL.createObjectURL(blob);
};

/**
 * Revoke a blob URL to free memory
 */
export const revokeAudioBlobUrl = (url: string): void => {
  if (url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
};
