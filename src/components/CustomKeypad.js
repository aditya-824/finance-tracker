import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';

export const CustomKeypad = ({ onKeyPress, onDelete, disabled = false }) => {
  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'DEL'],
  ];

  return (
    <View style={styles.keypadContainer}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((key, colIndex) => {
            if (key === '') {
              return <View key={`empty-${colIndex}`} style={styles.keyButton} />;
            }

            if (key === 'DEL') {
              return (
                <TouchableOpacity
                  key="del"
                  style={[styles.keyButton, disabled && styles.keyDisabled]}
                  onPress={onDelete}
                  disabled={disabled}
                  activeOpacity={0.6}
                >
                  <Ionicons name="backspace-outline" size={26} color={THEME.colors.textSecondary} />
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={key}
                style={[styles.keyButton, disabled && styles.keyDisabled]}
                onPress={() => onKeyPress(key)}
                disabled={disabled}
                activeOpacity={0.6}
              >
                <Text style={styles.keyNumber}>{key}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  keypadContainer: {
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  keyButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  keyDisabled: {
    opacity: 0.3,
  },
  keyNumber: {
    color: THEME.colors.textPrimary,
    fontSize: 28,
    fontWeight: '400',
  },
});
