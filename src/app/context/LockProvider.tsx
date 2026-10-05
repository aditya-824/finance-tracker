import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { hasPin, setPin, verifyPin, VerifyResult } from '../lib/pin';

const INACTIVITY_MS = 2 * 60 * 1000; // lock after 2 min without touches
const BACKGROUND_GRACE_MS = 30 * 1000; // lock if the app was in the background > 30 s

type LockContextValue = {
  ready: boolean; // finished checking whether a PIN exists
  pinSet: boolean;
  locked: boolean;
  createPin: (pin: string) => Promise<void>;
  unlockWithPin: (pin: string) => Promise<VerifyResult>;
  unlockWithBiometrics: () => Promise<boolean>;
  lockNow: () => void;
};

const LockContext = createContext<LockContextValue | null>(null);

export function useLock() {
  const ctx = useContext(LockContext);
  if (!ctx) throw new Error('useLock must be used inside <LockProvider>');
  return ctx;
}

type Props = {
  children: React.ReactNode;
  /** Called every time the app locks. Clear tokens held in memory, query caches, etc. */
  onLock?: () => void;
};

export function LockProvider({ children, onLock }: Props) {
  const [ready, setReady] = useState(false);
  const [pinSet, setPinSet] = useState(false);
  const [locked, setLocked] = useState(true); // cold start always begins locked

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backgroundedAt = useRef<number | null>(null);
  const onLockRef = useRef(onLock);
  onLockRef.current = onLock;

  useEffect(() => {
    hasPin().then((exists) => {
      setPinSet(exists);
      setReady(true);
    });
  }, []);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const lockNow = useCallback(() => {
    clearTimer();
    setLocked((already) => {
      if (!already) onLockRef.current?.();
      return true;
    });
  }, []);

  const resetTimer = useCallback(() => {
    clearTimer();
    if (pinSet && !locked) timer.current = setTimeout(lockNow, INACTIVITY_MS);
  }, [pinSet, locked, lockNow]);

  // (Re)start the inactivity timer whenever lock state changes.
  useEffect(() => {
    resetTimer();
    return clearTimer;
  }, [resetTimer]);

  // JS timers are paused in the background, so compare timestamps on return.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'background') {
        backgroundedAt.current = Date.now();
      } else if (next === 'active') {
        const away = backgroundedAt.current ? Date.now() - backgroundedAt.current : 0;
        backgroundedAt.current = null;
        if (pinSet && away >= BACKGROUND_GRACE_MS) lockNow();
      }
    });
    return () => sub.remove();
  }, [pinSet, lockNow]);

  const createPin = useCallback(async (pin: string) => {
    await setPin(pin);
    setPinSet(true);
    setLocked(false);
  }, []);

  const unlockWithPin = useCallback(async (pin: string) => {
    const result = await verifyPin(pin);
    if (result.ok) setLocked(false);
    return result;
  }, []);

  const unlockWithBiometrics = useCallback(async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !enrolled) return false;
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock your finances',
      cancelLabel: 'Use PIN',
      disableDeviceFallback: true,
    });
    if (res.success) setLocked(false);
    return res.success;
  }, []);

  const value = useMemo(
    () => ({ ready, pinSet, locked, createPin, unlockWithPin, unlockWithBiometrics, lockNow }),
    [ready, pinSet, locked, createPin, unlockWithPin, unlockWithBiometrics, lockNow]
  );

  return (
    <LockContext.Provider value={value}>
      {/* Any touch restarts the inactivity timer; returning false lets the touch through. */}
      <View style={{ flex: 1 }} onStartShouldSetResponderCapture={() => { resetTimer(); return false; }}>
        {children}
      </View>
    </LockContext.Provider>
  );
}
