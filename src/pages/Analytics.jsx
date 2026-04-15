import React, { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { PieChart as PieIcon, BarChart2 } from 'lucide-react';
import { getTransactions, getSettings } from '../utils/storage';
import { expensesByCategory, monthlySpending, totalExpenses, totalIncome } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';
import { EXPENSE_COLORS } from '../utils/constants';
import EmptyState from '../components/EmptyState';
import './Analytics.css';

const CustomTooltip = ({ active, payload, currency }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{payload[0].name || payload[0].dataKey}</p>
        <p className="chart-tooltip-value">{formatCurrency(payload[0].value, currency)}</p>
      </div>
    );
  }
  return null;
};

const Analytics = () => {
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState({ currency: '£' });

  useEffect(() => {
    setTransactions(getTransactions());
    setSettings(getSettings());
  }, []);

  const currency = settings.currency || '£';
  const pieData = expensesByCategory(transactions);
  const barData = monthlySpending(transactions);

  const totalInc = totalIncome(transactions);
  const totalExp = totalExpenses(transactions);

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Understand where your money goes</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="analytics-summary">
        <div className="summary-card" data-testid="summary-total-income">
          <p className="summary-label">Total Income</p>
          <p className="summary-value income">{formatCurrency(totalInc, currency)}</p>
        </div>
        <div className="summary-card" data-testid="summary-total-expenses">
          <p className="summary-label">Total Expenses</p>
          <p className="summary-value expense">{formatCurrency(totalExp, currency)}</p>
        </div>
        <div className="summary-card" data-testid="summary-net">
          <p className="summary-label">Net</p>
          <p className={`summary-value ${totalInc - totalExp >= 0 ? 'income' : 'expense'}`}>
            {formatCurrency(totalInc - totalExp, currency)}
          </p>
        </div>
      </div>

      <div className="charts-grid">
        {/* Expenses by Category */}
        <div className="chart-card" data-testid="chart-expenses-by-category">
          <h2 className="chart-title">Expenses by Category</h2>
          {pieData.length === 0 ? (
            <EmptyState
              icon={PieIcon}
              title="No expense data"
              description="Add some expense transactions to see spending by category."
            />
          ) : (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip currency={currency} />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Monthly Spending Trend */}
        <div className="chart-card" data-testid="chart-monthly-spending">
          <h2 className="chart-title">Monthly Spending (Last 6 Months)</h2>
          {barData.every(d => d.value === 0) ? (
            <EmptyState
              icon={BarChart2}
              title="No spending data"
              description="Add some expense transactions to see monthly trends."
            />
          ) : (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 13, fill: 'hsl(220 9% 46%)' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 13, fill: 'hsl(220 9% 46%)' }}
                    tickFormatter={v => `${currency}${v}`}
                    width={60}
                  />
                  <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ fill: 'hsl(165 81% 26% / 0.06)' }} />
                  <Bar dataKey="value" name="Spending" fill="hsl(165, 81%, 26%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Category breakdown table */}
      {pieData.length > 0 && (
        <div className="breakdown-card">
          <h2 className="chart-title">Category Breakdown</h2>
          <div className="breakdown-table-wrapper">
            <table className="breakdown-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">Share</th>
                </tr>
              </thead>
              <tbody>
                {pieData.map((row, i) => (
                  <tr key={row.name} data-testid={`breakdown-row-${row.name}`}>
                    <td>
                      <div className="category-label">
                        <span className="cat-dot" style={{ background: EXPENSE_COLORS[i % EXPENSE_COLORS.length] }} />
                        {row.name}
                      </div>
                    </td>
                    <td className="text-right font-medium">{formatCurrency(row.value, currency)}</td>
                    <td className="text-right text-muted">
                      {totalExp > 0 ? Math.round((row.value / totalExp) * 100) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
