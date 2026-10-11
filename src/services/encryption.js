import CryptoJS from 'crypto-js';

// Default system master salt for key derivation
const MASTER_SALT = 'MoneyMap-Secure-Vault-v1-Salt-994829';

// Safe dynamic reference to expo-crypto if available
let ExpoCrypto = null;
try {
  ExpoCrypto = require('expo-crypto');
} catch (e) {
  // Graceful fallback if expo-crypto is not loaded
}

// --------------------------------------------------------------------------
// Polyfill secure random generator for React Native / Hermes & CryptoJS
// Eliminates: "Native crypto module could not be used to get secure random number"
// --------------------------------------------------------------------------
try {
  CryptoJS.lib.WordArray.random = function (nBytes) {
    const words = [];
    const uint8 = new Uint8Array(nBytes);
    let filled = false;

    // 1. Try ExpoCrypto.getRandomValues (native cryptographic entropy)
    if (ExpoCrypto && typeof ExpoCrypto.getRandomValues === 'function') {
      try {
        ExpoCrypto.getRandomValues(uint8);
        filled = true;
      } catch (err) {}
    }

    // 2. Try global.crypto.getRandomValues if available
    if (!filled && typeof global !== 'undefined' && global.crypto && typeof global.crypto.getRandomValues === 'function') {
      try {
        global.crypto.getRandomValues(uint8);
        filled = true;
      } catch (err) {}
    }

    // 3. Fallback entropy generation
    if (!filled) {
      for (let i = 0; i < nBytes; i++) {
        uint8[i] = Math.floor(Math.random() * 256);
      }
    }

    // Pack into 32-bit words
    for (let i = 0; i < nBytes; i += 4) {
      const word =
        ((uint8[i] || 0) << 24) |
        ((uint8[i + 1] || 0) << 16) |
        ((uint8[i + 2] || 0) << 8) |
        (uint8[i + 3] || 0);
      words.push(word);
    }

    return new CryptoJS.lib.WordArray.init(words, nBytes);
  };
} catch (e) {
  console.warn('CryptoJS WordArray patch warning:', e);
}

/**
 * Derive an AES-256 key from a passphrase or PIN
 */
export const deriveKey = (passphrase, salt = MASTER_SALT) => {
  return CryptoJS.PBKDF2(passphrase, salt, {
    keySize: 256 / 32,
    iterations: 1000,
  }).toString();
};

/**
 * Encrypt sensitive payload using AES-256
 * @param {any} data - Object or primitive data
 * @param {string} key - Encryption key
 * @returns {string} Ciphertext string
 */
export const encryptData = (data, key = MASTER_SALT) => {
  try {
    const safeKey = key || MASTER_SALT;
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, safeKey).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption internal error:', error);
    throw new Error(`Encryption failed: ${error.message || 'secure boundary fault'}`);
  }
};

/**
 * Decrypt ciphertext using AES-256
 * @param {string} ciphertext - Encrypted string
 * @param {string} key - Decryption key
 * @returns {any} Decrypted data parsed from JSON
 */
export const decryptData = (ciphertext, key = MASTER_SALT) => {
  try {
    if (!ciphertext) return null;
    const safeKey = key || MASTER_SALT;
    const bytes = CryptoJS.AES.decrypt(ciphertext, safeKey);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedText) {
      throw new Error('Integrity verification failed (empty decrypted payload).');
    }
    return JSON.parse(decryptedText);
  } catch (error) {
    console.error('Decryption internal error:', error);
    throw new Error('Decryption failed: Integrity verification error.');
  }
};

/**
 * Securely hash a 4-digit PIN using SHA-256 with custom salt
 */
export const hashPin = (pin, salt = MASTER_SALT) => {
  return CryptoJS.SHA256(pin + ':' + salt).toString();
};

/**
 * Constant-time comparison simulation for PIN validation
 */
export const verifyPin = (inputPin, storedHash, salt = MASTER_SALT) => {
  const computedHash = hashPin(inputPin, salt);
  if (computedHash.length !== storedHash.length) return false;
  let result = 0;
  for (let i = 0; i < computedHash.length; i++) {
    result |= computedHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return result === 0;
};
