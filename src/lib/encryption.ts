
'use server';
import crypto from 'crypto';

// Ensure ENCRYPTION_KEY is loaded from environment variables
const ENCRYPTION_KEY_STRING = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY_STRING) {
  throw new Error('ENCRYPTION_KEY is not set in environment variables. Please add it to your .env.local file.');
}

let key: Buffer;
try {
  key = Buffer.from(ENCRYPTION_KEY_STRING, 'base64');
  if (key.length !== 32) {
    throw new Error('Decoded ENCRYPTION_KEY must be 32 bytes (256 bits) for aes-256-gcm. The provided key is not the correct length after base64 decoding.');
  }
} catch (error: any) {
  throw new Error(`Failed to decode ENCRYPTION_KEY: ${error.message}. Ensure it's a valid base64 encoded 32-byte key.`);
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Bytes for GCM IV
const AUTH_TAG_LENGTH = 16; // Bytes for GCM Auth Tag

export function encrypt(text: string): string | null {
  if (!text) return null;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encryptedBuffer = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    // Store as iv:authTag:encryptedData for robust GCM usage
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encryptedBuffer.toString('hex')}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    return null;
  }
}

export function decrypt(encryptedText: string): string | null {
  if (!encryptedText) return null;
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      console.error('Decryption failed: Invalid encrypted format. Expected iv:authTag:data.');
      return null;
    }
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedData = Buffer.from(parts[2], 'hex');

    if (iv.length !== IV_LENGTH) {
        console.error(`Decryption failed: IV length is incorrect. Expected ${IV_LENGTH}, got ${iv.length}.`);
        return null;
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const decryptedBuffer = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    return decryptedBuffer.toString('utf8');
  } catch (error) {
    console.error('Decryption failed:', error);
    // Do not return null for auth tag mismatch, as it's a security indicator
    if ((error as Error).message.includes('Unsupported state or bad auth tag')) {
        throw new Error('Decryption failed due to bad authentication tag. Data may have been tampered or key is incorrect.');
    }
    return null;
  }
}
