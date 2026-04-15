import { DEFAULT_CATEGORIES } from './constants';

const KEYS = {
  TRANSACTIONS: 'finance_tracker_transactions',
  BUDGET: 'finance_tracker_budget',
  CATEGORY_BUDGETS: 'finance_tracker_category_budgets',
  CATEGORIES: 'finance_tracker_categories',
  SETTINGS: 'finance_tracker_settings',
  SEEDED: 'finance_tracker_seeded'
};

const generateId = () => Math.random().toString(36).substr(2, 9);

export const getTransactions = () => {
  const data = localStorage.getItem(KEYS.TRANSACTIONS);
  return data ? JSON.parse(data) : [];
};

export const saveTransactions = (transactions) => {
  localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
};

export const getBudget = () => {
  const data = localStorage.getItem(KEYS.BUDGET);
  return data ? JSON.parse(data) : { monthly: 2000 };
};

export const saveBudget = (budget) => {
  localStorage.setItem(KEYS.BUDGET, JSON.stringify(budget));
};

// Category-specific budgets: [{ id, category, limit }]
export const getCategoryBudgets = () => {
  const data = localStorage.getItem(KEYS.CATEGORY_BUDGETS);
  return data ? JSON.parse(data) : [];
};

export const saveCategoryBudgets = (budgets) => {
  localStorage.setItem(KEYS.CATEGORY_BUDGETS, JSON.stringify(budgets));
};

export const addCategoryBudget = (category, limit) => {
  const existing = getCategoryBudgets();
  const updated = [...existing, { id: generateId(), category, limit: Number(limit) }];
  saveCategoryBudgets(updated);
  return updated;
};

export const updateCategoryBudget = (id, limit) => {
  const existing = getCategoryBudgets();
  const updated = existing.map(b => b.id === id ? { ...b, limit: Number(limit) } : b);
  saveCategoryBudgets(updated);
  return updated;
};

export const deleteCategoryBudget = (id) => {
  const existing = getCategoryBudgets();
  const updated = existing.filter(b => b.id !== id);
  saveCategoryBudgets(updated);
  return updated;
};

export const getCategories = () => {
  const data = localStorage.getItem(KEYS.CATEGORIES);
  return data ? JSON.parse(data) : [...DEFAULT_CATEGORIES];
};

export const saveCategories = (categories) => {
  localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
};

export const getSettings = () => {
  const data = localStorage.getItem(KEYS.SETTINGS);
  return data ? JSON.parse(data) : { theme: 'light', currency: '$' };
};

export const saveSettings = (settings) => {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
};

export const seedInitialData = () => {
  if (localStorage.getItem(KEYS.SEEDED)) return;

  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
  
  const sampleTransactions = [
    { id: generateId(), type: 'income', amount: 5000, category: 'Salary', date: now.toISOString(), note: 'Monthly salary' },
    { id: generateId(), type: 'expense', amount: 1200, category: 'Bills', date: new Date(now.getFullYear(), now.getMonth(), 2).toISOString(), note: 'Rent' },
    { id: generateId(), type: 'expense', amount: 150, category: 'Food', date: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(), note: 'Groceries' },
    { id: generateId(), type: 'expense', amount: 60, category: 'Gym', date: new Date(now.getFullYear(), now.getMonth(), 10).toISOString(), note: 'Membership' },
    { id: generateId(), type: 'expense', amount: 200, category: 'Shopping', date: new Date(now.getFullYear(), now.getMonth(), 12).toISOString(), note: 'New shoes' },
    { id: generateId(), type: 'expense', amount: 45, category: 'Travel', date: new Date(now.getFullYear(), now.getMonth(), 15).toISOString(), note: 'Gas' },
    { id: generateId(), type: 'expense', amount: 80, category: 'Food', date: new Date(now.getFullYear(), now.getMonth(), 20).toISOString(), note: 'Dinner out' },
    
    // Last month
    { id: generateId(), type: 'income', amount: 5000, category: 'Salary', date: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(), note: 'Monthly salary' },
    { id: generateId(), type: 'expense', amount: 1200, category: 'Bills', date: new Date(now.getFullYear(), now.getMonth() - 1, 2).toISOString(), note: 'Rent' },
    { id: generateId(), type: 'expense', amount: 300, category: 'Food', date: new Date(now.getFullYear(), now.getMonth() - 1, 10).toISOString(), note: 'Groceries' },
  ];

  saveTransactions(sampleTransactions);
  saveBudget({ monthly: 2000 });
  saveCategories(DEFAULT_CATEGORIES);
  saveSettings({ theme: 'light', currency: '$' });
  
  localStorage.setItem(KEYS.SEEDED, 'true');
};
