import crypto from 'crypto';
import { logger } from '../db/logger';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('TOKEN_ENCRYPTION_KEY environment variable is not set');
  }
  if (key.length !== 64) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }
  return Buffer.from(key, 'hex');
}

export function encryptToken(text: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let ciphertext = cipher.update(text, 'utf8', 'base64');
  ciphertext += cipher.final('base64');

  const tag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${ciphertext}:${tag.toString('base64')}`;
}

export function decryptToken(encrypted: string): string {
  const key = getKey();
  const [ivB64, ciphertext, tagB64] = encrypted.split(':');

  if (!ivB64 || !ciphertext || !tagB64) {
    throw new Error('Invalid encrypted token format');
  }

  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let text = decipher.update(ciphertext, 'base64', 'utf8');
  text += decipher.final('utf8');

  return text;
}

export function encryptTokenIfSet(token: string | null | undefined): string | null {
  if (!token) return null;
  return encryptToken(token);
}

export function decryptTokenIfSet(encrypted: string | null | undefined): string | null {
  if (!encrypted) return null;
  try {
    return decryptToken(encrypted);
  } catch (err) {
    // Log decryption failure — token is corrupted or key was rotated
    logger.error({ error: (err as Error).message }, '[Crypto] Failed to decrypt token');
    return null;
  }
}
