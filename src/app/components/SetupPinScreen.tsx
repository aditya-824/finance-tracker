import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PinPad } from './PinPad';
import { useLock } from '../context/LockProvider';
import { PIN_LENGTH, isWeakPin } from '../lib/pin';
import { colors } from './theme';

export function SetupPinScreen() {
  const { createPin } = useLock();
  const [first, setFirst] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onComplete = async (pin: string) => {
    if (first === null) {
      if (isWeakPin(pin)) {
        setError('That PIN is too easy to guess. Try a less predictable one.');
        return;
      }
      setError(null);
      setFirst(pin);
      return;
    }
    if (pin !== first) {
      setFirst(null);
      setError('The PINs did not match. Start again.');
      return;
    }
    setBusy(true);
    try {
      await createPin(pin);
    } catch {
      setError('Could not save your PIN. Please try again.'); // generic on purpose
      setFirst(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.screen}>
      <PinPad
        length={PIN_LENGTH}
        title={first === null ? 'Create your PIN' : 'Confirm your PIN'}
        subtitle={first === null ? `Choose ${PIN_LENGTH} digits to protect your data.` : 'Enter the same PIN again.'}
        errorText={error}
        disabled={busy}
        onComplete={onComplete}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center' },
});
