import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { CATEGORIES } from '../constants/mockData';
import { useSecurity } from '../services/securityContext';

export const AddExpenseScreen = ({ onBack, onSuccess }) => {
  const [amountStr, setAmountStr] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [validationError, setValidationError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { addExpense, resetInactivityTimer } = useSecurity();

  const handleSave = async () => {
    resetInactivityTimer();
    setValidationError('');
    setIsSaving(true);

    const result = await addExpense({
      amountStr,
      category: selectedCategory,
      note,
      date,
    });

    setIsSaving(false);

    if (result.success) {
      Alert.alert(
        'Vault Updated',
        'Expense securely encrypted with AES-256 and added to your financial vault.',
        [{ text: 'OK', onPress: () => (onSuccess ? onSuccess() : onBack()) }]
      );
    } else {
      setValidationError(result.error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          onTouchStart={resetInactivityTimer}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={THEME.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Expense</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Amount Paid Display */}
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>AMOUNT PAID</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={amountStr}
                onChangeText={(val) => {
                  setAmountStr(val);
                  if (validationError) setValidationError('');
                }}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={THEME.colors.textMuted}
                autoFocus={false}
              />
              <View style={styles.cursor} />
            </View>
          </View>

          {/* Validation Feedback Banner */}
          {validationError ? (
            <View style={styles.validationBanner}>
              <Ionicons name="shield-outline" size={16} color={THEME.colors.danger} />
              <Text style={styles.validationText}>{validationError}</Text>
            </View>
          ) : null}

          {/* Category Selector */}
          <Text style={styles.sectionLabel}>CATEGORY</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryCard,
                    isSelected && styles.categoryCardSelected,
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={cat.icon}
                    size={22}
                    color={isSelected ? THEME.colors.primary : THEME.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.categoryLabel,
                      isSelected && styles.categoryLabelSelected,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Date Row */}
          <View style={styles.inputCard}>
            <Ionicons name="calendar-outline" size={18} color={THEME.colors.textSecondary} />
            <Text style={styles.inputCardText}>
              Today, {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={THEME.colors.textMuted} />
          </View>

          {/* Note Input */}
          <View style={styles.inputCard}>
            <Ionicons name="pencil-outline" size={18} color={THEME.colors.textSecondary} />
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="Add expense note / reference"
              placeholderTextColor={THEME.colors.textMuted}
              maxLength={100}
            />
          </View>

          {/* Security Notice */}
          <View style={styles.securityNoticeRow}>
            <Ionicons name="lock-closed" size={12} color={THEME.colors.primary} />
            <Text style={styles.securityNoticeText}>
              Sanitized against script injections & encrypted in local vault.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom CTA Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Encrypting...' : 'Save Vault Expense'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingTop: 10,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  amountLabel: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbol: {
    color: THEME.colors.textPrimary,
    fontSize: 34,
    fontWeight: '700',
    marginRight: 4,
  },
  amountInput: {
    color: THEME.colors.textPrimary,
    fontSize: 38,
    fontWeight: '700',
    minWidth: 120,
    textAlign: 'center',
  },
  cursor: {
    width: 3,
    height: 38,
    backgroundColor: THEME.colors.primary,
    marginLeft: 2,
    borderRadius: 2,
  },
  validationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.dangerBg,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 105, 0.3)',
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  validationText: {
    color: THEME.colors.danger,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  sectionLabel: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  categoryCard: {
    width: '31%',
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.borderRadius.lg,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  categoryCardSelected: {
    borderColor: THEME.colors.primary,
    backgroundColor: 'rgba(0, 240, 255, 0.06)',
  },
  categoryLabel: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
  },
  categoryLabelSelected: {
    color: THEME.colors.primary,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.borderRadius.lg,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    marginBottom: 12,
    gap: 12,
  },
  inputCardText: {
    flex: 1,
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  noteInput: {
    flex: 1,
    color: THEME.colors.textPrimary,
    fontSize: 13,
    padding: 0,
  },
  securityNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  securityNoticeText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    paddingTop: 8,
  },
  saveButton: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.full,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#090D16',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
