import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';

export const SecurityBadge = ({ label = 'SECURE', size = 'small' }) => {
  return (
    <View style={[styles.badgeContainer, size === 'large' && styles.largeBadge]}>
      <Ionicons
        name="lock-closed"
        size={size === 'large' ? 14 : 10}
        color={THEME.colors.primary}
        style={styles.icon}
      />
      <Text style={[styles.badgeText, size === 'large' && styles.largeText]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  largeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  icon: {
    marginRight: 4,
  },
  badgeText: {
    color: THEME.colors.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  largeText: {
    fontSize: 12,
  },
});
