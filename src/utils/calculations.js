export const totalIncome = (transactions) => {
  return transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
};

export const totalExpenses = (transactions) => {
  return transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
};

export const balance = (transactions) => {
  return totalIncome(transactions) - totalExpenses(transactions);
};

export const expensesByCategory = (transactions) => {
  const expenses = transactions.filter(t => t.type === 'expense');
  const grouped = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
    return acc;
  }, {});
  
  return Object.keys(grouped).map(key => ({
    name: key,
    value: grouped[key]
  })).sort((a, b) => b.value - a.value);
};

export const monthlySpending = (transactions) => {
  const expenses = transactions.filter(t => t.type === 'expense');
  const now = new Date();
  const months = [];
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      date: d,
      name: d.toLocaleString('default', { month: 'short' }),
      key: `${d.getFullYear()}-${d.getMonth()}`,
      value: 0
    });
  }

  expenses.forEach(t => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const monthObj = months.find(m => m.key === key);
    if (monthObj) {
      monthObj.value += Number(t.amount);
    }
  });

  return months;
};

export const budgetPercent = (expensesAmount, budgetAmount) => {
  if (!budgetAmount || budgetAmount <= 0) return 0;
  return Math.min(100, Math.round((expensesAmount / budgetAmount) * 100));
};

export const insights = (transactions, budget) => {
  const now = new Date();
  const currentMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  
  const lastMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
  });

  const currentExpenses = totalExpenses(currentMonthTx);
  const lastExpenses = totalExpenses(lastMonthTx);
  
  const categories = expensesByCategory(currentMonthTx);
  const topCategory = categories.length > 0 ? categories[0] : null;

  let trend = null;
  if (lastExpenses > 0) {
    const diff = currentExpenses - lastExpenses;
    const percent = Math.round(Math.abs(diff) / lastExpenses * 100);
    if (diff > 0) {
      trend = { direction: 'up', text: `Spending up ${percent}% vs last month` };
    } else if (diff < 0) {
      trend = { direction: 'down', text: `Spending down ${percent}% vs last month` };
    } else {
      trend = { direction: 'flat', text: `Spending same as last month` };
    }
  }

  const pct = budgetPercent(currentExpenses, budget?.monthly || 0);

  return {
    currentExpenses,
    topCategory,
    trend,
    budgetPct: pct
  };
};
