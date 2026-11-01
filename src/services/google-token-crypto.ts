import { decrypt, encrypt } from '@/lib/encryption';

/**
 * Google OAuth tokens grant access to a user's mailbox and calendar, so they
 * are encrypted at rest with the same AES-256-GCM key used for organization
 * API keys. The prefix marks encrypted values, which lets tokens stored before
 * encryption existed keep working until they are re-saved.
 */
const ENCRYPTED_PREFIX = 'enc:v1:';

/** True when a stored token is already encrypted. */
export function isSealedToken(stored: string | null | undefined): boolean {
  return typeof stored === 'string' && stored.startsWith(ENCRYPTED_PREFIX);
}

/**
 * Encrypts a token for storage.
 *
 * @param token - The plain token from Google; empty values stay empty.
 * @returns The encrypted, prefixed value, or undefined for an empty token.
 * @throws When encryption fails — a token must never fall back to plain text.
 */
export function sealToken(token: string | null | undefined): string | undefined {
  if (!token) return undefined;
  const encrypted = encrypt(token);
  if (!encrypted) throw new Error('Failed to encrypt Google token.');
  return `${ENCRYPTED_PREFIX}${encrypted}`;
}

/**
 * Returns the plain token from a stored value.
 *
 * @param stored - An encrypted value, or a legacy plain-text token.
 * @returns The usable token, or undefined when empty.
 * @throws When an encrypted value cannot be decrypted (wrong key or tampering).
 */
export function openToken(stored: string | null | undefined): string | undefined {
  if (!stored) return undefined;
  if (!isSealedToken(stored)) return stored; // stored before encryption was introduced
  const plain = decrypt(stored.slice(ENCRYPTED_PREFIX.length));
  if (!plain) throw new Error('Failed to decrypt Google token.');
  return plain;
}
