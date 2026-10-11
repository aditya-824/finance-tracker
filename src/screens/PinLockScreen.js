import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Vibration, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomKeypad } from '../components/CustomKeypad';
import { THEME } from '../constants/theme';
import { useSecurity } from '../services/securityContext';

export const PinLockScreen = () => {
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const { unlockVault, lockoutRemaining, failedAttempts } = useSecurity();

  // Reset error when user starts typing again
  useEffect(() => {
    if (errorMessage && pin.length > 0) {
      setErrorMessage('');
    }
  }, [pin]);

  const handleKeyPress = async (digit) => {
    if (pin.length >= 4 || isVerifying || lockoutRemaining > 0) return;

    const nextPin = pin + digit;
    setPin(nextPin);

    // Once 4 digits entered, verify immediately
    if (nextPin.length === 4) {
      setIsVerifying(true);
      // Small delay for visual dot feedback
      setTimeout(async () => {
        const result = await unlockVault(nextPin);
        if (!result.success) {
          Vibration.vibrate(300);
          setErrorMessage(result.error);
          setPin('');
        }
        setIsVerifying(false);
      }, 150);
    }
  };

  const handleDelete = () => {
    if (pin.length > 0 && !isVerifying) {
      setPin(prev => prev.slice(0, -1));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header & Logo */}
        <View style={styles.headerArea}>
          <View style={styles.logoCircle}>
            <Ionicons name="shield-checkmark" size={38} color={THEME.colors.primary} />
          </View>
          <Text style={styles.appName}>MoneyMap</Text>
          <Text style={styles.appTagline}>
            SECURE PERSONAL FINANCE AND EXPENSE TRACKER
          </Text>
        </View>

        {/* PIN Prompt & Dots */}
        <View style={styles.pinArea}>
          <Text style={styles.promptText}>
            {lockoutRemaining > 0
              ? `VAULT LOCKED (${lockoutRemaining}s)`
              : 'Enter Vault PIN'}
          </Text>

          <View style={styles.dotsRow}>
            {[0, 1, 2, 3].map((index) => {
              const isFilled = pin.length > index;
              return (
                <View
                  key={`dot-${index}`}
                  style={[
                    styles.dot,
                    isFilled && styles.dotFilled,
                    errorMessage ? styles.dotError : null,
                  ]}
                />
              );
            })}
          </View>

          {/* Error / Lockout notice */}
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color={THEME.colors.danger} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : (
            <View style={styles.securityHintContainer}>
              <Ionicons name="lock-closed" size={12} color={THEME.colors.primary} />
              <Text style={styles.securityHintText}>
                Hardware & AES-256 Storage Protected
              </Text>
            </View>
          )}
        </View>

        {/* Keypad */}
        <View style={styles.keypadArea}>
          <CustomKeypad
            onKeyPress={handleKeyPress}
            onDelete={handleDelete}
            disabled={isVerifying || lockoutRemaining > 0}
          />
        </View>

        {/* Quick Demo Help */}
        <TouchableOpacity
          style={styles.demoHelper}
          onPress={() => {
            setPin('1234');
            handleKeyPress(''); // trigger verify with 1234
            setTimeout(async () => {
              await unlockVault('1234');
            }, 100);
          }}
        >
          <Text style={styles.demoHelperText}>
            Default Demo Vault PIN: <Text style={styles.demoHelperPin}>1234</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  headerArea: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  appName: {
    color: THEME.colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  appTagline: {
    color: THEME.colors.textSecondary,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  pinArea: {
    alignItems: 'center',
    marginVertical: 10,
  },
  promptText: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: THEME.colors.textMuted,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  dotError: {
    borderColor: THEME.colors.danger,
    backgroundColor: THEME.colors.danger,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  errorText: {
    color: THEME.colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  securityHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  securityHintText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
  },
  keypadArea: {
    marginBottom: 10,
  },
  demoHelper: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  demoHelperText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
  },
  demoHelperPin: {
    color: THEME.colors.primary,
    fontWeight: '700',
  },
});
