import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Rect, Defs, LinearGradient, Stop, Circle, Line } from 'react-native-svg';
import { THEME } from '../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const SpendingChart = ({ data = [], height = 150 }) => {
  const chartWidth = Math.min(SCREEN_WIDTH - 48, 360);
  const chartHeight = height - 30;

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer, { height }]}>
        <Text style={styles.emptyText}>No spending recorded this month yet</Text>
      </View>
    );
  }

  const values = data.map(d => Number(d.value) || 0);
  const totalVal = values.reduce((a, b) => a + b, 0);

  if (totalVal === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer, { height }]}>
        <Text style={styles.emptyText}>₹0.00 spent this month</Text>
        <View style={[styles.labelsContainer, { width: chartWidth, marginTop: 16 }]}>
          {data.map((d, index) => (
            <Text key={`lbl-${index}`} style={styles.axisLabel}>
              {d.label}
            </Text>
          ))}
        </View>
      </View>
    );
  }

  const maxVal = Math.max(...values, 10);
  const barWidth = Math.max(14, (chartWidth / data.length) * 0.45);

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#00F0FF" />
            <Stop offset="100%" stopColor="#00A8B5" stopOpacity="0.4" />
          </LinearGradient>
        </Defs>

        {/* Baseline horizontal grid line */}
        <Line
          x1="0"
          y1={chartHeight - 4}
          x2={chartWidth}
          y2={chartHeight - 4}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="1"
        />

        {/* Dynamic Bars for each month period */}
        {data.map((d, index) => {
          const slotWidth = chartWidth / data.length;
          const x = index * slotWidth + (slotWidth - barWidth) / 2;
          const barHeight = Math.max(4, ((d.value || 0) / maxVal) * (chartHeight - 20));
          const y = chartHeight - barHeight - 4;

          return (
            <React.Fragment key={`bar-${index}`}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={barWidth / 2}
                fill={d.value > 0 ? 'url(#barGradient)' : 'rgba(255, 255, 255, 0.05)'}
              />
              {d.value > 0 && (
                <Circle
                  cx={x + barWidth / 2}
                  cy={y}
                  r="3.5"
                  fill="#00F0FF"
                />
              )}
            </React.Fragment>
          );
        })}
      </Svg>

      {/* X-axis date labels */}
      <View style={[styles.labelsContainer, { width: chartWidth }]}>
        {data.map((d, index) => (
          <Text key={`lbl-${index}`} style={styles.axisLabel}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 12,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: THEME.colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    marginTop: 8,
  },
  axisLabel: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
});
