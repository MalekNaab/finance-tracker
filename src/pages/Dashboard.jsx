import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, Plus, ArrowRight, PieChart as PieIcon } from 'lucide-react';
import { Link } from 'wouter';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { getTransactions, getBudget, getSettings, getCategories, saveTransactions } from '../utils/storage';
import { totalIncome, totalExpenses, balance, insights, expensesByCategory } from '../utils/calculations';
import { formatCurrency, formatDate } from '../utils/formatters';
import { EXPENSE_COLORS } from '../utils/constants';
import BudgetProgress from '../components/BudgetProgress';
import InsightCard from '../components/InsightCard';
import CategoryBadge from '../components/CategoryBadge';
import EmptyState from '../components/EmptyState';
import TransactionModal from '../components/TransactionModal';
import './Dashboard.css';

const generateId = () => Math.random().toString(36).substr(2, 9);

const StatCard = ({ label, value, icon: Icon, colorClass, testId }) => (
  <div className={`stat-card ${colorClass}`} data-testid={testId}>
    <div className="stat-icon">
      <Icon size={22} />
    </div>
    <div className="stat-content">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, currency }) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0].payload;
    return (
      <div className="chart-tooltip">
        <p className="tooltip-name">{name}</p>
        <p className="tooltip-value">{formatCurrency(value, currency)}</p>
      </div>
    );
  }
  return null;
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const SpendingByCategoryChart = ({ transactions, currency }) => {
  const data = expensesByCategory(transactions);

  if (data.length === 0) {
    return (
      <div className="chart-empty">
        <PieIcon size={32} strokeWidth={1.5} />
        <p>No expense data yet</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={270}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={100}
          dataKey="value"
          labelLine={false}
          label={renderCustomLabel}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={EXPENSE_COLORS[i % EXPENSE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip currency={currency} />} />
        <Legend
          iconType="circle"
          iconSize={10}
          formatter={(value) => (
            <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--foreground))' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [budget, setBudget] = useState({ monthly: 2000 });
  const [settings, setSettings] = useState({ currency: '£', theme: 'light' });
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const load = () => {
    setTransactions(getTransactions());
    setBudget(getBudget());
    setSettings(getSettings());
    setCategories(getCategories());
  };

  useEffect(() => { load(); }, []);

  const now = new Date();
  const currentMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const income = totalIncome(transactions);
  const expenses = totalExpenses(transactions);
  const bal = balance(transactions);
  const currentExpenses = totalExpenses(currentMonthTx);
  const appInsights = insights(transactions, budget);
  const currency = settings.currency || '£';

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const handleSaveTransaction = (formData) => {
    const all = getTransactions();
    const updated = [{ id: generateId(), ...formData }, ...all];
    saveTransactions(updated);
    setTransactions(updated);
    setIsModalOpen(false);
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your financial overview</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
          data-testid="button-add-transaction"
        >
          <Plus size={18} />
          Add Transaction
        </button>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard
          label="Total Balance"
          value={formatCurrency(bal, currency)}
          icon={Wallet}
          colorClass={bal >= 0 ? 'stat-balance' : 'stat-negative'}
          testId="stat-balance"
        />
        <StatCard
          label="Total Income"
          value={formatCurrency(income, currency)}
          icon={TrendingUp}
          colorClass="stat-income"
          testId="stat-income"
        />
        <StatCard
          label="Total Expenses"
          value={formatCurrency(expenses, currency)}
          icon={TrendingDown}
          colorClass="stat-expense"
          testId="stat-expenses"
        />
      </div>

      {/* Budget + Insights */}
      <div className="dashboard-grid">
        <div className="dashboard-section">
          <BudgetProgress current={currentExpenses} budget={budget.monthly} currency={currency} />
        </div>
        <div className="dashboard-section">
          <h2 className="section-title">Insights</h2>
          <div className="insights-list">
            {appInsights.topCategory && (
              <InsightCard
                type="category"
                text={`Highest spending: ${appInsights.topCategory.name} (${formatCurrency(appInsights.topCategory.value, currency)})`}
              />
            )}
            {appInsights.trend && (
              <InsightCard
                type={appInsights.trend.direction}
                text={appInsights.trend.text}
              />
            )}
            {budget.monthly > 0 && (
              <InsightCard
                type="budget"
                text={`Budget ${appInsights.budgetPct}% used this month`}
              />
            )}
            {!appInsights.topCategory && !appInsights.trend && (
              <p className="no-insights">Add some transactions to see insights.</p>
            )}
          </div>
        </div>
      </div>

      {/* Spending by Category Pie Chart */}
      <div className="spending-chart-section" data-testid="section-spending-by-category">
        <h2 className="section-title">Spending by Category</h2>
        <div className="spending-chart-card">
          <SpendingByCategoryChart transactions={transactions} currency={currency} />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="recent-transactions-section">
        <div className="section-header">
          <h2 className="section-title">Recent Transactions</h2>
          <Link href="/transactions" className="section-link" data-testid="link-all-transactions">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No transactions yet"
            description="Start tracking your finances by adding your first transaction."
            action={
              <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} data-testid="button-add-first">
                Add your first transaction
              </button>
            }
          />
        ) : (
          <div className="transactions-list">
            {recentTransactions.map(t => (
              <div key={t.id} className="transaction-row" data-testid={`transaction-row-${t.id}`}>
                <div className="transaction-info">
                  <div className="transaction-meta">
                    <span className="transaction-note">{t.note || t.category}</span>
                    <CategoryBadge category={t.category} type={t.type} />
                  </div>
                  <span className="transaction-date">{formatDate(t.date)}</span>
                </div>
                <span className={`transaction-amount ${t.type}`} data-testid={`amount-${t.id}`}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        categories={categories}
        editingTransaction={null}
      />
    </div>
  );
};

export default Dashboard;
