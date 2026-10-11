import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { SecurityBadge } from '../components/SecurityBadge';
import { useSecurity } from '../services/securityContext';

export const DashboardScreen = ({ onNavigate }) => {
  const { vaultData, sessionSecondsRemaining, resetInactivityTimer } = useSecurity();

  const transactions = Array.isArray(vaultData.transactions) ? vaultData.transactions : [];

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(val) || 0).replace('INR', '₹').trim();
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
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.welcomeSubtitle}>Welcome back,</Text>
            <Text style={styles.userName}>{vaultData.userName || 'John Doe'}</Text>
          </View>

          <View style={styles.headerRight}>
            {/* Live Session Auto-Lock Countdown Pill */}
            <View style={styles.sessionPill}>
              <Ionicons name="time-outline" size={12} color={THEME.colors.primary} />
              <Text style={styles.sessionPillText}>{sessionSecondsRemaining}s</Text>
            </View>

            {/* Quick Security Action Icon */}
            <TouchableOpacity
              style={styles.shieldButton}
              onPress={() => onNavigate('security')}
              activeOpacity={0.7}
            >
              <Ionicons name="shield-checkmark" size={18} color={THEME.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* VAULT RESERVE Card */}
        <View style={styles.vaultCard}>
          <View style={styles.vaultCardHeader}>
            <Text style={styles.vaultReserveLabel}>VAULT RESERVE</Text>
            <SecurityBadge label="SECURE" />
          </View>

          <Text style={styles.vaultBalance}>
            {formatCurrency(vaultData.vaultBalance)}
          </Text>

          <View style={styles.growthRow}>
            <Ionicons name="shield-checkmark-outline" size={14} color={THEME.colors.primary} />
            <Text style={styles.growthText}>
              AES-256 Encrypted Financial Vault
            </Text>
          </View>

          <View style={styles.vaultDivider} />

          <View style={styles.vaultStatsRow}>
            <View style={styles.vaultStatCol}>
              <Text style={styles.statLabel}>Monthly Limit</Text>
              <Text style={styles.statValue}>
                {formatCurrency(vaultData.monthlyLimit)}
              </Text>
            </View>

            <View style={styles.vaultStatCol}>
              <Text style={styles.statLabel}>Total Spent</Text>
              <Text style={[styles.statValue, { color: THEME.colors.textPrimary }]}>
                {formatCurrency(vaultData.monthlySpending)}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => onNavigate('add')}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconCircle}>
              <Ionicons name="add" size={20} color={THEME.colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Add Expense</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => onNavigate('budget')}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconCircle}>
              <Ionicons name="pie-chart-outline" size={18} color={THEME.colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Set Budget</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => onNavigate('reports')}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconCircle}>
              <Ionicons name="bar-chart-outline" size={18} color={THEME.colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Reports</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Spends Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Spends</Text>
          {transactions.length > 0 && (
            <TouchableOpacity onPress={() => onNavigate('reports')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.transactionsList}>
          {transactions.length === 0 ? (
            <View style={styles.emptyTxBox}>
              <Ionicons name="receipt-outline" size={30} color={THEME.colors.textMuted} />
              <Text style={styles.emptyTxTitle}>No expenses recorded yet</Text>
              <TouchableOpacity onPress={() => onNavigate('add')}>
                <Text style={styles.emptyTxLink}>+ Tap here to add an expense</Text>
              </TouchableOpacity>
            </View>
          ) : (
            transactions.slice(0, 5).map((item) => {
              const isNegative = item.amount < 0;
              const amountFormatted = `${isNegative ? '-' : '+'}₹${Math.abs(item.amount).toFixed(2)}`;

              return (
                <View key={item.id} style={styles.txItem}>
                  <View style={styles.txIconBox}>
                    <Ionicons
                      name={item.icon || 'card-outline'}
                      size={20}
                      color={isNegative ? THEME.colors.accentPink : THEME.colors.primary}
                    />
                  </View>

                  <View style={styles.txDetails}>
                    <Text style={styles.txTitle}>{item.title}</Text>
                    <Text style={styles.txSubtitle}>{item.subCategory || item.category}</Text>
                  </View>

                  <Text
                    style={[
                      styles.txAmount,
                      { color: isNegative ? THEME.colors.accentPink : THEME.colors.primary }
                    ]}
                  >
                    {amountFormatted}
                  </Text>
                </View>
              );
            })
          )}
        </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeSubtitle: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
  },
  userName: {
    color: THEME.colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sessionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.full,
    gap: 4,
  },
  sessionPillText: {
    color: THEME.colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  shieldButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultCard: {
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.borderRadius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  vaultCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vaultReserveLabel: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  vaultBalance: {
    color: THEME.colors.textPrimary,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  growthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  growthText: {
    color: THEME.colors.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  vaultDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 18,
  },
  vaultStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vaultStatCol: {
    flex: 1,
  },
  statLabel: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    color: THEME.colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 26,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.borderRadius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  actionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  seeAllText: {
    color: THEME.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  transactionsList: {
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.borderRadius.xl,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  txIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  txDetails: {
    flex: 1,
  },
  txTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  txSubtitle: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyTxBox: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTxTitle: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
  },
  emptyTxLink: {
    color: THEME.colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
});
