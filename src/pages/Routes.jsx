import { useMemo, useState } from 'react';
import DataTable from '../components/DataTable.jsx';
import { Actions, Field, FormGrid } from '../components/FormGrid.jsx';
import Modal from '../components/Modal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { currency, makeId, safeNumber } from '../lib/utils';

const blank = { name: '', stops: '', distance: '', fare: '', vehicleId: '' };

export default function RoutesPage({ app }) {
  const { data, setData } = app;
  const [editing, setEditing] = useState(null);
  const summaries = useMemo(() => data.routes.map((route) => buildRouteSummary(route, data)), [data]);
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
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {summaries.map((summary) => (
          <article key={summary.id} className="panel animate-in p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="label">Route summary</p>
                <h2 className="mt-1 text-xl font-bold text-navy dark:text-slate-50">{summary.name}</h2>
              </div>
              {summary.learnedRoute && <span className="rounded-full bg-cyan/10 px-3 py-1 text-xs font-bold text-cyan">Learned</span>}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <SummaryMetric label="Avg distance" value={`${summary.averageDistance.toFixed(1)} km`} />
              <SummaryMetric label="Trips" value={summary.tripCount} />
              <SummaryMetric label="Students" value={summary.studentCount} />
              <SummaryMetric label="Vehicle" value={summary.vehicleName} />
            </div>
          </article>
        ))}
        {!summaries.length && <div className="panel p-4 text-sm text-slate-600 dark:text-slate-300">Routes will appear here after you add or learn one.</div>}
      </div>
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

function SummaryMetric({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
      <p className="label">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-navy dark:text-slate-50">{value || 'None'}</p>
    </div>
  );
}

function buildRouteSummary(route, data) {
  const routeTrips = data.trips.filter((trip) => trip.routeId === route.id);
  const vehicleCounts = routeTrips.reduce((counts, trip) => {
    if (!trip.vehicleId) return counts;
    counts[trip.vehicleId] = (counts[trip.vehicleId] || 0) + 1;
    return counts;
  }, {});
  const mostUsedVehicleId = Object.entries(vehicleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || route.vehicleId;
  const vehicle = data.vehicles.find((item) => item.id === mostUsedVehicleId);
  return {
    id: route.id,
    name: route.name,
    learnedRoute: route.learnedRoute,
    averageDistance: safeNumber(route.averageDistance, safeNumber(route.distance)),
    tripCount: routeTrips.length || safeNumber(route.frequency),
    studentCount: data.students.filter((student) => student.routeId === route.id).length,
    vehicleName: vehicle?.registration || vehicle?.model || 'Unassigned',
  };
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
