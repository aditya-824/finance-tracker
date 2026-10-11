import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptData, decryptData, hashPin } from './encryption';
import { INITIAL_VAULT_DATA } from '../constants/mockData';

const STORAGE_KEYS = {
  ENCRYPTED_VAULT: '@moneymap:encrypted_vault_v2',
  PIN_HASH: '@moneymap:vault_pin_hash',
  SECURITY_SETTINGS: '@moneymap:security_settings',
  AUDIT_LOGS: '@moneymap:secure_audit_logs',
};

const DEFAULT_PIN = '1234';

/**
 * Initialize default PIN and encrypted vault if first run
 */
export const initializeStorage = async () => {
  try {
    let pinHash = await AsyncStorage.getItem(STORAGE_KEYS.PIN_HASH);
    if (!pinHash) {
      pinHash = hashPin(DEFAULT_PIN);
      await AsyncStorage.setItem(STORAGE_KEYS.PIN_HASH, pinHash);
    }

    let encryptedData = await AsyncStorage.getItem(STORAGE_KEYS.ENCRYPTED_VAULT);
    if (!encryptedData) {
      // Seed initial vault data encrypted with default key
      const ciphertext = encryptData(INITIAL_VAULT_DATA);
      await AsyncStorage.setItem(STORAGE_KEYS.ENCRYPTED_VAULT, ciphertext);
    }

    let settings = await AsyncStorage.getItem(STORAGE_KEYS.SECURITY_SETTINGS);
    if (!settings) {
      const defaultSettings = {
        autoLockTimeoutSeconds: 60, // 1 minute default
        tlsSyncEnabled: true,
        biometricsEnabled: false,
        lockOnBackground: true,
      };
      await AsyncStorage.setItem(STORAGE_KEYS.SECURITY_SETTINGS, JSON.stringify(defaultSettings));
    }
  } catch (error) {
    console.error('Failed to initialize secure storage:', error);
  }
};

/**
 * Save vault data in encrypted form
 */
export const saveEncryptedVault = async (vaultData, key) => {
  try {
    const ciphertext = encryptData(vaultData, key);
    await AsyncStorage.setItem(STORAGE_KEYS.ENCRYPTED_VAULT, ciphertext);
    return true;
  } catch (error) {
    console.error('Failed to save encrypted vault:', error);
    throw error;
  }
};

/**
 * Load and decrypt vault data
 */
export const loadEncryptedVault = async (key) => {
  try {
    const ciphertext = await AsyncStorage.getItem(STORAGE_KEYS.ENCRYPTED_VAULT);
    if (!ciphertext) {
      return INITIAL_VAULT_DATA;
    }
    return decryptData(ciphertext, key);
  } catch (error) {
    console.error('Failed to load encrypted vault:', error);
    throw new Error('Data integrity fault: Decryption failed.');
  }
};

/**
 * Get raw ciphertext from storage to prove encryption
 */
export const getRawEncryptedPayload = async () => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.ENCRYPTED_VAULT);
  } catch (error) {
    return null;
  }
};

/**
 * Get stored PIN hash
 */
export const getStoredPinHash = async () => {
  try {
    const hash = await AsyncStorage.getItem(STORAGE_KEYS.PIN_HASH);
    return hash || hashPin(DEFAULT_PIN);
  } catch (error) {
    return hashPin(DEFAULT_PIN);
  }
};

/**
 * Update PIN hash
 */
export const updatePinHash = async (newPin) => {
  try {
    const hash = hashPin(newPin);
    await AsyncStorage.setItem(STORAGE_KEYS.PIN_HASH, hash);
    return true;
  } catch (error) {
    throw new Error('Failed to update PIN securely.');
  }
};

/**
 * Load security settings
 */
export const loadSecuritySettings = async () => {
  try {
    const settingsStr = await AsyncStorage.getItem(STORAGE_KEYS.SECURITY_SETTINGS);
    if (settingsStr) {
      return JSON.parse(settingsStr);
    }
  } catch (e) {}
  return {
    autoLockTimeoutSeconds: 60,
    tlsSyncEnabled: true,
    lockOnBackground: true,
  };
};

/**
 * Save security settings
 */
export const saveSecuritySettings = async (settings) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SECURITY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to persist settings:', e);
  }
};
