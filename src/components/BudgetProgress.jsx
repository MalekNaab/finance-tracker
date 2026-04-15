import React from 'react';
import { AlertTriangle } from 'lucide-react';
import './BudgetProgress.css';

const BudgetProgress = ({ current, budget, currency = '£' }) => {
  const pct = budget > 0 ? Math.min(100, Math.round((current / budget) * 100)) : 0;
  const remaining = Math.max(0, budget - current);

  let statusClass = 'good';
  if (pct >= 90) statusClass = 'over';
  else if (pct >= 75) statusClass = 'warning';

  return (
    <div className={`budget-progress-card ${statusClass}`} data-testid="budget-progress">
      <div className="budget-header">
        <div>
          <p className="budget-label">Monthly Budget</p>
          <p className="budget-amount" data-testid="text-budget-amount">
            {currency}{budget.toLocaleString()}
          </p>
        </div>
        {pct >= 80 && (
          <div className="budget-warning-icon">
            <AlertTriangle size={20} />
          </div>
        )}
      </div>

      <div className="budget-bar-wrapper">
        <div className="budget-bar">
          <div
            className={`budget-bar-fill ${statusClass}`}
            style={{ width: `${pct}%` }}
            data-testid="budget-bar-fill"
          />
        </div>
        <span className="budget-pct" data-testid="text-budget-percent">{pct}%</span>
      </div>

      <div className="budget-stats">
        <div className="budget-stat">
          <span className="budget-stat-label">Spent</span>
          <span className="budget-stat-value expense" data-testid="text-budget-spent">
            {currency}{current.toLocaleString()}
          </span>
        </div>
        <div className="budget-stat">
          <span className="budget-stat-label">Remaining</span>
          <span className="budget-stat-value income" data-testid="text-budget-remaining">
            {currency}{remaining.toLocaleString()}
          </span>
        </div>
      </div>

      {pct >= 90 && (
        <div className="budget-alert-banner" data-testid="budget-alert-banner">
          <AlertTriangle size={16} />
          <span>Budget {pct >= 100 ? 'exceeded' : 'almost reached'}! Consider reviewing your spending.</span>
        </div>
      )}
    </div>
  );
};

export default BudgetProgress;
