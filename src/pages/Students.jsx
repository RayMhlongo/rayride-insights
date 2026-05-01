import { useMemo, useState } from 'react';
import DataTable from '../components/DataTable.jsx';
import { Actions, Field, FormGrid } from '../components/FormGrid.jsx';
import Modal from '../components/Modal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { paymentStatuses } from '../lib/constants';
import { currency, makeId, safeNumber, studentBalance } from '../lib/utils';

const blank = { name: '', grade: '', school: '', pickupAddress: '', dropoffAddress: '', guardianContact: '', monthlyFee: '', paymentStatus: 'Unpaid', routeId: '', vehicleId: '' };

export default function Students({ app }) {
  const { data, setData } = app;
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [route, setRoute] = useState('');

  const rows = useMemo(() => data.students.filter((student) => {
    const text = `${student.name} ${student.school} ${student.grade}`.toLowerCase();
    return text.includes(search.toLowerCase()) && (!route || student.routeId === route);
  }), [data.students, route, search]);

  const save = (record) => {
    const student = { ...record, id: record.id || makeId('stu'), monthlyFee: safeNumber(record.monthlyFee), updatedAt: new Date().toISOString() };
    setData((current) => ({ ...current, students: current.students.some((item) => item.id === student.id) ? current.students.map((item) => item.id === student.id ? student : item) : [...current.students, student] }));
    setEditing(null);
  };

  const remove = (id) => {
    const deletedAt = new Date().toISOString();
    setData((current) => ({
      ...current,
      students: current.students.map((student) => student.id === id ? { ...student, deletedAt, updatedAt: deletedAt } : student),
      payments: current.payments.map((payment) => payment.studentId === id ? { ...payment, deletedAt, updatedAt: deletedAt } : payment),
    }));
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Student Management" description="Fees, routes, guardians, and balances." actionLabel="Add student" onAction={() => setEditing(blank)} />
      <div className="grid gap-3 sm:grid-cols-3">
        <input className="field sm:col-span-2" placeholder="Search name, school, or grade" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select className="field" value={route} onChange={(event) => setRoute(event.target.value)}>
          <option value="">All routes</option>
          {data.routes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </div>
      <DataTable
        rows={rows}
        onEdit={setEditing}
        onDelete={remove}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'school', label: 'School' },
          { key: 'routeId', label: 'Route', render: (row) => data.routes.find((item) => item.id === row.routeId)?.name || 'Unassigned' },
          { key: 'vehicleId', label: 'Driver/Vehicle', render: (row) => data.vehicles.find((item) => item.id === row.vehicleId)?.registration || 'Unassigned' },
          { key: 'monthlyFee', label: 'Monthly fee', render: (row) => currency(row.monthlyFee) },
          { key: 'balance', label: 'Outstanding', render: (row) => currency(studentBalance(row, data.payments)) },
          { key: 'paymentStatus', label: 'Status', render: (row) => <span className={`rounded-full px-2 py-1 text-xs font-bold ${row.paymentStatus === 'Paid' ? 'bg-green-50 text-success' : 'bg-red-50 text-danger'}`}>{row.paymentStatus}</span> },
        ]}
      />
      {editing && <StudentModal record={editing} data={data} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function StudentModal({ record, data, onClose, onSave }) {
  const [form, setForm] = useState(record);
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <Modal title={record.id ? 'Edit student' : 'Add student'} onClose={onClose}>
      <FormGrid onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
        <Field label="Name"><input className="field" required value={form.name} onChange={(event) => set('name', event.target.value)} /></Field>
        <Field label="Grade"><input className="field" value={form.grade} onChange={(event) => set('grade', event.target.value)} /></Field>
        <Field label="School"><input className="field" value={form.school} onChange={(event) => set('school', event.target.value)} /></Field>
        <Field label="Guardian contact"><input className="field" value={form.guardianContact} onChange={(event) => set('guardianContact', event.target.value)} /></Field>
        <Field label="Pickup address" wide><textarea className="field" rows="2" value={form.pickupAddress} onChange={(event) => set('pickupAddress', event.target.value)} /></Field>
        <Field label="Drop-off address" wide><textarea className="field" rows="2" value={form.dropoffAddress} onChange={(event) => set('dropoffAddress', event.target.value)} /></Field>
        <Field label="Monthly fee"><input className="field" type="number" min="0" value={form.monthlyFee} onChange={(event) => set('monthlyFee', event.target.value)} /></Field>
        <Field label="Payment status"><select className="field" value={form.paymentStatus} onChange={(event) => set('paymentStatus', event.target.value)}>{paymentStatuses.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Assigned route"><select className="field" value={form.routeId} onChange={(event) => set('routeId', event.target.value)}><option value="">Unassigned</option>{data.routes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
        <Field label="Driver/vehicle"><select className="field" value={form.vehicleId} onChange={(event) => set('vehicleId', event.target.value)}><option value="">Unassigned</option>{data.vehicles.map((item) => <option key={item.id} value={item.id}>{item.registration} - {item.assignedDriver}</option>)}</select></Field>
        <Actions onCancel={onClose} />
      </FormGrid>
    </Modal>
  );
}
