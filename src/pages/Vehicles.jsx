import { useState } from 'react';
import DataTable from '../components/DataTable.jsx';
import { Actions, Field, FormGrid } from '../components/FormGrid.jsx';
import Modal from '../components/Modal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { makeId, safeNumber } from '../lib/utils';

const blank = { registration: '', model: '', fuelType: 'Petrol', averageFuelConsumption: '', maintenanceHistory: '', assignedDriver: '', lastServiceDate: '', active: true };

export default function Vehicles({ app }) {
  const { data, setData } = app;
  const [editing, setEditing] = useState(null);
  const save = (record) => {
    const vehicle = { ...record, id: record.id || makeId('veh'), averageFuelConsumption: safeNumber(record.averageFuelConsumption), active: Boolean(record.active), updatedAt: new Date().toISOString() };
    setData((current) => ({ ...current, vehicles: current.vehicles.some((item) => item.id === vehicle.id) ? current.vehicles.map((item) => item.id === vehicle.id ? vehicle : item) : [...current.vehicles, vehicle] }));
    setEditing(null);
  };
  return (
    <div className="space-y-4">
      <PageHeader title="Vehicle Management" description="Drivers, service notes, and operating status." actionLabel="Add vehicle" onAction={() => setEditing(blank)} />
      <DataTable rows={data.vehicles} onEdit={setEditing} onDelete={(id) => {
        const deletedAt = new Date().toISOString();
        setData((current) => ({ ...current, vehicles: current.vehicles.map((vehicle) => vehicle.id === id ? { ...vehicle, deletedAt, updatedAt: deletedAt } : vehicle) }));
      }} columns={[
        { key: 'registration', label: 'Registration' },
        { key: 'model', label: 'Model' },
        { key: 'fuelType', label: 'Fuel' },
        { key: 'averageFuelConsumption', label: 'Avg fuel', render: (row) => row.averageFuelConsumption ? `${row.averageFuelConsumption} L/100km` : 'Not set' },
        { key: 'assignedDriver', label: 'Driver' },
        { key: 'lastServiceDate', label: 'Last service' },
        { key: 'active', label: 'Status', render: (row) => <span className={`rounded-full px-2 py-1 text-xs font-bold ${row.active ? 'bg-green-50 text-success' : 'bg-slate-100 text-slate-600'}`}>{row.active ? 'Active' : 'Inactive'}</span> },
      ]} />
      {editing && <VehicleModal record={editing} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function VehicleModal({ record, onClose, onSave }) {
  const [form, setForm] = useState(record);
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <Modal title={record.id ? 'Edit vehicle' : 'Add vehicle'} onClose={onClose}>
      <FormGrid onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
        <Field label="Registration"><input className="field" required value={form.registration} onChange={(event) => set('registration', event.target.value)} /></Field>
        <Field label="Model"><input className="field" value={form.model} onChange={(event) => set('model', event.target.value)} /></Field>
        <Field label="Fuel type"><select className="field" value={form.fuelType} onChange={(event) => set('fuelType', event.target.value)}><option>Petrol</option><option>Diesel</option><option>Hybrid</option></select></Field>
        <Field label="Average fuel consumption"><input className="field" type="number" min="0" step="0.1" value={form.averageFuelConsumption} onChange={(event) => set('averageFuelConsumption', event.target.value)} /></Field>
        <Field label="Assigned driver"><input className="field" value={form.assignedDriver} onChange={(event) => set('assignedDriver', event.target.value)} /></Field>
        <Field label="Last service date"><input className="field" type="date" value={form.lastServiceDate} onChange={(event) => set('lastServiceDate', event.target.value)} /></Field>
        <Field label="Maintenance history" wide><textarea className="field" rows="4" value={form.maintenanceHistory} onChange={(event) => set('maintenanceHistory', event.target.value)} /></Field>
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.active} onChange={(event) => set('active', event.target.checked)} /> Active vehicle</label>
        <Actions onCancel={onClose} />
      </FormGrid>
    </Modal>
  );
}
