import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

type Props = {
  length: number;
  title: string;
  subtitle?: string;
  errorText?: string | null;
  disabled?: boolean;
  onComplete: (pin: string) => void;
  footer?: React.ReactNode;
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

export function PinPad({ length, title, subtitle, errorText, disabled, onComplete, footer }: Props) {
  const [pin, setPin] = useState('');

  const press = (k: string) => {
    if (disabled) return;
    if (k === 'del') return setPin((p) => p.slice(0, -1));
    if (pin.length >= length) return;
    const next = pin + k;
    if (next.length === length) {
      setPin('');
      onComplete(next);
    } else {
      setPin(next);
    }
  };

  return (
    <View style={s.wrap}>
      <Text style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}

      <View style={s.dots} accessibilityLabel={`${pin.length} of ${length} digits entered`}>
        {Array.from({ length }).map((_, i) => (
          <View key={i} style={[s.dot, i < pin.length && s.dotFilled]} />
        ))}
      </View>

      <Text style={s.error} accessibilityLiveRegion="polite">
        {errorText ?? ' '}
      </Text>

      <View style={s.grid}>
        {KEYS.map((k, i) =>
          k === '' ? (
            <View key={i} style={s.key} />
          ) : (
            <Pressable
              key={i}
              onPress={() => press(k)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={k === 'del' ? 'Delete last digit' : k}
              style={({ pressed }) => [s.key, s.keyActive, pressed && s.keyPressed, disabled && { opacity: 0.4 }]}
            >
              <Text style={s.keyText}>{k === 'del' ? '⌫' : k}</Text>
            </Pressable>
          )
        )}
      </View>

      {footer}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: 24 },
  title: { fontSize: 26, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  subtitle: { marginTop: 8, fontSize: 15, color: colors.muted, textAlign: 'center' },
  dots: { flexDirection: 'row', gap: 16, marginTop: 36 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.accent },
  dotFilled: { backgroundColor: colors.accent },
  error: { height: 22, marginTop: 14, color: colors.danger, fontSize: 14, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 288, marginTop: 12, justifyContent: 'space-between' },
  key: { width: 88, height: 72, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  keyActive: { backgroundColor: colors.keyBg, borderRadius: 16 },
  keyPressed: { backgroundColor: colors.keyPressed },
  keyText: { fontSize: 28, color: colors.ink },
});
