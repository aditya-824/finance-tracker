import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { CircularProgress } from '../components/CircularProgress';
import { useSecurity } from '../services/securityContext';

export const BudgetScreen = () => {
  const { vaultData, updateMonthlyBudget, resetInactivityTimer } = useSecurity();

  const [modalVisible, setModalVisible] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const totalLimit = vaultData.monthlyLimit || 0;
  const currentSpending = vaultData.monthlySpending || 0;

  // Calculate percentage
  let spentPercent = 0;
  if (totalLimit > 0) {
    spentPercent = Math.min(Math.round((currentSpending / totalLimit) * 100), 100);
  }

  const isNearLimit = totalLimit > 0 && currentSpending >= totalLimit * 0.8 && currentSpending < totalLimit;
  const isExceeded = totalLimit > 0 && currentSpending >= totalLimit;

  const formatCurrency = (val) => {
    return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleOpenEdit = () => {
    resetInactivityTimer();
    setBudgetInput(totalLimit > 0 ? String(totalLimit) : '');
    setErrorMsg('');
    setModalVisible(true);
  };

  const handleSaveBudget = async () => {
    resetInactivityTimer();
    setErrorMsg('');
    if (budgetInput.trim() === '') {
      setErrorMsg('Please enter a budget amount.');
      return;
    }

    const res = await updateMonthlyBudget(budgetInput);
    if (res.success) {
      setModalVisible(false);
      Alert.alert('Budget Saved', `Your monthly budget has been set to ${formatCurrency(budgetInput)}.`);
    } else {
      setErrorMsg(res.error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        onTouchStart={resetInactivityTimer}
      >
        {/* Header - Menu icon removed as requested */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Budget Center</Text>
        </View>

        {/* Big Overview Card with Circular Progress */}
        <View style={styles.overviewCard}>
          <CircularProgress
            percentage={totalLimit > 0 ? (currentSpending / totalLimit) * 100 : 0}
            size={110}
            strokeWidth={11}
          />

          <View style={styles.overviewDetails}>
            <View style={styles.overviewStatBlock}>
              <Text style={styles.statLabel}>Total Budget Limit</Text>
              <Text style={styles.statLimitValue}>{formatCurrency(totalLimit)}</Text>
            </View>

            <View style={[styles.overviewStatBlock, { marginTop: 12 }]}>
              <Text style={styles.statLabel}>Current Spending</Text>
              <Text style={styles.statSpendingValue}>{formatCurrency(currentSpending)}</Text>
            </View>
          </View>
        </View>

        {/* Modify Monthly Budget Action Button */}
        <TouchableOpacity
          style={styles.editBudgetButton}
          onPress={handleOpenEdit}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={18} color="#090D16" />
          <Text style={styles.editBudgetText}>
            {totalLimit > 0 ? 'Modify Monthly Budget' : 'Set Monthly Budget'}
          </Text>
        </TouchableOpacity>

        {/* Budget Limit Alert (dynamic) */}
        {isExceeded ? (
          <View style={[styles.alertCard, styles.alertCardExceeded]}>
            <View style={[styles.alertIconCircle, styles.alertIconExceeded]}>
              <Ionicons name="alert-circle" size={18} color={THEME.colors.accentPink} />
            </View>
            <View style={styles.alertTextContainer}>
              <Text style={styles.alertTitle}>Budget Exceeded Alert</Text>
              <Text style={styles.alertSubtitle}>
                You have exceeded your monthly budget by {formatCurrency(currentSpending - totalLimit)}!
              </Text>
            </View>
          </View>
        ) : isNearLimit ? (
          <View style={styles.alertCard}>
            <View style={styles.alertIconCircle}>
              <Ionicons name="warning-outline" size={18} color={THEME.colors.accentPink} />
            </View>
            <View style={styles.alertTextContainer}>
              <Text style={styles.alertTitle}>Budget Limit Alert</Text>
              <Text style={styles.alertSubtitle}>
                Warning: You have utilized {spentPercent}% of your monthly limit!
              </Text>
            </View>
          </View>
        ) : totalLimit > 0 ? (
          <View style={[styles.alertCard, styles.alertCardGood]}>
            <View style={[styles.alertIconCircle, styles.alertIconGood]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={THEME.colors.primary} />
            </View>
            <View style={styles.alertTextContainer}>
              <Text style={[styles.alertTitle, { color: THEME.colors.primary }]}>Budget On Track</Text>
              <Text style={styles.alertSubtitle}>
                {formatCurrency(totalLimit - currentSpending)} remaining for this month.
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.alertCard, styles.alertCardInfo]}>
            <View style={[styles.alertIconCircle, styles.alertIconInfo]}>
              <Ionicons name="information-circle-outline" size={18} color={THEME.colors.textSecondary} />
            </View>
            <View style={styles.alertTextContainer}>
              <Text style={[styles.alertTitle, { color: THEME.colors.textPrimary }]}>No Budget Set</Text>
              <Text style={styles.alertSubtitle}>
                Tap "Set Monthly Budget" above to establish your spending limit.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modify Budget Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Set Monthly Budget</Text>
            <Text style={styles.modalSubtitle}>
              Specify your total monthly spending target. The vault will alert you when spending approaches this threshold.
            </Text>

            {errorMsg ? (
              <Text style={styles.modalError}>{errorMsg}</Text>
            ) : null}

            <View style={styles.inputRow}>
              <Text style={styles.currencyPrefix}>₹</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="5000.00"
                placeholderTextColor={THEME.colors.textMuted}
                value={budgetInput}
                onChangeText={setBudgetInput}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSaveBudget}
              >
                <Text style={styles.modalSubmitText}>Save Budget</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  overviewCard: {
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.borderRadius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  overviewDetails: {
    flex: 1,
    marginLeft: 24,
  },
  overviewStatBlock: {},
  statLabel: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  statLimitValue: {
    color: THEME.colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  statSpendingValue: {
    color: THEME.colors.primary,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  editBudgetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.full,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 20,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  editBudgetText: {
    color: '#090D16',
    fontSize: 14,
    fontWeight: '700',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 105, 0.08)',
    borderRadius: THEME.borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 105, 0.3)',
    marginBottom: 20,
    gap: 12,
  },
  alertCardExceeded: {
    backgroundColor: 'rgba(255, 59, 105, 0.15)',
    borderColor: '#FF3B69',
  },
  alertCardGood: {
    backgroundColor: 'rgba(0, 240, 255, 0.06)',
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  alertCardInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: THEME.colors.cardBorder,
  },
  alertIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 59, 105, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertIconExceeded: {
    backgroundColor: 'rgba(255, 59, 105, 0.25)',
  },
  alertIconGood: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
  },
  alertIconInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    color: THEME.colors.accentPink,
    fontSize: 14,
    fontWeight: '700',
  },
  alertSubtitle: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.borderRadius.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  modalTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalSubtitle: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 18,
  },
  modalError: {
    color: THEME.colors.danger,
    fontSize: 12,
    marginBottom: 10,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  currencyPrefix: {
    color: THEME.colors.primary,
    fontSize: 18,
    fontWeight: '700',
    marginRight: 6,
  },
  modalInput: {
    flex: 1,
    color: THEME.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    padding: 0,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  modalCancelText: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
  },
  modalSubmitText: {
    color: '#090D16',
    fontSize: 13,
    fontWeight: '700',
  },
});
