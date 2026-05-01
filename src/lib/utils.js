import { makeId, safeNumber } from './data';

export { makeId, safeNumber };

export const currency = (value) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(safeNumber(value));

export const dateKey = (date = new Date()) => {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return '';
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const todayKey = () => dateKey(new Date());

export const monthKey = (date = new Date()) => dateKey(date).slice(0, 7);

export const sum = (items, selector) => (Array.isArray(items) ? items : []).reduce((total, item) => total + safeNumber(selector(item)), 0);

export const inMonth = (date, key = monthKey()) => String(date || '').startsWith(key);

export const inWeek = (date) => {
  const value = new Date(date);
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return value >= start && value < end;
};

export const downloadCsv = (filename, rows) => {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

export const studentBalance = (student, payments) => {
  const paid = sum(
    payments.filter((payment) => payment.studentId === student.id && inMonth(payment.date)),
    (payment) => payment.amount,
  );
  return Math.max(safeNumber(student.monthlyFee) - paid, 0);
};
