export function currency(amount) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatDate(value) {
  if (!value) return 'N/A';
  const date = value?.toDate ? value.toDate() : new Date(value);
  return new Intl.DateTimeFormat('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function roundNumber(value, digits = 1) {
  return Number(value || 0).toFixed(digits);
}
