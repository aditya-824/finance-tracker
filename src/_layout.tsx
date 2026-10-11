import React from 'react';
import { Slot } from 'expo-router';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { LockProvider, useLock } from '../context/LockProvider';
import { LockScreen } from '../components/LockScreen';
import { SetupPinScreen } from '../components/SetupPinScreen';

function Gate() {
  const { ready, pinSet, locked } = useLock();
  if (!ready) return null;
  if (!pinSet) return <SetupPinScreen />;
  if (locked) return <LockScreen />; // app content is not rendered at all while locked
  return <Slot />;
}

export default function RootLayout() {
  usePreventScreenCapture(); // blocks screenshots and hides the app preview in Recents (Android)
  return (
    <LockProvider
      onLock={() => {
        // Clear anything sensitive held in memory: auth tokens, query caches, form state...
      }}
    >
      <Gate />
    </LockProvider>
  );
}
