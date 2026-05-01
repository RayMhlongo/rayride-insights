import { useState } from 'react';
import DataTable from '../components/DataTable.jsx';
import { Actions, Field, FormGrid } from '../components/FormGrid.jsx';
import Modal from '../components/Modal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { currency, makeId, safeNumber } from '../lib/utils';

const blank = { name: '', stops: '', distance: '', fare: '', vehicleId: '' };

export default function RoutesPage({ app }) {
  const { data, setData } = app;
  const [editing, setEditing] = useState(null);
  const save = (record) => {
    const route = { ...record, id: record.id || makeId('route'), distance: safeNumber(record.distance), fare: safeNumber(record.fare), updatedAt: new Date().toISOString() };
    setData((current) => ({ ...current, routes: current.routes.some((item) => item.id === route.id) ? current.routes.map((item) => item.id === route.id ? route : item) : [...current.routes, route] }));
    setEditing(null);
  };
  const remove = (id) => {
    const deletedAt = new Date().toISOString();
    setData((current) => ({ ...current, routes: current.routes.map((route) => route.id === id ? { ...route, deletedAt, updatedAt: deletedAt } : route) }));
  };
  return (
    <div className="space-y-4">
      <PageHeader title="Routes Management" description="Stops, distance, fare, and assigned vehicle." actionLabel="Add route" onAction={() => setEditing(blank)} />
      <DataTable rows={data.routes} onEdit={setEditing} onDelete={remove} columns={[
        { key: 'name', label: 'Route' },
        { key: 'stops', label: 'Stops', render: (row) => row.stops || 'No stops listed' },
        { key: 'distance', label: 'Distance', render: (row) => `${row.distance || 0} km` },
        { key: 'fare', label: 'Standard fare', render: (row) => currency(row.fare) },
        { key: 'vehicleId', label: 'Vehicle', render: (row) => data.vehicles.find((item) => item.id === row.vehicleId)?.registration || 'Unassigned' },
      ]} />
      {editing && <RouteModal record={editing} data={data} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function RouteModal({ record, data, onClose, onSave }) {
  const [form, setForm] = useState(record);
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <Modal title={record.id ? 'Edit route' : 'Add route'} onClose={onClose}>
      <FormGrid onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
        <Field label="Route name"><input className="field" required value={form.name} onChange={(event) => set('name', event.target.value)} /></Field>
        <Field label="Estimated distance"><input className="field" type="number" min="0" step="0.1" value={form.distance} onChange={(event) => set('distance', event.target.value)} /></Field>
        <Field label="Standard fare"><input className="field" type="number" min="0" value={form.fare} onChange={(event) => set('fare', event.target.value)} /></Field>
        <Field label="Assigned vehicle"><select className="field" value={form.vehicleId} onChange={(event) => set('vehicleId', event.target.value)}><option value="">Unassigned</option>{data.vehicles.map((item) => <option key={item.id} value={item.id}>{item.registration}</option>)}</select></Field>
        <Field label="Stops" wide><textarea className="field" rows="4" placeholder="One stop per line or comma separated" value={form.stops} onChange={(event) => set('stops', event.target.value)} /></Field>
        <Actions onCancel={onClose} />
      </FormGrid>
    </Modal>
  );
}
