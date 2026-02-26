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

// Convert ArrayBuffer to Base64 in chunks to avoid memory issues
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192; // 8KB chunks
  let result = '';
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    let binary = '';
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
    result += btoa(binary);
  }
  
  return result;
};

// Convert Base64 to ArrayBuffer in chunks to avoid memory issues
// Base64 must be decoded in multiples of 4 characters
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  // Ensure base64 string length is multiple of 4
  const paddedBase64 = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  
  // For very large strings, decode in chunks
  const CHUNK_SIZE = 1024 * 1024; // 1MB of base64 = ~750KB binary
  const chunks: Uint8Array[] = [];
  
  for (let i = 0; i < paddedBase64.length; i += CHUNK_SIZE) {
    // Ensure chunk size is multiple of 4
    let chunkEnd = Math.min(i + CHUNK_SIZE, paddedBase64.length);
    chunkEnd = chunkEnd - (chunkEnd % 4); // Align to 4-byte boundary
    if (chunkEnd === i) chunkEnd = paddedBase64.length; // Last chunk
    
    const chunk = paddedBase64.substring(i, chunkEnd);
    try {
      const binary = atob(chunk);
      const bytes = new Uint8Array(binary.length);
      for (let j = 0; j < binary.length; j++) {
        bytes[j] = binary.charCodeAt(j);
      }
      chunks.push(bytes);
    } catch (e) {
      console.error(`Failed to decode base64 chunk at position ${i}:`, e);
      throw new Error("Failed to decode base64 data");
    }
  }
  
  // Combine all chunks
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return result.buffer;
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
 * Encrypts the entire file at once to maintain data integrity
 */
export const encryptAudio = async (
  audioData: ArrayBuffer,
  hexKey: string,
  onProgress?: (progress: number) => void
): Promise<{ iv: string; encryptedData: string }> => {
  try {
    const key = await importKey(hexKey);

    // Generate random IV (16 bytes for AES-CBC)
    const iv = crypto.getRandomValues(new Uint8Array(16));

    console.log(`Encrypting audio data, size: ${audioData.byteLength} bytes`);
    
    // Encrypt the entire audio at once
    // AES-CBC can handle large files, and this maintains data integrity
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "AES-CBC", iv },
      key,
      audioData
    );
    
    if (onProgress) {
      onProgress(50);
    }
    
    console.log(`Encryption complete, encrypted size: ${encryptedBuffer.byteLength} bytes`);
    
    // Convert to base64 in chunks to avoid memory issues
    const base64Data = arrayBufferToBase64(encryptedBuffer);
    
    if (onProgress) {
      onProgress(100);
    }
    
    console.log(`Base64 encoding complete, size: ${base64Data.length} bytes`);

    return {
      iv: arrayBufferToHex(iv.buffer),
      encryptedData: base64Data,
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
  hexKey: string,
  onProgress?: (progress: number) => void
): Promise<ArrayBuffer> => {
  try {
    console.log(`Starting decryption, encrypted data size: ${encryptedData.length} bytes`);
    const key = await importKey(hexKey);
    const ivBuffer = hexToArrayBuffer(iv);
    
    if (onProgress) {
      onProgress(25);
    }
    
    // Convert base64 to ArrayBuffer
    console.log(`Converting base64 to ArrayBuffer`);
    const dataBuffer = base64ToArrayBuffer(encryptedData);
    console.log(`Converted to ArrayBuffer, size: ${dataBuffer.byteLength} bytes`);

    if (onProgress) {
      onProgress(50);
    }

    // Decrypt the entire buffer at once
    console.log(`Decrypting data`);
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv: ivBuffer },
      key,
      dataBuffer
    );
    console.log(`Decryption complete, size: ${decryptedBuffer.byteLength} bytes`);
    
    if (onProgress) {
      onProgress(100);
    }

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
  lessonId: string,
  onProgress?: (progress: number) => void
): Promise<EncryptedAudioPackage> => {
  const { iv, encryptedData } = await encryptAudio(audioData, hexKey, onProgress);

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
  hexKey: string,
  onProgress?: (progress: number) => void
): Promise<ArrayBuffer> => {
  // Verify checksum
  const checksum = generateChecksum(pkg.data);
  if (checksum !== pkg.metadata.checksum) {
    throw new Error(
      "Audio file integrity check failed. File may be corrupted."
    );
  }

  return decryptAudio(pkg.data, pkg.iv, hexKey, onProgress);
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
