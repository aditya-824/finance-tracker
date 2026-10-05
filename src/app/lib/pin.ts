import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { pbkdf2Async } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha2';
import { utf8ToBytes, bytesToHex } from '@noble/hashes/utils';

export const PIN_LENGTH = 6;

const STORE_KEY = 'pin_record_v1'; // SecureStore keys: letters, digits, . - _ only
const ITERATIONS = 60_000; // raise/lower to taste (higher = slower unlock)
const MAX_ATTEMPTS = 5; // wrong tries before the first lockout
const BASE_LOCK_MS = 30_000; // first lockout: 30 s, doubles on every further failure
const MAX_LOCK_MS = 15 * 60_000; // cap at 15 min

type PinRecord = {
  salt: string; // hex
  hash: string; // hex
  iterations: number;
  failed: number; // consecutive failed attempts (persisted, survives app restarts)
  lockedUntil: number; // epoch ms, 0 = not locked
};

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: 'no_pin' }
  | { ok: false; reason: 'locked'; retryAfterMs: number }
  | { ok: false; reason: 'wrong'; attemptsLeft: number };

async function load(): Promise<PinRecord | null> {
  const raw = await SecureStore.getItemAsync(STORE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PinRecord;
  } catch {
    return null;
  }
}

async function save(rec: PinRecord) {
  await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(rec), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

async function derive(pin: string, saltHex: string, iterations: number): Promise<string> {
  const salt = Uint8Array.from(saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  const key = await pbkdf2Async(sha256, utf8ToBytes(pin), salt, { c: iterations, dkLen: 32 });
  return bytesToHex(key);
}

// Compare without bailing out at the first differing character.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function isValidPinFormat(pin: string): boolean {
  return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);
}

// Rejects 111111, 123456, 654321, 121212 etc.
export function isWeakPin(pin: string): boolean {
  if (/^(\d)\1+$/.test(pin)) return true;
  const d = pin.split('').map(Number);
  const steps = d.slice(1).map((n, i) => n - d[i]);
  if (steps.every((s) => s === 1) || steps.every((s) => s === -1)) return true;
  if (/^(\d\d)\1+$/.test(pin) || /^(\d\d\d)\1+$/.test(pin)) return true;
  return false;
}

export async function hasPin(): Promise<boolean> {
  return (await load()) !== null;
}

export async function setPin(pin: string): Promise<void> {
  if (!isValidPinFormat(pin)) throw new Error('Invalid PIN format');
  const saltBytes = await Crypto.getRandomBytesAsync(16);
  const salt = bytesToHex(saltBytes);
  const hash = await derive(pin, salt, ITERATIONS);
  await save({ salt, hash, iterations: ITERATIONS, failed: 0, lockedUntil: 0 });
}

export async function removePin(): Promise<void> {
  await SecureStore.deleteItemAsync(STORE_KEY);
}

/** How long the user must still wait before trying again (0 = can try now). */
export async function getLockoutRemainingMs(): Promise<number> {
  const rec = await load();
  if (!rec) return 0;
  return Math.max(0, rec.lockedUntil - Date.now());
}

export async function verifyPin(pin: string): Promise<VerifyResult> {
  const rec = await load();
  if (!rec) return { ok: false, reason: 'no_pin' };

  const now = Date.now();
  if (now < rec.lockedUntil) {
    return { ok: false, reason: 'locked', retryAfterMs: rec.lockedUntil - now };
  }

  const candidate = isValidPinFormat(pin) ? await derive(pin, rec.salt, rec.iterations) : '';
  if (candidate && safeEqual(candidate, rec.hash)) {
    await save({ ...rec, failed: 0, lockedUntil: 0 });
    return { ok: true };
  }

  const failed = rec.failed + 1;
  if (failed >= MAX_ATTEMPTS) {
    const lockMs = Math.min(BASE_LOCK_MS * 2 ** (failed - MAX_ATTEMPTS), MAX_LOCK_MS);
    await save({ ...rec, failed, lockedUntil: Date.now() + lockMs });
    return { ok: false, reason: 'locked', retryAfterMs: lockMs };
  }
  await save({ ...rec, failed });
  return { ok: false, reason: 'wrong', attemptsLeft: MAX_ATTEMPTS - failed };
}
