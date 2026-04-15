import React, { useState, useEffect, useRef } from 'react';
import {
  Target, Plus, Pencil, Trash2, AlertTriangle, CheckCircle, TrendingUp, Calendar
} from 'lucide-react';
import {
  getTransactions, getBudget, saveBudget, getSettings,
  getCategoryBudgets, addCategoryBudget, updateCategoryBudget, deleteCategoryBudget,
  getCategories
} from '../utils/storage';
import { formatCurrency } from '../utils/formatters';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import './Budgets.css';

// Returns total expenses for a given category this calendar month
const categorySpentThisMonth = (transactions, category) => {
  const now = new Date();
  return transactions
    .filter(t => {
      if (t.type !== 'expense') return false;
      if (t.category !== category) return false;
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, t) => sum + Number(t.amount), 0);
};

const totalExpensesThisMonth = (transactions) => {
  const now = new Date();
  return transactions
    .filter(t => {
      if (t.type !== 'expense') return false;
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, t) => sum + Number(t.amount), 0);
};

const daysLeftInMonth = () => {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate();
};

const daysInMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
};

// Returns colour class based on percentage used
const statusClass = (pct) => {
  if (pct >= 100) return 'over';
  if (pct >= 75) return 'warning';
  return 'good';
};

const statusLabel = (pct) => {
  if (pct >= 100) return 'Over budget';
  if (pct >= 75) return 'Approaching limit';
  return 'On track';
};

// ── Inline add / edit form ──────────────────────────────────────────────────
const BudgetForm = ({ categories, takenCategories, onSave, onCancel, initial }) => {
  const [category, setCategory] = useState(initial?.category || '');
  const [limit, setLimit] = useState(initial?.limit ? String(initial.limit) : '');
  const [errors, setErrors] = useState({});
  const firstRef = useRef(null);

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  const validate = () => {
    const errs = {};
    if (!initial && !category) errs.category = 'Choose a category';
    if (!limit || isNaN(Number(limit)) || Number(limit) <= 0)
      errs.limit = 'Enter a valid limit greater than 0';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ category: initial?.category || category, limit: Number(limit) });
  };

  const available = categories.filter(c => !takenCategories.includes(c) || c === initial?.category);

  return (
    <form className="budget-form" onSubmit={handleSubmit} noValidate>
      {!initial && (
        <div className="bf-field">
          <label className="bf-label">Category</label>
          <select
            ref={firstRef}
            className={`bf-select ${errors.category ? 'error' : ''}`}
            value={category}
            onChange={e => { setCategory(e.target.value); setErrors(p => ({ ...p, category: undefined })); }}
            data-testid="select-budget-category"
          >
            <option value="">Select category...</option>
            {available.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.category && <p className="bf-error">{errors.category}</p>}
        </div>
      )}

      <div className="bf-field">
        <label className="bf-label">Monthly limit</label>
        <input
          ref={initial ? firstRef : undefined}
          type="number"
          min="1"
          step="1"
          className={`bf-input ${errors.limit ? 'error' : ''}`}
          placeholder="e.g. 300"
          value={limit}
          onChange={e => { setLimit(e.target.value); setErrors(p => ({ ...p, limit: undefined })); }}
          data-testid="input-budget-limit"
        />
        {errors.limit && <p className="bf-error">{errors.limit}</p>}
      </div>

      <div className="bf-actions">
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary btn-sm" data-testid="button-save-budget">
          {initial ? 'Save changes' : 'Add budget'}
        </button>
      </div>
    </form>
  );
};

// ── Category budget card ─────────────────────────────────────────────────────
const CategoryBudgetCard = ({ budget, spent, currency, onEdit, onDelete }) => {
  const pct = budget.limit > 0 ? Math.min(999, Math.round((spent / budget.limit) * 100)) : 0;
  const displayPct = Math.min(100, pct);
  const cls = statusClass(pct);
  const remaining = Math.max(0, budget.limit - spent);
  const overBy = Math.max(0, spent - budget.limit);

  return (
    <div className={`cat-budget-card ${cls}`} data-testid={`budget-card-${budget.category}`}>
      <div className="cat-budget-header">
        <div className="cat-budget-name-row">
          <span className="cat-budget-name">{budget.category}</span>
          <span className={`cat-budget-status-pill ${cls}`}>{statusLabel(pct)}</span>
        </div>
        <div className="cat-budget-actions">
          <button
            className="btn btn-icon btn-ghost"
            onClick={() => onEdit(budget)}
            title="Edit budget"
            data-testid={`button-edit-budget-${budget.category}`}
          >
            <Pencil size={14} />
          </button>
          <button
            className="btn btn-icon btn-ghost danger"
            onClick={() => onDelete(budget.id)}
            title="Delete budget"
            data-testid={`button-delete-budget-${budget.category}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="cat-budget-bar-row">
        <div className="cat-budget-bar">
          <div
            className={`cat-budget-fill ${cls}`}
            style={{ width: `${displayPct}%` }}
          />
        </div>
        <span className="cat-budget-pct">{pct}%</span>
      </div>

      <div className="cat-budget-stats">
        <div className="cat-stat">
          <span className="cat-stat-label">Spent</span>
          <span className="cat-stat-value">{formatCurrency(spent, currency)}</span>
        </div>
        <div className="cat-stat">
          <span className="cat-stat-label">Limit</span>
          <span className="cat-stat-value">{formatCurrency(budget.limit, currency)}</span>
        </div>
        <div className="cat-stat">
          <span className="cat-stat-label">{pct >= 100 ? 'Over by' : 'Remaining'}</span>
          <span className={`cat-stat-value ${pct >= 100 ? 'over-text' : 'remaining-text'}`}>
            {pct >= 100
              ? formatCurrency(overBy, currency)
              : formatCurrency(remaining, currency)
            }
          </span>
        </div>
      </div>

      {pct >= 75 && (
        <div className={`cat-budget-alert ${cls}`} data-testid={`alert-${budget.category}`}>
          <AlertTriangle size={14} />
          <span>
            {pct >= 100
              ? `Over budget by ${formatCurrency(overBy, currency)}`
              : `${100 - pct}% of budget remaining`
            }
          </span>
        </div>
      )}
    </div>
  );
};

// ── Main page ────────────────────────────────────────────────────────────────
const Budgets = () => {
  const [transactions, setTransactions] = useState([]);
  const [overallBudget, setOverallBudget] = useState({ monthly: 2000 });
  const [categoryBudgets, setCategoryBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({ currency: '£' });

  const [editingOverall, setEditingOverall] = useState(false);
  const [overallInput, setOverallInput] = useState('');
  const [overallError, setOverallError] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null); // budget object being edited
  const [deleteId, setDeleteId] = useState(null);

  const load = () => {
    setTransactions(getTransactions());
    setOverallBudget(getBudget());
    setCategoryBudgets(getCategoryBudgets());
    setCategories(getCategories());
    setSettings(getSettings());
  };

  useEffect(() => { load(); }, []);

  const currency = settings.currency || '£';
  const spent = totalExpensesThisMonth(transactions);
  const overallPct = overallBudget.monthly > 0
    ? Math.min(999, Math.round((spent / overallBudget.monthly) * 100))
    : 0;
  const overallDisplayPct = Math.min(100, overallPct);
  const overallCls = statusClass(overallPct);
  const daysLeft = daysLeftInMonth();
  const totalDays = daysInMonth();

  // Budget cards sorted: over budget first, then by % desc
  const sortedBudgets = [...categoryBudgets].sort((a, b) => {
    const pctA = a.limit > 0 ? (categorySpentThisMonth(transactions, a.category) / a.limit) * 100 : 0;
    const pctB = b.limit > 0 ? (categorySpentThisMonth(transactions, b.category) / b.limit) * 100 : 0;
    return pctB - pctA;
  });

  const takenCategories = categoryBudgets.map(b => b.category);
  const availableCategories = categories.filter(c => !takenCategories.includes(c));

  // ── Overall budget edit ──
  const handleOverallEdit = () => {
    setOverallInput(String(overallBudget.monthly));
    setOverallError('');
    setEditingOverall(true);
  };

  const handleOverallSave = () => {
    const num = Number(overallInput);
    if (isNaN(num) || num < 0) { setOverallError('Enter a valid amount'); return; }
    const updated = { monthly: num };
    saveBudget(updated);
    setOverallBudget(updated);
    setEditingOverall(false);
  };

  // ── Category budget CRUD ──
  const handleAddSave = ({ category, limit }) => {
    const updated = addCategoryBudget(category, limit);
    setCategoryBudgets(updated);
    setShowAddForm(false);
  };

  const handleEditSave = ({ category, limit }) => {
    const updated = updateCategoryBudget(editingBudget.id, limit);
    setCategoryBudgets(updated);
    setEditingBudget(null);
  };

  const handleDeleteConfirm = () => {
    const updated = deleteCategoryBudget(deleteId);
    setCategoryBudgets(updated);
    setDeleteId(null);
  };

  // Warning cards for the top summary
  const warningBudgets = sortedBudgets.filter(b => {
    const pct = b.limit > 0 ? (categorySpentThisMonth(transactions, b.category) / b.limit) * 100 : 0;
    return pct >= 75;
  });

  return (
    <div className="budgets-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Budgets</h1>
          <p className="page-subtitle">Track your spending limits</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setShowAddForm(true); setEditingBudget(null); }}
          disabled={availableCategories.length === 0}
          data-testid="button-add-budget"
        >
          <Plus size={18} />
          Add Budget
        </button>
      </div>

      {/* ── Warning Banner ── */}
      {warningBudgets.length > 0 && (
        <div className="warnings-banner" data-testid="warnings-banner">
          <AlertTriangle size={18} />
          <div>
            <p className="warnings-title">Budget alerts</p>
            <p className="warnings-body">
              {warningBudgets.map(b => {
                const s = categorySpentThisMonth(transactions, b.category);
                const pct = Math.round((s / b.limit) * 100);
                return pct >= 100
                  ? `${b.category} is over budget`
                  : `${b.category} is at ${pct}%`;
              }).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* ── Overall Budget ── */}
      <section className="overall-section">
        <div className={`overall-card ${overallCls}`} data-testid="overall-budget-card">
          <div className="overall-top">
            <div>
              <p className="overall-label">Overall Monthly Budget</p>
              {editingOverall ? (
                <div className="overall-edit-row">
                  <div className="budget-input-group">
                    <span className="budget-symbol">{currency}</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      className="budget-input"
                      value={overallInput}
                      onChange={e => { setOverallInput(e.target.value); setOverallError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleOverallSave()}
                      autoFocus
                      data-testid="input-overall-budget"
                    />
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={handleOverallSave} data-testid="button-save-overall">Save</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditingOverall(false)}>Cancel</button>
                </div>
              ) : (
                <div className="overall-amount-row">
                  <p className="overall-amount" data-testid="text-overall-budget">
                    {formatCurrency(overallBudget.monthly, currency)}
                  </p>
                  <button className="btn btn-ghost btn-sm" onClick={handleOverallEdit} data-testid="button-edit-overall">
                    <Pencil size={14} /> Edit
                  </button>
                </div>
              )}
              {overallError && <p className="bf-error">{overallError}</p>}
            </div>

            <div className="overall-meta">
              <div className="meta-item">
                <Calendar size={16} />
                <span>{daysLeft} day{daysLeft !== 1 ? 's' : ''} left</span>
              </div>
              <div className="meta-item">
                <TrendingUp size={16} />
                <span data-testid="text-overall-pct">{overallPct}% used</span>
              </div>
            </div>
          </div>

          <div className="overall-bar-row">
            <div className="overall-bar">
              <div className={`overall-fill ${overallCls}`} style={{ width: `${overallDisplayPct}%` }} />
            </div>
          </div>

          <div className="overall-stats">
            <div className="overall-stat">
              <span className="overall-stat-label">Spent this month</span>
              <span className="overall-stat-value expense-text" data-testid="text-overall-spent">
                {formatCurrency(spent, currency)}
              </span>
            </div>
            <div className="overall-stat">
              <span className="overall-stat-label">Remaining</span>
              <span className={`overall-stat-value ${overallPct >= 100 ? 'over-text' : 'remaining-text'}`} data-testid="text-overall-remaining">
                {formatCurrency(Math.max(0, overallBudget.monthly - spent), currency)}
              </span>
            </div>
            <div className="overall-stat">
              <span className="overall-stat-label">Days in month</span>
              <span className="overall-stat-value">{totalDays}</span>
            </div>
          </div>

          {overallPct >= 90 && (
            <div className={`overall-alert ${overallCls}`}>
              <AlertTriangle size={16} />
              <span>
                {overallPct >= 100
                  ? `You've exceeded your monthly budget by ${formatCurrency(spent - overallBudget.monthly, currency)}`
                  : `Only ${formatCurrency(overallBudget.monthly - spent, currency)} of your monthly budget remains`
                }
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ── Add form ── */}
      {showAddForm && (
        <div className="add-form-wrapper" data-testid="add-budget-form">
          <h3 className="add-form-title">Add category budget</h3>
          <BudgetForm
            categories={categories}
            takenCategories={takenCategories}
            onSave={handleAddSave}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* ── Category Budgets ── */}
      <section className="category-section">
        <div className="category-section-header">
          <h2 className="section-title">Category Budgets</h2>
          <span className="section-count">{categoryBudgets.length} budget{categoryBudgets.length !== 1 ? 's' : ''}</span>
        </div>

        {categoryBudgets.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No category budgets yet"
            description="Set individual spending limits per category to get more detailed control over your finances."
            action={
              <button
                className="btn btn-primary"
                onClick={() => setShowAddForm(true)}
                data-testid="button-add-first-budget"
              >
                <Plus size={16} /> Add your first category budget
              </button>
            }
          />
        ) : (
          <div className="cat-budgets-grid">
            {sortedBudgets.map(b => (
              editingBudget?.id === b.id ? (
                <div key={b.id} className={`cat-budget-card editing`} data-testid={`budget-edit-${b.category}`}>
                  <p className="edit-category-label">Editing: <strong>{b.category}</strong></p>
                  <BudgetForm
                    categories={categories}
                    takenCategories={takenCategories}
                    onSave={handleEditSave}
                    onCancel={() => setEditingBudget(null)}
                    initial={b}
                  />
                </div>
              ) : (
                <CategoryBudgetCard
                  key={b.id}
                  budget={b}
                  spent={categorySpentThisMonth(transactions, b.category)}
                  currency={currency}
                  onEdit={setEditingBudget}
                  onDelete={setDeleteId}
                />
              )
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete budget"
        message="Are you sure you want to delete this category budget? Your transactions won't be affected."
        confirmLabel="Delete budget"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export default Budgets;
