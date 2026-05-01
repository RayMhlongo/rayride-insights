import { useState } from 'react';
import DataTable from '../components/DataTable.jsx';
import { Actions, Field, FormGrid } from '../components/FormGrid.jsx';
import Modal from '../components/Modal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { expenseCategories, incomeSources } from '../lib/constants';
import { currency, inMonth, makeId, safeNumber, sum, todayKey } from '../lib/utils';

const blankExpense = { type: 'expense', date: todayKey(), category: 'Fuel', amount: '', note: '' };
const blankIncome = { type: 'income', date: todayKey(), source: 'Student fees', amount: '', note: '' };

export default function Finance({ app }) {
  const { data, setData } = app;
  const [editing, setEditing] = useState(null);
  const income = sum(data.incomes.filter((item) => inMonth(item.date)), (item) => item.amount) + sum(data.trips.filter((trip) => inMonth(trip.date)), (trip) => trip.income);
  const expenses = sum(data.expenses.filter((item) => inMonth(item.date)), (item) => item.amount);
  const save = (record) => {
    const item = { ...record, id: record.id || makeId(record.type), amount: safeNumber(record.amount), updatedAt: new Date().toISOString() };
    const key = record.type === 'income' ? 'incomes' : 'expenses';
    setData((current) => ({ ...current, [key]: current[key].some((row) => row.id === item.id) ? current[key].map((row) => row.id === item.id ? item : row) : [...current[key], item] }));
    setEditing(null);
  };
  return (
    <div className="space-y-4">
      <PageHeader title="Income & Expenses" description={`Net profit this month: ${currency(income - expenses)}`} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Summary label="Income" value={currency(income)} tone="text-success" />
        <Summary label="Expenses" value={currency(expenses)} tone="text-danger" />
        <Summary label="Net profit" value={currency(income - expenses)} tone={income - expenses >= 0 ? 'text-success' : 'text-danger'} />
      </div>
      <div className="flex gap-2"><button className="btn-primary" onClick={() => setEditing(blankIncome)}>Add income</button><button className="btn-secondary" onClick={() => setEditing(blankExpense)}>Add expense</button></div>
      <DataTable rows={[...data.incomes.map((item) => ({ ...item, type: 'income' })), ...data.expenses.map((item) => ({ ...item, type: 'expense' }))].sort((a, b) => b.date.localeCompare(a.date))} onEdit={setEditing} onDelete={(id) => {
        const deletedAt = new Date().toISOString();
        setData((current) => ({ ...current, incomes: current.incomes.map((item) => item.id === id ? { ...item, deletedAt, updatedAt: deletedAt } : item), expenses: current.expenses.map((item) => item.id === id ? { ...item, deletedAt, updatedAt: deletedAt } : item) }));
      }} columns={[
        { key: 'date', label: 'Date' },
        { key: 'type', label: 'Type' },
        { key: 'category', label: 'Category', render: (row) => row.category || row.source },
        { key: 'amount', label: 'Amount', render: (row) => currency(row.amount) },
        { key: 'note', label: 'Note' },
      ]} />
      {editing && <FinanceModal record={editing} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function Summary({ label, value, tone }) {
  return <div className="panel p-4"><p className="label">{label}</p><p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p></div>;
}

function FinanceModal({ record, onClose, onSave }) {
  const [form, setForm] = useState(record);
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <Modal title={record.type === 'income' ? 'Income entry' : 'Expense entry'} onClose={onClose}>
      <FormGrid onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
        <Field label="Date"><input className="field" type="date" value={form.date} onChange={(event) => set('date', event.target.value)} /></Field>
        <Field label={form.type === 'income' ? 'Source' : 'Category'}><select className="field" value={form.category || form.source} onChange={(event) => set(form.type === 'income' ? 'source' : 'category', event.target.value)}>{(form.type === 'income' ? incomeSources : expenseCategories).map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Amount"><input className="field" type="number" min="0" required value={form.amount} onChange={(event) => set('amount', event.target.value)} /></Field>
        <Field label="Note"><input className="field" value={form.note} onChange={(event) => set('note', event.target.value)} /></Field>
        <Actions onCancel={onClose} />
      </FormGrid>
    </Modal>
  );
}
