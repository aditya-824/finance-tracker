import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus, StyleSheet, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { hasPin, setPin, verifyPin, VerifyResult } from '../lib/pin';
import { colors } from '../components/theme';

const INACTIVITY_MS = 2 * 60 * 1000; // lock after 2 min without touches
const BACKGROUND_GRACE_MS = 30 * 1000; // lock if the app was in the background > 30 s

type LockContextValue = {
  ready: boolean; // finished checking whether a PIN exists
  pinSet: boolean;
  locked: boolean;
  canUseBiometrics: boolean; // Face ID / Touch ID / fingerprint available and enrolled
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
  const [canUseBiometrics, setCanUseBiometrics] = useState(false);
  const [covered, setCovered] = useState(false); // privacy cover while the app is not active

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backgroundedAt = useRef<number | null>(null);
  const authenticating = useRef(false); // the system biometric prompt makes iOS report 'inactive'
  const onLockRef = useRef(onLock);
  onLockRef.current = onLock;

  useEffect(() => {
    hasPin().then((exists) => {
      setPinSet(exists);
      setReady(true);
    });
    (async () => {
      try {
        const hardware = await LocalAuthentication.hasHardwareAsync();
        const enrolled = hardware && (await LocalAuthentication.isEnrolledAsync());
        setCanUseBiometrics(hardware && enrolled);
      } catch {
        setCanUseBiometrics(false);
      }
    })();
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
  // Also hide the screen contents while the app is not active, so the iOS app-switcher
  // snapshot (and the Android Recents preview) never shows financial data.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') {
        setCovered(false);
        const away = backgroundedAt.current ? Date.now() - backgroundedAt.current : 0;
        backgroundedAt.current = null;
        if (pinSet && away >= BACKGROUND_GRACE_MS) lockNow();
        return;
      }
      if (next === 'background') backgroundedAt.current = Date.now();
      if (next === 'background' || !authenticating.current) setCovered(true);
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
    if (!canUseBiometrics) return false;
    authenticating.current = true;
    try {
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock your finances',
        cancelLabel: 'Use PIN',
        disableDeviceFallback: true, // no device-passcode fallback: the app PIN is the fallback
      });
      if (res.success) setLocked(false);
      return res.success;
    } catch {
      return false;
    } finally {
      authenticating.current = false;
    }
  }, [canUseBiometrics]);

  const value = useMemo(
    () => ({
      ready,
      pinSet,
      locked,
      canUseBiometrics,
      createPin,
      unlockWithPin,
      unlockWithBiometrics,
      lockNow,
    }),
    [ready, pinSet, locked, canUseBiometrics, createPin, unlockWithPin, unlockWithBiometrics, lockNow]
  );

  return (
    <LockContext.Provider value={value}>
      {/* Any touch restarts the inactivity timer; returning false lets the touch through. */}
      <View style={{ flex: 1 }} onStartShouldSetResponderCapture={() => { resetTimer(); return false; }}>
        {children}
        {covered && <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} />}
      </View>
    </LockContext.Provider>
  );
}
