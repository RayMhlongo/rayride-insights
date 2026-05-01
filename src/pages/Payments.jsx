import { useState } from 'react';
import DataTable from '../components/DataTable.jsx';
import { Actions, Field, FormGrid } from '../components/FormGrid.jsx';
import Modal from '../components/Modal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { currency, makeId, safeNumber, studentBalance, todayKey } from '../lib/utils';

const blank = { studentId: '', date: todayKey(), amount: '', method: 'Cash', note: '' };

export default function Payments({ app }) {
  const { data, setData } = app;
  const [editing, setEditing] = useState(null);
  const save = (record) => {
    const payment = { ...record, id: record.id || makeId('pay'), amount: safeNumber(record.amount), updatedAt: new Date().toISOString() };
    setData((current) => {
      const payments = current.payments.some((item) => item.id === payment.id) ? current.payments.map((item) => item.id === payment.id ? payment : item) : [...current.payments, payment];
      const students = current.students.map((student) => {
        if (student.id !== payment.studentId) return student;
        const balance = studentBalance(student, payments);
        return { ...student, paymentStatus: balance <= 0 ? 'Paid' : balance < safeNumber(student.monthlyFee) ? 'Partial' : 'Unpaid' };
      });
      return { ...current, payments, students };
    });
    setEditing(null);
  };
  const balances = data.students.map((student) => ({ ...student, balance: studentBalance(student, data.payments) }));
  return (
    <div className="space-y-4">
      <PageHeader title="Payments Ledger" description="Partial payments and monthly outstanding balances." actionLabel="Add payment" onAction={() => setEditing(blank)} />
      <div className="panel p-4">
        <h3 className="mb-3 font-bold text-navy">Outstanding balances</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {balances.filter((student) => student.balance > 0).map((student) => <div key={student.id} className="rounded-lg border border-line p-3"><p className="font-semibold">{student.name}</p><p className="text-sm text-danger">{currency(student.balance)} outstanding</p></div>)}
          {!balances.some((student) => student.balance > 0) && <p className="text-sm text-slate-500">All student accounts are settled for this month.</p>}
        </div>
      </div>
      <DataTable rows={[...data.payments].sort((a, b) => b.date.localeCompare(a.date))} onEdit={setEditing} onDelete={(id) => {
        const deletedAt = new Date().toISOString();
        setData((current) => ({ ...current, payments: current.payments.map((payment) => payment.id === id ? { ...payment, deletedAt, updatedAt: deletedAt } : payment) }));
      }} columns={[
        { key: 'date', label: 'Date' },
        { key: 'studentId', label: 'Student', render: (row) => data.students.find((student) => student.id === row.studentId)?.name || 'Missing student' },
        { key: 'amount', label: 'Amount', render: (row) => currency(row.amount) },
        { key: 'method', label: 'Method' },
        { key: 'note', label: 'Note' },
      ]} />
      {editing && <PaymentModal record={editing} data={data} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function PaymentModal({ record, data, onClose, onSave }) {
  const [form, setForm] = useState(record);
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <Modal title={record.id ? 'Edit payment' : 'Add payment'} onClose={onClose}>
      <FormGrid onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
        <Field label="Student"><select className="field" required value={form.studentId} onChange={(event) => set('studentId', event.target.value)}><option value="">Select student</option>{data.students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></Field>
        <Field label="Date"><input className="field" type="date" value={form.date} onChange={(event) => set('date', event.target.value)} /></Field>
        <Field label="Amount"><input className="field" type="number" min="0" required value={form.amount} onChange={(event) => set('amount', event.target.value)} /></Field>
        <Field label="Method"><select className="field" value={form.method} onChange={(event) => set('method', event.target.value)}><option>Cash</option><option>EFT</option><option>Card</option><option>Other</option></select></Field>
        <Field label="Note" wide><input className="field" value={form.note} onChange={(event) => set('note', event.target.value)} /></Field>
        <Actions onCancel={onClose} />
      </FormGrid>
    </Modal>
  );
}
