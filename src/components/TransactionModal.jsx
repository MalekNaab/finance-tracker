import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './TransactionModal.css';

const today = () => new Date().toISOString().slice(0, 10);

const defaultForm = {
  type: 'expense',
  amount: '',
  category: '',
  date: today(),
  note: '',
};

const TransactionModal = ({ isOpen, onClose, onSave, categories, editingTransaction }) => {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (editingTransaction) {
        setForm({
          type: editingTransaction.type,
          amount: String(editingTransaction.amount),
          category: editingTransaction.category,
          date: editingTransaction.date.slice(0, 10),
          note: editingTransaction.note || '',
        });
      } else {
        setForm({ ...defaultForm, date: today() });
      }
      setErrors({});
    }
  }, [isOpen, editingTransaction]);

  const validate = () => {
    const errs = {};
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      errs.amount = 'Please enter a valid amount greater than 0';
    }
    if (!form.category) {
      errs.category = 'Please select a category';
    }
    if (!form.date) {
      errs.date = 'Please select a date';
    }
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSave({
      ...form,
      amount: Number(form.amount),
      date: new Date(form.date).toISOString(),
    });
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  if (!isOpen) return null;

  const expenseCategories = categories.filter(c => c !== 'Salary');
  const incomeCategories = ['Salary', 'Other'];
  const availableCategories = form.type === 'income' ? incomeCategories : expenseCategories;

  return (
    <div className="modal-backdrop" onClick={onClose} data-testid="modal-backdrop">
      <div className="modal" onClick={e => e.stopPropagation()} data-testid="transaction-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button className="modal-close" onClick={onClose} data-testid="button-modal-close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form" noValidate>
          {/* Type Toggle */}
          <div className="form-group">
            <label className="form-label">Type</label>
            <div className="type-toggle">
              <button
                type="button"
                className={`type-btn ${form.type === 'expense' ? 'active expense' : ''}`}
                onClick={() => { handleChange('type', 'expense'); handleChange('category', ''); }}
                data-testid="button-type-expense"
              >
                Expense
              </button>
              <button
                type="button"
                className={`type-btn ${form.type === 'income' ? 'active income' : ''}`}
                onClick={() => { handleChange('type', 'income'); handleChange('category', ''); }}
                data-testid="button-type-income"
              >
                Income
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="form-group">
            <label className="form-label" htmlFor="amount">Amount</label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              className={`form-input ${errors.amount ? 'error' : ''}`}
              placeholder="0.00"
              value={form.amount}
              onChange={e => handleChange('amount', e.target.value)}
              data-testid="input-amount"
            />
            {errors.amount && <p className="form-error">{errors.amount}</p>}
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label" htmlFor="category">Category</label>
            <select
              id="category"
              className={`form-select ${errors.category ? 'error' : ''}`}
              value={form.category}
              onChange={e => handleChange('category', e.target.value)}
              data-testid="select-category"
            >
              <option value="">Select a category</option>
              {availableCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.category && <p className="form-error">{errors.category}</p>}
          </div>

          {/* Date */}
          <div className="form-group">
            <label className="form-label" htmlFor="date">Date</label>
            <input
              id="date"
              type="date"
              className={`form-input ${errors.date ? 'error' : ''}`}
              value={form.date}
              onChange={e => handleChange('date', e.target.value)}
              data-testid="input-date"
            />
            {errors.date && <p className="form-error">{errors.date}</p>}
          </div>

          {/* Note */}
          <div className="form-group">
            <label className="form-label" htmlFor="note">Note <span className="form-optional">(optional)</span></label>
            <input
              id="note"
              type="text"
              className="form-input"
              placeholder="e.g. Coffee with friends"
              value={form.note}
              onChange={e => handleChange('note', e.target.value)}
              data-testid="input-note"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} data-testid="button-cancel">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" data-testid="button-save-transaction">
              {editingTransaction ? 'Save Changes' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
