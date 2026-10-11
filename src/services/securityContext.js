import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import {
  initializeStorage,
  loadEncryptedVault,
  saveEncryptedVault,
  getStoredPinHash,
  updatePinHash,
  loadSecuritySettings,
  saveSecuritySettings,
  getRawEncryptedPayload
} from './storage';
import { verifyPin, hashPin } from './encryption';
import { validateExpenseInput, formatSecureErrorMessage } from './validation';
import { SecureNetworkClient } from './secureClient';
import { INITIAL_VAULT_DATA, getCategoryMeta } from '../constants/mockData';

const SecurityContext = createContext(null);

export const SecurityProvider = ({ children }) => {
  // Vault lock status
  const [isLocked, setIsLocked] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Security & PIN state
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0); // in seconds if locked out due to failed attempts
  const [autoLockTimeout, setAutoLockTimeout] = useState(60); // 60 seconds (1 minute) default

  // Session activity
  const [sessionSecondsRemaining, setSessionSecondsRemaining] = useState(60);
  const lastActiveTimestamp = useRef(Date.now());
  const timerIntervalRef = useRef(null);

  // Financial Vault State (in-memory only when unlocked, initialized to zero defaults)
  const [vaultData, setVaultData] = useState(INITIAL_VAULT_DATA);
  const [rawCiphertext, setRawCiphertext] = useState('');

  // Lockout countdown timer
  useEffect(() => {
    let interval = null;
    if (lockoutRemaining > 0) {
      interval = setInterval(() => {
        setLockoutRemaining(prev => {
          if (prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lockoutRemaining]);

  // Initialize storage on mount
  useEffect(() => {
    const init = async () => {
      await initializeStorage();
      const settings = await loadSecuritySettings();
      if (settings?.autoLockTimeoutSeconds) {
        setAutoLockTimeout(settings.autoLockTimeoutSeconds);
        setSessionSecondsRemaining(settings.autoLockTimeoutSeconds);
      }
      const raw = await getRawEncryptedPayload();
      setRawCiphertext(raw || '');
      setIsInitialized(true);
    };
    init();
  }, []);

  // Requirement 4: AppState listener (Auto-lock immediately when app moves to background or inactive)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Instant lock to protect screen preview and memory
        setIsLocked(true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Requirement 4: Automatic session timeout on inactivity
  const resetInactivityTimer = useCallback(() => {
    lastActiveTimestamp.current = Date.now();
    setSessionSecondsRemaining(autoLockTimeout);
  }, [autoLockTimeout]);

  useEffect(() => {
    if (isLocked) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    // Start timer when unlocked
    resetInactivityTimer();

    timerIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastActiveTimestamp.current) / 1000);
      const remaining = Math.max(0, autoLockTimeout - elapsed);
      setSessionSecondsRemaining(remaining);

      if (remaining <= 0) {
        // Session timeout triggered!
        setIsLocked(true);
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isLocked, autoLockTimeout, resetInactivityTimer]);

  // Requirement 1: Unlock Vault with PIN
  const unlockVault = async (pin) => {
    if (lockoutRemaining > 0) {
      return {
        success: false,
        error: `Security lockout active. Try again in ${lockoutRemaining}s.`,
      };
    }

    try {
      const storedHash = await getStoredPinHash();
      const isValid = verifyPin(pin, storedHash);

      if (isValid) {
        setFailedAttempts(0);
        // Load and decrypt vault data
        const decrypted = await loadEncryptedVault();
        if (decrypted) {
          setVaultData({
            ...INITIAL_VAULT_DATA,
            ...decrypted,
            transactions: Array.isArray(decrypted.transactions) ? decrypted.transactions : [],
          });
        }
        setIsLocked(false);
        resetInactivityTimer();
        return { success: true };
      } else {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);

        if (nextAttempts >= 5) {
          setLockoutRemaining(30); // 30s lockout after 5 attempts
          return {
            success: false,
            error: 'Too many incorrect attempts. Vault locked for 30 seconds.',
          };
        }

        const remainingAllowed = 5 - nextAttempts;
        return {
          success: false,
          error: `Incorrect PIN. ${remainingAllowed} attempt${remainingAllowed > 1 ? 's' : ''} remaining.`,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: formatSecureErrorMessage(error),
      };
    }
  };

  // Lock Vault manually
  const lockVault = () => {
    setIsLocked(true);
  };

  // Change Vault PIN
  const changePin = async (currentPin, newPin) => {
    try {
      const storedHash = await getStoredPinHash();
      const isCurrentValid = verifyPin(currentPin, storedHash);
      if (!isCurrentValid) {
        return { success: false, error: 'Current PIN is incorrect.' };
      }

      if (!/^\d{4}$/.test(newPin)) {
        return { success: false, error: 'New PIN must be exactly 4 digits.' };
      }

      await updatePinHash(newPin);
      return { success: true };
    } catch (error) {
      return { success: false, error: formatSecureErrorMessage(error) };
    }
  };

  // Update auto-lock timeout duration
  const updateTimeoutDuration = async (seconds) => {
    setAutoLockTimeout(seconds);
    setSessionSecondsRemaining(seconds);
    await saveSecuritySettings({
      autoLockTimeoutSeconds: seconds,
      tlsSyncEnabled: true,
      lockOnBackground: true,
    });
  };

  // Modify Monthly Budget Limit
  const updateMonthlyBudget = async (newLimitStr) => {
    resetInactivityTimer();
    const cleaned = String(newLimitStr).replace(/[₹$,\s]/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num) || num < 0) {
      return { success: false, error: 'Please enter a valid non-negative budget amount.' };
    }

    try {
      const updatedVault = {
        ...vaultData,
        monthlyLimit: Number(num.toFixed(2)),
      };
      await saveEncryptedVault(updatedVault);
      setVaultData(updatedVault);
      const raw = await getRawEncryptedPayload();
      setRawCiphertext(raw || '');
      return { success: true };
    } catch (error) {
      return { success: false, error: formatSecureErrorMessage(error) };
    }
  };

  // Reset all money data to zero
  const resetVaultToZero = async () => {
    resetInactivityTimer();
    try {
      const zeroVault = {
        userName: vaultData.userName || 'John Doe',
        vaultBalance: 0.00,
        monthlyLimit: 0.00,
        monthlySpending: 0.00,
        monthlyGrowthAmount: 0.00,
        monthlyGrowthPercent: 0.0,
        transactions: [],
      };
      await saveEncryptedVault(zeroVault);
      setVaultData(zeroVault);
      const raw = await getRawEncryptedPayload();
      setRawCiphertext(raw || '');
      return { success: true };
    } catch (error) {
      return { success: false, error: formatSecureErrorMessage(error) };
    }
  };

  // Requirement 5: Add Expense with Input Validation & Encryption
  const addExpense = async ({ amountStr, category, note, date }) => {
    resetInactivityTimer();

    const validation = validateExpenseInput({ amountStr, category, note, date });
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      return { success: false, error: firstError, errors: validation.errors };
    }

    try {
      const { amount, category: validCategory, note: cleanNote, date: validDate } = validation.sanitized;
      const meta = getCategoryMeta(validCategory);

      const newTransaction = {
        id: `tx-${Date.now()}`,
        title: cleanNote || `${validCategory} Expense`,
        category: validCategory,
        subCategory: validCategory,
        amount: -Math.abs(amount),
        date: validDate,
        type: 'expense',
        note: cleanNote,
        icon: meta.icon,
      };

      // Update in-memory state
      const currentTransactions = Array.isArray(vaultData.transactions) ? vaultData.transactions : [];
      const updatedTransactions = [newTransaction, ...currentTransactions];
      const currentBalance = typeof vaultData.vaultBalance === 'number' ? vaultData.vaultBalance : 0;
      const currentSpent = typeof vaultData.monthlySpending === 'number' ? vaultData.monthlySpending : 0;

      const updatedBalance = Number((currentBalance - amount).toFixed(2));
      const updatedMonthlySpent = Number((currentSpent + amount).toFixed(2));

      const updatedVault = {
        ...vaultData,
        vaultBalance: updatedBalance,
        monthlySpending: updatedMonthlySpent,
        transactions: updatedTransactions,
      };

      // Requirement 2: Encrypt sensitive financial data before persisting
      await saveEncryptedVault(updatedVault);
      setVaultData(updatedVault);

      // Refresh raw ciphertext view
      const raw = await getRawEncryptedPayload();
      setRawCiphertext(raw || '');

      return { success: true, transaction: newTransaction };
    } catch (error) {
      return { success: false, error: formatSecureErrorMessage(error) };
    }
  };

  // Requirement 3: HTTPS/TLS Cloud Vault Backup
  const triggerTlsCloudSync = async () => {
    resetInactivityTimer();
    try {
      const raw = await getRawEncryptedPayload();
      const result = await SecureNetworkClient.syncEncryptedVaultToCloud(raw);
      return {
        success: true,
        details: result,
      };
    } catch (error) {
      return {
        success: false,
        error: formatSecureErrorMessage(error),
      };
    }
  };

  return (
    <SecurityContext.Provider
      value={{
        isInitialized,
        isLocked,
        sessionSecondsRemaining,
        autoLockTimeout,
        failedAttempts,
        lockoutRemaining,
        vaultData,
        rawCiphertext,
        unlockVault,
        lockVault,
        changePin,
        updateTimeoutDuration,
        updateMonthlyBudget,
        resetVaultToZero,
        addExpense,
        triggerTlsCloudSync,
        resetInactivityTimer,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
