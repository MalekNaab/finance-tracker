import React, { useState, useEffect } from 'react';
import { Search, Filter, Trash2, Pencil, Receipt } from 'lucide-react';
import { getTransactions, saveTransactions, getCategories, getSettings } from '../utils/storage';
import { formatCurrency, formatDate } from '../utils/formatters';
import { SORT_OPTIONS } from '../utils/constants';
import CategoryBadge from '../components/CategoryBadge';
import EmptyState from '../components/EmptyState';
import TransactionModal from '../components/TransactionModal';
import ConfirmDialog from '../components/ConfirmDialog';
import './Transactions.css';

const generateId = () => Math.random().toString(36).substr(2, 9);

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({ currency: '£' });
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [sort, setSort] = useState('newest');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const load = () => {
    setTransactions(getTransactions());
    setCategories(getCategories());
    setSettings(getSettings());
  };

  useEffect(() => { load(); }, []);

  const currency = settings.currency || '£';

  // Build month options from transactions
  const monthOptions = React.useMemo(() => {
    const seen = new Set();
    transactions.forEach(t => {
      const d = new Date(t.date);
      seen.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    return [...seen].sort().reverse();
  }, [transactions]);

  const filtered = React.useMemo(() => {
    let result = [...transactions];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        (t.note && t.note.toLowerCase().includes(q)) ||
        t.category.toLowerCase().includes(q)
      );
    }

    if (filterType !== 'all') {
      result = result.filter(t => t.type === filterType);
    }

    if (filterCategory !== 'all') {
      result = result.filter(t => t.category === filterCategory);
    }

    if (filterMonth !== 'all') {
      result = result.filter(t => {
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return key === filterMonth;
      });
    }

    switch (sort) {
      case 'newest': result.sort((a, b) => new Date(b.date) - new Date(a.date)); break;
      case 'oldest': result.sort((a, b) => new Date(a.date) - new Date(b.date)); break;
      case 'highest': result.sort((a, b) => b.amount - a.amount); break;
      case 'lowest': result.sort((a, b) => a.amount - b.amount); break;
    }

    return result;
  }, [transactions, search, filterType, filterCategory, filterMonth, sort]);

  const handleSave = (formData) => {
    const all = getTransactions();
    let updated;
    if (editingTransaction) {
      updated = all.map(t => t.id === editingTransaction.id ? { ...t, ...formData } : t);
    } else {
      updated = [{ id: generateId(), ...formData }, ...all];
    }
    saveTransactions(updated);
    setTransactions(updated);
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleEdit = (tx) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    const updated = transactions.filter(t => t.id !== deleteId);
    saveTransactions(updated);
    setTransactions(updated);
    setDeleteId(null);
  };

  const clearFilters = () => {
    setSearch('');
    setFilterType('all');
    setFilterCategory('all');
    setFilterMonth('all');
    setSort('newest');
  };

  const hasFilters = search || filterType !== 'all' || filterCategory !== 'all' || filterMonth !== 'all';

  return (
    <div className="transactions-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">{transactions.length} total transaction{transactions.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }}
          data-testid="button-add-transaction"
        >
          + Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="search"
            className="search-input"
            placeholder="Search by note or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            data-testid="input-search"
          />
        </div>

        <div className="filter-controls">
          <select
            className="filter-select"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            data-testid="select-filter-type"
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <select
            className="filter-select"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            data-testid="select-filter-category"
          >
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            className="filter-select"
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            data-testid="select-filter-month"
          >
            <option value="all">All Months</option>
            {monthOptions.map(m => (
              <option key={m} value={m}>
                {new Date(m + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={sort}
            onChange={e => setSort(e.target.value)}
            data-testid="select-sort"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {hasFilters && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters} data-testid="button-clear-filters">
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No transactions yet"
          description="Add your first transaction to start tracking your finances."
          action={
            <button
              className="btn btn-primary"
              onClick={() => setIsModalOpen(true)}
              data-testid="button-add-first"
            >
              Add your first transaction
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <div className="no-results">
          <Filter size={24} />
          <p>No transactions match your filters.</p>
          <button className="btn btn-secondary btn-sm" onClick={clearFilters}>Clear filters</button>
        </div>
      ) : (
        <div className="tx-table-wrapper">
          <table className="tx-table" data-testid="transactions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Note</th>
                <th>Category</th>
                <th>Type</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} data-testid={`tx-row-${t.id}`}>
                  <td className="tx-date">{formatDate(t.date)}</td>
                  <td className="tx-note">{t.note || '—'}</td>
                  <td><CategoryBadge category={t.category} type={t.type} /></td>
                  <td>
                    <span className={`type-pill ${t.type}`}>{t.type}</span>
                  </td>
                  <td className={`tx-amount text-right ${t.type}`} data-testid={`amount-${t.id}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}
                  </td>
                  <td className="tx-actions text-right">
                    <button
                      className="btn btn-icon btn-ghost"
                      onClick={() => handleEdit(t)}
                      title="Edit"
                      data-testid={`button-edit-${t.id}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="btn btn-icon btn-ghost danger"
                      onClick={() => setDeleteId(t.id)}
                      title="Delete"
                      data-testid={`button-delete-${t.id}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTransaction(null); }}
        onSave={handleSave}
        categories={categories}
        editingTransaction={editingTransaction}
      />

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export default Transactions;
