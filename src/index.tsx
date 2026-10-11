import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLock } from '../context/LockProvider';
import { colors } from '../components/theme';

// Placeholder home screen: replace with your expense list.
export default function Home() {
  const { lockNow } = useLock();
  return (
    <View style={s.screen}>
      <Text style={s.title}>Expenses</Text>
      <Text style={s.body}>You are unlocked. The app locks after 2 minutes of inactivity.</Text>
      <Pressable style={s.btn} onPress={lockNow}>
        <Text style={s.btnText}>Lock now</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', color: colors.ink },
  body: { marginTop: 8, color: colors.muted, textAlign: 'center' },
  btn: { marginTop: 24, backgroundColor: colors.accent, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
