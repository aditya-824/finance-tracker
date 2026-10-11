import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SecurityProvider, useSecurity } from './src/services/securityContext';
import { PinLockScreen } from './src/screens/PinLockScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { AddExpenseScreen } from './src/screens/AddExpenseScreen';
import { BudgetScreen } from './src/screens/BudgetScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { SecurityScreen } from './src/screens/SecurityScreen';
import { BottomNav } from './src/components/BottomNav';
import { THEME } from './src/constants/theme';

const MainAppContent = () => {
  const { isInitialized, isLocked, resetInactivityTimer } = useSecurity();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Initializing Secure Vault...</Text>
      </View>
    );
  }

  // Requirement 1 & 4: If locked (at start, on timeout, or app background), show PIN lock screen
  if (isLocked) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" backgroundColor={THEME.colors.background} />
        <PinLockScreen />
      </View>
    );
  }

  // Unlocked: Render current active screen
  const renderCurrentScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen onNavigate={(tab) => setActiveTab(tab)} />;
      case 'budget':
        return <BudgetScreen onNavigate={(tab) => setActiveTab(tab)} />;
      case 'add':
        return (
          <AddExpenseScreen
            onBack={() => setActiveTab('dashboard')}
            onSuccess={() => setActiveTab('dashboard')}
          />
        );
      case 'reports':
        return <ReportsScreen />;
      case 'security':
        return <SecurityScreen />;
      default:
        return <DashboardScreen onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <View
      style={styles.root}
      onTouchStart={resetInactivityTimer}
      onTouchMove={resetInactivityTimer}
    >
      <StatusBar style="light" backgroundColor={THEME.colors.background} />
      <View style={styles.screenContainer}>{renderCurrentScreen()}</View>
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          resetInactivityTimer();
          setActiveTab(tab);
        }}
      />
    </View>
  );
};

export default function App() {
  return (
    <SecurityProvider>
      <MainAppContent />
    </SecurityProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  screenContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    marginTop: 14,
    fontWeight: '500',
  },
});
