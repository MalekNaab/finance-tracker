import React, { useState, useEffect } from 'react';
import { Sun, Moon, Trash2, Plus, X, Download, FileJson, FileText } from 'lucide-react';
import {
  getSettings, saveSettings, getCategories, saveCategories,
  getBudget, saveBudget, getTransactions, getCategoryBudgets
} from '../utils/storage';
import { DEFAULT_CATEGORIES } from '../utils/constants';
import ConfirmDialog from '../components/ConfirmDialog';
import './Settings.css';

const CURRENCIES = [
  { symbol: '£', label: 'British Pound (£)' },
  { symbol: '$', label: 'US Dollar ($)' },
  { symbol: '€', label: 'Euro (€)' },
  { symbol: '¥', label: 'Japanese Yen (¥)' },
];

const triggerDownload = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const Settings = ({ onThemeChange }) => {
  const [settings, setSettings] = useState({ theme: 'light', currency: '£' });
  const [categories, setCategories] = useState([]);
  const [budget, setBudget] = useState({ monthly: 2000 });
  const [newCategory, setNewCategory] = useState('');
  const [catError, setCatError] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const load = () => {
    setSettings(getSettings());
    setCategories(getCategories());
    setBudget(getBudget());
  };

  useEffect(() => { load(); }, []);

  const handleThemeToggle = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    const updated = { ...settings, theme: newTheme };
    setSettings(updated);
    saveSettings(updated);
    if (onThemeChange) onThemeChange(newTheme);
  };

  const handleCurrencyChange = (currency) => {
    const updated = { ...settings, currency };
    setSettings(updated);
    saveSettings(updated);
    showSaved();
  };

  const handleBudgetChange = (value) => {
    const num = Number(value);
    if (!isNaN(num) && num >= 0) {
      const updated = { monthly: num };
      setBudget(updated);
      saveBudget(updated);
    }
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) { setCatError('Please enter a category name.'); return; }
    if (categories.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) {
      setCatError('This category already exists.'); return;
    }
    const updated = [...categories, trimmed];
    setCategories(updated);
    saveCategories(updated);
    setNewCategory('');
    setCatError('');
    showSaved();
  };

  const handleDeleteCategory = (cat) => {
    if (DEFAULT_CATEGORIES.includes(cat)) return;
    const updated = categories.filter(c => c !== cat);
    setCategories(updated);
    saveCategories(updated);
  };

  const handleClearData = () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('finance_tracker')) localStorage.removeItem(key);
    });
    window.location.reload();
  };

  // ── Export handlers ──
  const handleExportJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      transactions: getTransactions(),
      budget: getBudget(),
      categoryBudgets: getCategoryBudgets(),
      categories: getCategories(),
      settings: getSettings(),
    };
    const filename = `finance-tracker-export-${new Date().toISOString().slice(0, 10)}.json`;
    triggerDownload(JSON.stringify(data, null, 2), filename, 'application/json');
    showSaved();
  };

  const handleExportCSV = () => {
    const transactions = getTransactions();
    const currency = getSettings()?.currency || '£';
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Currency', 'Note'];
    const rows = transactions.map(t => [
      t.date,
      t.type,
      t.category,
      t.amount,
      currency,
      `"${(t.note || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const filename = `finance-tracker-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    triggerDownload(csv, filename, 'text/csv;charset=utf-8;');
    showSaved();
  };

  const showSaved = () => {
    setSavedMsg('Saved!');
    setTimeout(() => setSavedMsg(''), 2000);
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Customise your experience</p>
        </div>
        {savedMsg && <span className="saved-toast" data-testid="saved-toast">{savedMsg}</span>}
      </div>

      {/* Appearance */}
      <section className="settings-section" data-testid="section-appearance">
        <h2 className="settings-section-title">Appearance</h2>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-info">
              <p className="settings-row-label">Theme</p>
              <p className="settings-row-desc">Switch between light and dark mode</p>
            </div>
            <button
              className={`theme-toggle ${settings.theme === 'dark' ? 'dark-active' : ''}`}
              onClick={handleThemeToggle}
              data-testid="button-theme-toggle"
            >
              <span className="theme-option"><Sun size={16} />Light</span>
              <span className="theme-option"><Moon size={16} />Dark</span>
              <span className="theme-thumb" />
            </button>
          </div>
        </div>
      </section>

      {/* Currency */}
      <section className="settings-section" data-testid="section-currency">
        <h2 className="settings-section-title">Currency</h2>
        <div className="settings-card">
          <div className="currency-options">
            {CURRENCIES.map(c => (
              <button
                key={c.symbol}
                className={`currency-option ${settings.currency === c.symbol ? 'active' : ''}`}
                onClick={() => handleCurrencyChange(c.symbol)}
                data-testid={`button-currency-${c.symbol}`}
              >
                <span className="currency-symbol">{c.symbol}</span>
                <span className="currency-label">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Budget */}
      <section className="settings-section" data-testid="section-budget">
        <h2 className="settings-section-title">Monthly Budget</h2>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-info">
              <p className="settings-row-label">Budget amount</p>
              <p className="settings-row-desc">Set a monthly spending limit</p>
            </div>
            <div className="budget-input-group">
              <span className="budget-symbol">{settings.currency || '£'}</span>
              <input
                type="number"
                min="0"
                step="50"
                className="budget-input"
                value={budget.monthly}
                onChange={e => handleBudgetChange(e.target.value)}
                onBlur={showSaved}
                data-testid="input-budget"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="settings-section" data-testid="section-categories">
        <h2 className="settings-section-title">Categories</h2>
        <div className="settings-card">
          <div className="categories-list">
            {categories.map(cat => (
              <div key={cat} className="category-row" data-testid={`category-row-${cat}`}>
                <span className="category-name">{cat}</span>
                {DEFAULT_CATEGORIES.includes(cat) ? (
                  <span className="category-default-tag">Default</span>
                ) : (
                  <button
                    className="btn btn-icon btn-ghost danger"
                    onClick={() => handleDeleteCategory(cat)}
                    title="Delete category"
                    data-testid={`button-delete-category-${cat}`}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="add-category-form">
            <input
              type="text"
              className={`form-input ${catError ? 'error' : ''}`}
              placeholder="New category name..."
              value={newCategory}
              onChange={e => { setNewCategory(e.target.value); setCatError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              data-testid="input-new-category"
            />
            <button className="btn btn-primary" onClick={handleAddCategory} data-testid="button-add-category">
              <Plus size={16} />
              Add
            </button>
          </div>
          {catError && <p className="form-error" style={{ marginTop: '0.5rem' }}>{catError}</p>}
        </div>
      </section>

      {/* Export Data */}
      <section className="settings-section" data-testid="section-export">
        <h2 className="settings-section-title">Export Data</h2>
        <div className="settings-card">
          <div className="export-row">
            <div className="settings-row-info">
              <p className="settings-row-label">Export as JSON</p>
              <p className="settings-row-desc">Download all your data — transactions, budgets, categories, and settings — as a single JSON file.</p>
            </div>
            <button
              className="btn btn-secondary export-btn"
              onClick={handleExportJSON}
              data-testid="button-export-json"
            >
              <FileJson size={16} />
              Export JSON
            </button>
          </div>

          <div className="export-divider" />

          <div className="export-row">
            <div className="settings-row-info">
              <p className="settings-row-label">Export transactions as CSV</p>
              <p className="settings-row-desc">Download your transactions in CSV format, compatible with Excel and Google Sheets.</p>
            </div>
            <button
              className="btn btn-secondary export-btn"
              onClick={handleExportCSV}
              data-testid="button-export-csv"
            >
              <FileText size={16} />
              Export CSV
            </button>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="settings-section danger-zone" data-testid="section-danger">
        <h2 className="settings-section-title danger">Danger Zone</h2>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-info">
              <p className="settings-row-label">Clear all data</p>
              <p className="settings-row-desc">Permanently delete all transactions, budget, and settings. This cannot be undone.</p>
            </div>
            <button
              className="btn btn-danger"
              onClick={() => setShowClearConfirm(true)}
              data-testid="button-clear-data"
            >
              <Trash2 size={16} />
              Clear all data
            </button>
          </div>
        </div>
      </section>

      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Clear all data?"
        message="This will permanently delete all your transactions, budget settings, and categories. This action cannot be undone."
        confirmLabel="Clear all data"
        onConfirm={handleClearData}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
};

export default Settings;
