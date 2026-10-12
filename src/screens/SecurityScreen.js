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
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { useSecurity } from '../services/securityContext';
import { DEFAULT_ENDPOINT } from '../services/secureClient';

export const SecurityScreen = () => {
  const {
    autoLockTimeout,
    updateTimeoutDuration,
    lockVault,
    changePin,
    rawCiphertext,
    syncEndpoint,
    updateSyncEndpoint,
    triggerTlsCloudSync,
    restoreFromCloud,
    resetInactivityTimer,
    resetVaultToZero,
    vaultData,
    updateUserName,
  } = useSecurity();

  // Edit Name modal state
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState('');

  // Change PIN modal state
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Timeout picker modal state
  const [timeoutModalVisible, setTimeoutModalVisible] = useState(false);

  // Raw ciphertext inspector modal state
  const [inspectModalVisible, setInspectModalVisible] = useState(false);

  // Cloud Endpoint config modal state
  const [endpointModalVisible, setEndpointModalVisible] = useState(false);
  const [endpointInput, setEndpointInput] = useState(syncEndpoint);

  // TLS Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const getTimeoutLabel = (sec) => {
    if (sec === 30) return '30 Seconds';
    if (sec === 60) return '1 Minute';
    if (sec === 120) return '2 Minutes';
    if (sec === 300) return '5 Minutes';
    return `${sec} Seconds`;
  };

  const handleChangePinSubmit = async () => {
    resetInactivityTimer();
    setPinError('');
    if (!currentPin || !newPin) {
      setPinError('Both fields are required.');
      return;
    }

    const result = await changePin(currentPin, newPin);
    if (result.success) {
      Alert.alert('PIN Updated', 'Vault access PIN successfully updated with SHA-256 salt.');
      setCurrentPin('');
      setNewPin('');
      setPinModalVisible(false);
    } else {
      setPinError(result.error);
    }
  };

  const handleTlsSync = async () => {
    resetInactivityTimer();
    setIsSyncing(true);

    const result = await triggerTlsCloudSync();
    setIsSyncing(false);

    if (result.success) {
      const details = result.details;
      const backupId = details.data?.backupId || 'Verified';
      const sizeBytes = details.data?.payloadSizeBytes || 'AES-256 Encrypted';

      Alert.alert(
        'Cloud Vault Sync Succeeded',
        `Endpoint: ${syncEndpoint}\n\nSecurity Status:\n• Protocol: ${details.tlsProtocol}\n• Cipher: ${details.cipherSuite}\n• Certificate: ${details.certificateStatus}\n• Latency: ${details.latencyMs}ms\n• Backup ID: ${backupId}\n• Payload: ${sizeBytes} bytes\n\nZero-knowledge verified: No plaintext data was transmitted.`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Cloud Sync Fault', result.error);
    }
  };

  const handleRestoreFromCloud = async () => {
    resetInactivityTimer();
    Alert.alert(
      'Restore Vault from Cloud',
      'This will fetch the encrypted backup from your backend and decrypt it with your local vault key. Overwrite current local vault?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            setIsRestoring(true);
            const res = await restoreFromCloud();
            setIsRestoring(false);
            if (res.success) {
              Alert.alert(
                'Restore Complete',
                `Vault successfully restored from cloud backup (${res.backupId}). All balances and transactions have been synchronized!`
              );
            } else {
              Alert.alert('Restore Error', res.error);
            }
          },
        },
      ]
    );
  };

  const handleSaveEndpoint = async () => {
    resetInactivityTimer();
    const updated = await updateSyncEndpoint(endpointInput);
    setEndpointModalVisible(false);
    Alert.alert('Endpoint Saved', `Active Cloud Sync URL updated to:\n${updated}`);
  };

  const getEndpointShortLabel = () => {
    try {
      const parsed = new URL(syncEndpoint);
      return parsed.hostname + (parsed.port ? `:${parsed.port}` : '');
    } catch (e) {
      return syncEndpoint.length > 20 ? syncEndpoint.substring(0, 20) + '...' : syncEndpoint;
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Vault Security</Text>
          <View style={styles.shieldBadge}>
            <Ionicons name="shield-checkmark" size={18} color={THEME.colors.primary} />
          </View>
        </View>

        {/* Big Security Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusIconCircle}>
            <Ionicons name="shield-checkmark" size={28} color={THEME.colors.primary} />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>Hardware Enclave Encrypted</Text>
            <Text style={styles.statusSubtitle}>
              AES-256 GCM database locking active.
            </Text>
          </View>
        </View>

        {/* Device Security Settings Section */}
        <Text style={styles.sectionTitle}>Device Security Settings</Text>

        <View style={styles.settingsGroup}>
          {/* Edit Display Name */}
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => {
              resetInactivityTimer();
              setNameInput(vaultData.userName || '');
              setNameError('');
              setNameModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="person-outline" size={20} color={THEME.colors.primary} />
              <Text style={styles.rowLabel}>Display Name</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>{vaultData.userName || 'John Doe'}</Text>
              <Ionicons name="chevron-forward" size={18} color={THEME.colors.textMuted} />
            </View>
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => {
              resetInactivityTimer();
              setPinModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="key-outline" size={20} color={THEME.colors.primary} />
              <Text style={styles.rowLabel}>Change Vault PIN</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={THEME.colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => {
              resetInactivityTimer();
              setTimeoutModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="timer-outline" size={20} color={THEME.colors.primary} />
              <Text style={styles.rowLabel}>Auto-Lock Timeout</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>{getTimeoutLabel(autoLockTimeout)}</Text>
              <Ionicons name="chevron-forward" size={18} color={THEME.colors.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Cloud Sync & TLS Transport Section */}
        <Text style={styles.sectionTitle}>Cloud Vault & TLS Transport</Text>

        <View style={styles.settingsGroup}>
          {/* Configure Endpoint URL */}
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => {
              resetInactivityTimer();
              setEndpointInput(syncEndpoint);
              setEndpointModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="server-outline" size={20} color={THEME.colors.primary} />
              <Text style={styles.rowLabel}>Backend Endpoint</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>{getEndpointShortLabel()}</Text>
              <Ionicons name="chevron-forward" size={18} color={THEME.colors.textMuted} />
            </View>
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          {/* HTTPS / TLS Cloud Sync (Backup) */}
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={handleTlsSync}
            activeOpacity={0.7}
            disabled={isSyncing}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="cloud-upload-outline" size={20} color={THEME.colors.primary} />
              <Text style={styles.rowLabel}>Sync Vault to Cloud</Text>
            </View>
            <View style={styles.rowRight}>
              {isSyncing ? (
                <ActivityIndicator size="small" color={THEME.colors.primary} />
              ) : (
                <>
                  <Text style={styles.rowValue}>Sync Now</Text>
                  <Ionicons name="chevron-forward" size={18} color={THEME.colors.textMuted} />
                </>
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          {/* Restore from Cloud */}
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={handleRestoreFromCloud}
            activeOpacity={0.7}
            disabled={isRestoring}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="cloud-download-outline" size={20} color={THEME.colors.primary} />
              <Text style={styles.rowLabel}>Restore from Cloud</Text>
            </View>
            <View style={styles.rowRight}>
              {isRestoring ? (
                <ActivityIndicator size="small" color={THEME.colors.primary} />
              ) : (
                <>
                  <Text style={styles.rowValue}>Restore</Text>
                  <Ionicons name="chevron-forward" size={18} color={THEME.colors.textMuted} />
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Data & Cryptographic Verification Section */}
        <Text style={styles.sectionTitle}>Storage & Data Controls</Text>

        <View style={styles.settingsGroup}>
          {/* Raw Encrypted Ciphertext Inspector */}
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => {
              resetInactivityTimer();
              setInspectModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={THEME.colors.primary} />
              <Text style={styles.rowLabel}>View Encrypted Storage</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>AES Raw</Text>
              <Ionicons name="chevron-forward" size={18} color={THEME.colors.textMuted} />
            </View>
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          {/* Reset Vault to Zero Defaults */}
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => {
              resetInactivityTimer();
              Alert.alert(
                'Reset Vault Data',
                'Are you sure you want to reset all balances, budget, and spending to zero?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset to Zero',
                    style: 'destructive',
                    onPress: async () => {
                      const res = await resetVaultToZero();
                      if (res.success) {
                        Alert.alert('Vault Reset', 'All financial data has been reset to zero.');
                      }
                    },
                  },
                ]
              );
            }}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="refresh-outline" size={20} color={THEME.colors.accentPink} />
              <Text style={[styles.rowLabel, { color: THEME.colors.accentPink }]}>Reset Vault to Zero</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={THEME.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Sessions Section */}
        <Text style={styles.sectionTitle}>Sessions</Text>

        <View style={styles.settingsGroup}>
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <Ionicons name="phone-portrait-outline" size={20} color={THEME.colors.textSecondary} />
              <Text style={styles.rowLabel}>Active Trusted Devices</Text>
            </View>
            <Text style={styles.deviceCount}>1 Active (This iPhone)</Text>
          </View>
        </View>

        {/* Lock Vault Now Button */}
        <TouchableOpacity
          style={styles.lockNowButton}
          onPress={() => lockVault()}
          activeOpacity={0.8}
        >
          <Ionicons name="lock-closed" size={18} color={THEME.colors.danger} />
          <Text style={styles.lockNowText}>Lock Vault Immediately</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Display Name Modal */}
      <Modal
        visible={nameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Display Name</Text>
            <Text style={styles.modalSubtitle}>
              Update your name displayed on your dashboard and encrypted vault.
            </Text>

            {nameError ? (
              <Text style={styles.modalError}>{nameError}</Text>
            ) : null}

            <TextInput
              style={styles.modalInput}
              placeholder="e.g. John Doe"
              placeholderTextColor={THEME.colors.textMuted}
              value={nameInput}
              onChangeText={setNameInput}
              maxLength={30}
              autoFocus
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setNameModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={async () => {
                  resetInactivityTimer();
                  const res = await updateUserName(nameInput);
                  if (res.success) {
                    setNameModalVisible(false);
                    Alert.alert('Name Updated', `Your display name has been updated to "${nameInput.trim()}".`);
                  } else {
                    setNameError(res.error);
                  }
                }}
              >
                <Text style={styles.modalSubmitText}>Save Name</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Backend Endpoint Config Modal */}
      <Modal
        visible={endpointModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEndpointModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cloud Sync Endpoint</Text>
            <Text style={styles.modalSubtitle}>
              Specify your backend server URL for encrypted vault sync over TLS/HTTPS.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="https://your-domain.loca.lt/api/vault/sync"
              placeholderTextColor={THEME.colors.textMuted}
              value={endpointInput}
              onChangeText={setEndpointInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.presetLabel}>Quick Presets:</Text>
            <View style={styles.presetsRow}>
              <TouchableOpacity
                style={styles.presetBtn}
                onPress={() => setEndpointInput('http://192.168.4.167:4000/api/vault/sync')}
              >
                <Text style={styles.presetBtnText}>Wi-Fi LAN (192.168.4.167)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetBtn}
                onPress={() => setEndpointInput('https://httpbin.org/post')}
              >
                <Text style={styles.presetBtnText}>HTTPS Cloud Mock</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEndpointModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSaveEndpoint}
              >
                <Text style={styles.modalSubmitText}>Save Endpoint</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change PIN Modal */}
      <Modal
        visible={pinModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Vault PIN</Text>
            <Text style={styles.modalSubtitle}>
              Enter current 4-digit PIN and set your new vault PIN.
            </Text>

            {pinError ? (
              <Text style={styles.modalError}>{pinError}</Text>
            ) : null}

            <TextInput
              style={styles.modalInput}
              placeholder="Current PIN (e.g. 1234)"
              placeholderTextColor={THEME.colors.textMuted}
              value={currentPin}
              onChangeText={setCurrentPin}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={4}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="New 4-Digit PIN"
              placeholderTextColor={THEME.colors.textMuted}
              value={newPin}
              onChangeText={setNewPin}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={4}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setPinModalVisible(false);
                  setPinError('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleChangePinSubmit}
              >
                <Text style={styles.modalSubmitText}>Save PIN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Auto-Lock Timeout Picker Modal */}
      <Modal
        visible={timeoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTimeoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Auto-Lock Timeout</Text>
            <Text style={styles.modalSubtitle}>
              Automatically lock vault when inactive to prevent unauthorized access.
            </Text>

            {[30, 60, 120, 300].map((sec) => {
              const isSelected = autoLockTimeout === sec;
              return (
                <TouchableOpacity
                  key={`timeout-${sec}`}
                  style={[
                    styles.timeoutOption,
                    isSelected && styles.timeoutOptionSelected,
                  ]}
                  onPress={() => {
                    updateTimeoutDuration(sec);
                    setTimeoutModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.timeoutOptionText,
                      isSelected && styles.timeoutOptionTextSelected,
                    ]}
                  >
                    {getTimeoutLabel(sec)}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={18} color={THEME.colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[styles.modalCancelBtn, { marginTop: 12 }]}
              onPress={() => setTimeoutModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Ciphertext Storage Inspector Modal */}
      <Modal
        visible={inspectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setInspectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '80%' }]}>
            <View style={styles.inspectHeader}>
              <Ionicons name="shield-checkmark" size={20} color={THEME.colors.primary} />
              <Text style={styles.modalTitle}>Encrypted Storage Proof</Text>
            </View>

            <Text style={styles.modalSubtitle}>
              All transactions and balances are stored in local storage strictly as AES-256 ciphertext:
            </Text>

            <ScrollView style={styles.codeScrollView}>
              <Text style={styles.codeCiphertext}>
                {rawCiphertext || 'Ciphertext initializing...'}
              </Text>
            </ScrollView>

            <View style={styles.inspectBadge}>
              <Ionicons name="lock-closed" size={12} color={THEME.colors.primary} />
              <Text style={styles.inspectBadgeText}>
                No plaintext finance data exists in persistent storage.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { marginTop: 16 }]}
              onPress={() => setInspectModalVisible(false)}
            >
              <Text style={styles.modalSubmitText}>Done</Text>
            </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  shieldBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCard: {
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.borderRadius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  statusIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1.5,
    borderColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  statusSubtitle: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  sectionTitle: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  settingsGroup: {
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.borderRadius.xl,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    marginBottom: 24,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowLabel: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowValue: {
    color: THEME.colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  rowDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  deviceCount: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  lockNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 105, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 105, 0.3)',
    borderRadius: THEME.borderRadius.lg,
    paddingVertical: 14,
    gap: 8,
    marginTop: 8,
  },
  lockNowText: {
    color: THEME.colors.danger,
    fontSize: 14,
    fontWeight: '700',
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
  modalInput: {
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: THEME.colors.textPrimary,
    fontSize: 13,
    marginBottom: 12,
  },
  presetLabel: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  presetBtn: {
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: THEME.borderRadius.sm,
  },
  presetBtnText: {
    color: THEME.colors.primary,
    fontSize: 11,
    fontWeight: '500',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
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
  timeoutOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: THEME.borderRadius.md,
    marginBottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  timeoutOptionSelected: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  timeoutOptionText: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  timeoutOptionTextSelected: {
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  inspectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeScrollView: {
    backgroundColor: '#070A12',
    borderRadius: THEME.borderRadius.md,
    padding: 12,
    maxHeight: 180,
    borderWidth: 1,
    borderColor: '#192338',
  },
  codeCiphertext: {
    color: '#00F0FF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  inspectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  inspectBadgeText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
  },
});
