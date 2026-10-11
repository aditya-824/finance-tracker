import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { THEME } from '../constants/theme';

export const CircularProgress = ({
  size = 110,
  strokeWidth = 10,
  percentage = 82,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * Math.min(percentage, 100)) / 100;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#00F0FF" />
            <Stop offset="80%" stopColor="#00D2EE" />
            <Stop offset="100%" stopColor="#FF3B69" />
          </LinearGradient>
        </Defs>

        {/* Track Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#192338"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Indicator Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View style={styles.content}>
        <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
        <Text style={styles.subText}>SPENT</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    color: THEME.colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  subText: {
    color: THEME.colors.textSecondary,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
});
