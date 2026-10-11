export const INITIAL_VAULT_DATA = {
  userName: 'John Doe',
  vaultBalance: 0.00,
  monthlyLimit: 0.00,
  monthlySpending: 0.00,
  monthlyGrowthAmount: 0.00,
  monthlyGrowthPercent: 0.0,
  transactions: [],
};

export const CATEGORIES = [
  { id: 'Food', label: 'Food', icon: 'restaurant-outline', color: '#00F0FF' },
  { id: 'Transport', label: 'Transport', icon: 'car-outline', color: '#FFB800' },
  { id: 'Utilities', label: 'Utilities', icon: 'flash-outline', color: '#A855F7' },
  { id: 'Entertainment', label: 'Entertainment', icon: 'videocam-outline', color: '#FF3B69' },
  { id: 'Shopping', label: 'Shopping', icon: 'cart-outline', color: '#00E676' },
  { id: 'Health', label: 'Health', icon: 'fitness-outline', color: '#3B82F6' },
];

export const getCategoryMeta = (catName) => {
  const found = CATEGORIES.find(c => c.id.toLowerCase() === (catName || '').toLowerCase());
  if (found) return found;
  return { id: catName || 'General', label: catName || 'General', icon: 'card-outline', color: '#94A3B8' };
};
