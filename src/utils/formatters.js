export const formatCurrency = (amount, currencySymbol = "$") => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD', // Using USD as a base for standard formatting, replacing symbol later
  })
    .format(amount)
    .replace('$', currencySymbol);
};

export const formatDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export const formatMonth = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric'
  }).format(date);
};
