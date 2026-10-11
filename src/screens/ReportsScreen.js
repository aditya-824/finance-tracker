import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { SpendingChart } from '../components/SpendingChart';
import { getCategoryMeta } from '../constants/mockData';
import { useSecurity } from '../services/securityContext';

export const ReportsScreen = () => {
  const { vaultData, resetInactivityTimer } = useSecurity();

  // 1. Extract dynamic expenses
  const transactions = Array.isArray(vaultData.transactions) ? vaultData.transactions : [];
  const expenses = transactions.filter(tx => tx.amount < 0 || tx.type === 'expense');
  const totalSpent = expenses.reduce((acc, tx) => acc + Math.abs(tx.amount), 0);

  // 2. Compute dynamic average daily spending (based on day of current month)
  const currentDay = Math.max(1, new Date().getDate());
  const avgDailySpending = totalSpent > 0 ? Number((totalSpent / currentDay).toFixed(2)) : 0;

  // 3. Compute dynamic monthly periods for the chart
  const monthName = new Date().toLocaleString('en-US', { month: 'short' });
  const chartPoints = [
    { label: `01-07 ${monthName}`, start: 1, end: 7, value: 0 },
    { label: `08-14 ${monthName}`, start: 8, end: 14, value: 0 },
    { label: `15-21 ${monthName}`, start: 15, end: 21, value: 0 },
    { label: `22-31 ${monthName}`, start: 22, end: 31, value: 0 },
  ];

  expenses.forEach(tx => {
    let day = 1;
    if (tx.date) {
      const parts = tx.date.split('-');
      day = parseInt(parts[2] || '1', 10);
    }
    const matchedPeriod = chartPoints.find(p => day >= p.start && day <= p.end) || chartPoints[chartPoints.length - 1];
    matchedPeriod.value += Math.abs(tx.amount);
  });

  // 4. Compute dynamic Category Breakdown
  const categoryTotals = {};
  expenses.forEach(tx => {
    const cat = tx.category || 'General';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(tx.amount);
  });

  const breakdown = Object.keys(categoryTotals).map(catName => {
    const amt = categoryTotals[catName];
    const pct = totalSpent > 0 ? Math.round((amt / totalSpent) * 100) : 0;
    const meta = getCategoryMeta(catName);
    return {
      id: catName,
      name: meta.label,
      amount: amt,
      percent: pct,
      color: meta.color,
      icon: meta.icon,
    };
  }).sort((a, b) => b.amount - a.amount);

  const formatCurrency = (val) => {
    return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        onTouchStart={resetInactivityTimer}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics</Text>
        </View>

        {/* Analytics Card with Dynamic Monthly Spending Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.avgLabel}>Avg. Daily Spending</Text>
              <Text style={styles.avgAmount}>
                {formatCurrency(avgDailySpending)}
              </Text>
            </View>
            <View style={styles.monthBadge}>
              <Text style={styles.monthBadgeText}>{new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}</Text>
            </View>
          </View>

          {/* Dynamic Monthly Spending Bars */}
          <SpendingChart data={chartPoints} height={170} />
        </View>

        {/* Category Breakdown Section (Dynamic) */}
        <Text style={styles.sectionTitle}>Category Breakdown</Text>

        {breakdown.length === 0 ? (
          <View style={styles.emptyBreakdownCard}>
            <Ionicons name="pie-chart-outline" size={32} color={THEME.colors.textMuted} />
            <Text style={styles.emptyBreakdownText}>No expenses recorded yet.</Text>
            <Text style={styles.emptyBreakdownSub}>
              Expenses you add will automatically generate category analytics here.
            </Text>
          </View>
        ) : (
          <View style={styles.breakdownList}>
            {breakdown.map((item) => (
              <View key={item.id} style={styles.breakdownItem}>
                <View style={[styles.colorDot, { backgroundColor: item.color }]} />

                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPercent}>{item.percent}% of total spends</Text>
                </View>

                <Text style={styles.itemAmount}>{formatCurrency(item.amount)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  chartCard: {
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.borderRadius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    marginBottom: 24,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  avgLabel: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  avgAmount: {
    color: THEME.colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
  },
  monthBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.borderRadius.full,
  },
  monthBadgeText: {
    color: THEME.colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  sectionTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  breakdownList: {
    gap: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 14,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  itemPercent: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  itemAmount: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyBreakdownCard: {
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.borderRadius.xl,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  emptyBreakdownText: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
  },
  emptyBreakdownSub: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
});
