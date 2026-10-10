import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PinPad } from './PinPad';
import { useLock } from '../context/LockProvider';
import { PIN_LENGTH, getLockoutRemainingMs } from '../lib/pin';
import { colors } from './theme';

export function LockScreen() {
  const { unlockWithPin, unlockWithBiometrics, canUseBiometrics } = useLock();
  const [error, setError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);

  // Pick up a lockout that was started before the app was closed.
  useEffect(() => {
    getLockoutRemainingMs().then((ms) => {
      if (ms > 0) {
        setNow(Date.now());
        setLockedUntil(Date.now() + ms);
      }
    });
  }, []);

  // Tick once a second while locked out.
  useEffect(() => {
    if (lockedUntil <= Date.now()) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= lockedUntil) {
        clearInterval(id);
        setLockedUntil(0);
        setError(null);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const secondsLeft = Math.max(0, Math.ceil((lockedUntil - now) / 1000));
  const lockedOut = lockedUntil > now;

  const onComplete = async (pin: string) => {
    if (busy || lockedOut) return;
    setBusy(true);
    try {
      const res = await unlockWithPin(pin);
      if (res.ok) return;
      if (res.reason === 'locked') {
        setNow(Date.now());
        setLockedUntil(Date.now() + res.retryAfterMs);
        setError('Too many attempts.');
      } else if (res.reason === 'wrong') {
        setError(`Incorrect PIN. ${res.attemptsLeft} ${res.attemptsLeft === 1 ? 'attempt' : 'attempts'} left.`);
      } else {
        setError('Something went wrong. Restart the app.');
      }
    } catch {
      setError('Something went wrong. Please try again.'); // never show raw error details
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.screen}>
      <PinPad
        length={PIN_LENGTH}
        title="Enter your PIN"
        subtitle={lockedOut ? `Try again in ${secondsLeft}s.` : 'Your finances are locked.'}
        errorText={error}
        disabled={busy || lockedOut}
        onComplete={onComplete}
        footer={
          canUseBiometrics ? (
            <Pressable onPress={unlockWithBiometrics} disabled={lockedOut} style={s.bio} accessibilityRole="button">
              <Text style={s.bioText}>Use biometrics</Text>
            </Pressable>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center' },
  bio: { marginTop: 20, padding: 12 },
  bioText: { color: colors.accent, fontSize: 16, fontWeight: '600' },
});
