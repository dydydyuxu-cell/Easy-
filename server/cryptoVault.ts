/**
 * Server-side Secure Vault for BYOK API Keys
 * Uses AES-256-GCM encryption with SHA-256 derived keys.
 * Raw API keys are NEVER sent to the frontend or exposed to public Firestore.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

// Storage path for encrypted user vault on server
const VAULT_FILE = path.resolve(process.cwd(), 'server-vault.json');

function getMasterKey(): Buffer {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET || 'gemini_tts_secure_vault_master_key_2026';
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptApiKey(plainKey: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getMasterKey(), iv);
  let encrypted = cipher.update(plainKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptApiKey(payload: string): string {
  const parts = payload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format');
  }
  const [ivHex, authTagHex, encryptedHex] = parts;
  const decipher = crypto.createDecipheriv(ALGORITHM, getMasterKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function maskApiKey(apiKey: string): string {
  if (!apiKey) return '';
  const trimmed = apiKey.trim();
  if (trimmed.length <= 8) {
    return '••••••••';
  }
  const prefixLength = trimmed.startsWith('AQ.') ? 5 : 4;
  const prefix = trimmed.slice(0, prefixLength);
  const suffix = trimmed.slice(-4);
  return `${prefix}${'•'.repeat(8)}${suffix}`;
}

interface VaultEntry {
  encryptedKey: string;
  maskedKey: string;
  updatedAt: string;
  projectId?: string;
  type?: 'api_key' | 'oauth';
  encryptedRefreshToken?: string;
  tokenExpiry?: number;
}

interface VaultData {
  keys: Record<string, VaultEntry>;
}

function loadVault(): VaultData {
  try {
    if (fs.existsSync(VAULT_FILE)) {
      const content = fs.readFileSync(VAULT_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error loading vault:', err);
  }
  return { keys: {} };
}

function saveVault(vault: VaultData): void {
  try {
    fs.writeFileSync(VAULT_FILE, JSON.stringify(vault, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving vault:', err);
  }
}

/**
 * Stores encrypted Gemini credential (API key or OAuth token) for the user.
 */
export function storeUserGeminiCredential(
  uid: string,
  opts: {
    credential: string;
    projectId?: string;
    type?: 'api_key' | 'oauth';
    refreshToken?: string;
    tokenExpiry?: number;
  }
): { maskedKey: string; isLinked: boolean } {
  if (!uid) throw new Error('UID is required');
  const cleanCred = opts.credential.trim();
  if (!cleanCred) throw new Error('Credential cannot be empty');

  const encryptedKey = encryptApiKey(cleanCred);
  const maskedKey = maskApiKey(cleanCred);
  const encryptedRefreshToken = opts.refreshToken ? encryptApiKey(opts.refreshToken.trim()) : undefined;

  const vault = loadVault();
  vault.keys[uid] = {
    encryptedKey,
    maskedKey,
    updatedAt: new Date().toISOString(),
    projectId: opts.projectId?.trim() || undefined,
    type: opts.type || 'api_key',
    encryptedRefreshToken,
    tokenExpiry: opts.tokenExpiry,
  };
  saveVault(vault);

  return { maskedKey, isLinked: true };
}

/**
 * Stores encrypted BYOK key strictly associated with this UID.
 */
export function storeUserApiKey(uid: string, rawApiKey: string, projectId?: string): { maskedKey: string } {
  const result = storeUserGeminiCredential(uid, {
    credential: rawApiKey,
    projectId,
    type: 'api_key',
  });
  return { maskedKey: result.maskedKey };
}

/**
 * Retrieves decrypted Gemini credential for UID. Never returns this to frontend.
 * If token is expired OAuth token and refresh token exists, attempts refresh.
 */
export async function getUserDecryptedGeminiCredential(
  uid: string
): Promise<{ credential: string; projectId?: string; type: 'api_key' | 'oauth' } | null> {
  if (!uid) return null;
  const vault = loadVault();
  const entry = vault.keys[uid];
  if (!entry || !entry.encryptedKey) return null;

  try {
    const cred = decryptApiKey(entry.encryptedKey);

    // If OAuth token is near expiration and refresh token exists, refresh it
    if (entry.type === 'oauth' && entry.encryptedRefreshToken && entry.tokenExpiry) {
      const now = Date.now();
      // If expires in less than 5 minutes
      if (entry.tokenExpiry - now < 300000) {
        try {
          const refreshToken = decryptApiKey(entry.encryptedRefreshToken);
          const refreshUrl = 'https://oauth2.googleapis.com/token';
          const params = new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID || '',
            client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          });

          const resp = await fetch(refreshUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
          });

          if (resp.ok) {
            const data: any = await resp.json();
            if (data.access_token) {
              const newEncrypted = encryptApiKey(data.access_token);
              const newExpiry = Date.now() + (data.expires_in || 3600) * 1000;
              entry.encryptedKey = newEncrypted;
              entry.tokenExpiry = newExpiry;
              entry.updatedAt = new Date().toISOString();
              saveVault(vault);
              return {
                credential: data.access_token,
                projectId: entry.projectId,
                type: 'oauth',
              };
            }
          }
        } catch (refreshErr) {
          console.warn('Failed to refresh OAuth token for UID:', uid, refreshErr);
        }
      }
    }

    return {
      credential: cred,
      projectId: entry.projectId,
      type: entry.type || 'api_key',
    };
  } catch (err) {
    console.error(`Failed to decrypt credential for UID: ${uid}`, err);
    return null;
  }
}

/**
 * Retrieves decrypted API key for UID. Never returns this to frontend.
 */
export function getUserDecryptedApiKey(uid: string): string | null {
  if (!uid) return null;
  const vault = loadVault();
  const entry = vault.keys[uid];
  if (!entry || !entry.encryptedKey) return null;
  try {
    return decryptApiKey(entry.encryptedKey);
  } catch (err) {
    console.error(`Failed to decrypt API key for UID: ${uid}`, err);
    return null;
  }
}

/**
 * Returns public status of Gemini Link for this user (never secret).
 */
export function getUserGeminiLinkStatus(uid: string): {
  isLinked: boolean;
  maskedKey?: string;
  projectId?: string;
  type?: string;
  updatedAt?: string;
} {
  if (!uid) return { isLinked: false };
  const vault = loadVault();
  const entry = vault.keys[uid];
  if (!entry || !entry.encryptedKey) {
    return { isLinked: false };
  }
  return {
    isLinked: true,
    maskedKey: entry.maskedKey,
    projectId: entry.projectId,
    type: entry.type || 'api_key',
    updatedAt: entry.updatedAt,
  };
}

/**
 * Returns masked key for UI display (e.g. AIza••••••••1234).
 */
export function getUserMaskedApiKey(uid: string): string | null {
  if (!uid) return null;
  const vault = loadVault();
  return vault.keys[uid]?.maskedKey || null;
}

/**
 * Removes BYOK / Gemini credential for this UID.
 */
export function deleteUserApiKey(uid: string): boolean {
  if (!uid) return false;
  const vault = loadVault();
  if (vault.keys[uid]) {
    delete vault.keys[uid];
    saveVault(vault);
    return true;
  }
  return false;
}

export const deleteUserGeminiCredential = deleteUserApiKey;
