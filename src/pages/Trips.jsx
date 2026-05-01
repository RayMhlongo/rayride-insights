import { useState } from 'react';
import { Copy, Download } from 'lucide-react';
import DataTable from '../components/DataTable.jsx';
import { Actions, Field, FormGrid } from '../components/FormGrid.jsx';
import Modal from '../components/Modal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { tripTimes } from '../lib/constants';
import { currency, dateKey, downloadCsv, makeId, safeNumber, sum, todayKey } from '../lib/utils';

const blank = { date: todayKey(), time: 'morning', routeId: '', vehicleId: '', driver: '', studentsOnboard: '', distance: '', income: '', fuelCost: '', manualIncome: false };

export default function Trips({ app }) {
  const { data, setData } = app;
  const [editing, setEditing] = useState(null);
  const [warning, setWarning] = useState('');
  const todayTrips = data.trips.filter((trip) => trip.date === todayKey());

  const save = (record) => {
    const duplicate = data.trips.find((trip) => trip.id !== record.id && trip.date === record.date && trip.routeId === record.routeId && trip.time === record.time);
    if (duplicate) {
      setWarning('A trip already exists for this route, time, and date.');
      return;
    }
    const route = data.routes.find((item) => item.id === record.routeId);
    const students = data.students.filter((student) => student.routeId === record.routeId).length;
    const studentsOnboard = safeNumber(record.studentsOnboard, students);
    const trip = {
      ...record,
      id: record.id || makeId('trip'),
      studentsOnboard,
      distance: safeNumber(record.distance, route?.distance || 0),
      income: safeNumber(record.income, studentsOnboard * safeNumber(route?.fare)),
      fuelCost: safeNumber(record.fuelCost),
      updatedAt: new Date().toISOString(),
    };
    setData((current) => ({ ...current, trips: current.trips.some((item) => item.id === trip.id) ? current.trips.map((item) => item.id === trip.id ? trip : item) : [...current.trips, trip] }));
    setWarning('');
    setEditing(null);
  };

  const repeatYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const trips = data.trips.filter((trip) => trip.date === dateKey(yesterday));
    if (!trips.length) {
      setWarning('No trips found for yesterday.');
      return;
    }
    const copies = trips
      .filter((trip) => !data.trips.some((item) => item.date === todayKey() && item.time === trip.time && item.routeId === trip.routeId))
      .map((trip) => ({ ...trip, id: makeId('trip'), date: todayKey(), updatedAt: new Date().toISOString() }));
    if (!copies.length) {
      setWarning("Today already has copies of yesterday's trips.");
      return;
    }
    setData((current) => ({ ...current, trips: [...current.trips, ...copies] }));
  };

  const exportDaily = () => downloadCsv(`daily-trips-${todayKey()}.csv`, [
    ['Date', 'Time', 'Route', 'Vehicle', 'Driver', 'Students', 'Distance', 'Income', 'Fuel'],
    ...todayTrips.map((trip) => [trip.date, trip.time, data.routes.find((route) => route.id === trip.routeId)?.name, data.vehicles.find((vehicle) => vehicle.id === trip.vehicleId)?.registration, trip.driver, trip.studentsOnboard, trip.distance, trip.income, trip.fuelCost]),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader title="Trip Tracking" description={`${todayTrips.length} trips today, ${currency(sum(todayTrips, (trip) => trip.income))} income.`} actionLabel="Quick add trip" onAction={() => setEditing(blank)} />
      <div className="flex flex-wrap gap-2">
        <button className="btn-secondary" onClick={repeatYesterday}><Copy size={18} /> Repeat yesterday</button>
        <button className="btn-secondary" onClick={exportDaily}><Download size={18} /> Export daily CSV</button>
      </div>
      {warning && <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-warning">{warning}</div>}
      <DataTable rows={[...data.trips].sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))} onEdit={setEditing} onDelete={(id) => setData((current) => ({ ...current, trips: current.trips.map((trip) => trip.id === id ? { ...trip, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : trip) }))} columns={[
        { key: 'date', label: 'Date' },
        { key: 'time', label: 'Time' },
        { key: 'routeId', label: 'Route', render: (row) => data.routes.find((item) => item.id === row.routeId)?.name || 'Missing route' },
        { key: 'vehicleId', label: 'Vehicle', render: (row) => data.vehicles.find((item) => item.id === row.vehicleId)?.registration || 'Unassigned' },
        { key: 'studentsOnboard', label: 'Students' },
        { key: 'distance', label: 'Distance', render: (row) => `${row.distance || 0} km` },
        { key: 'income', label: 'Income', render: (row) => currency(row.income) },
        { key: 'fuelCost', label: 'Fuel', render: (row) => currency(row.fuelCost) },
      ]} />
      {editing && <TripModal record={editing} data={data} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function TripModal({ record, data, onClose, onSave }) {
  const [form, setForm] = useState(record);
  const set = (key, value) => {
    const next = { ...form, [key]: value };
    if (key === 'routeId') {
      const route = data.routes.find((item) => item.id === value);
      const vehicle = data.vehicles.find((item) => item.id === route?.vehicleId);
      const students = data.students.filter((student) => student.routeId === value).length;
      next.vehicleId = route?.vehicleId || '';
      next.driver = vehicle?.assignedDriver || '';
      next.distance = route?.distance || '';
      next.studentsOnboard = students;
      next.income = students * safeNumber(route?.fare);
    }
    setForm(next);
  };
  return (
    <Modal title={record.id ? 'Edit trip' : 'Quick add trip'} onClose={onClose}>
      <FormGrid onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
        <Field label="Date"><input className="field" type="date" required value={form.date} onChange={(event) => set('date', event.target.value)} /></Field>
        <Field label="Time"><select className="field" value={form.time} onChange={(event) => set('time', event.target.value)}>{tripTimes.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Route"><select className="field" required value={form.routeId} onChange={(event) => set('routeId', event.target.value)}><option value="">Select route</option>{data.routes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
        <Field label="Vehicle"><select className="field" required value={form.vehicleId} onChange={(event) => set('vehicleId', event.target.value)}><option value="">Select vehicle</option>{data.vehicles.map((item) => <option key={item.id} value={item.id}>{item.registration}</option>)}</select></Field>
        <Field label="Driver"><input className="field" value={form.driver} onChange={(event) => set('driver', event.target.value)} /></Field>
        <Field label="Students onboard"><input className="field" type="number" min="0" value={form.studentsOnboard} onChange={(event) => set('studentsOnboard', event.target.value)} /></Field>
        <Field label="Distance km"><input className="field" type="number" min="0" step="0.1" value={form.distance} onChange={(event) => set('distance', event.target.value)} /></Field>
        <Field label="Income"><input className="field" type="number" min="0" value={form.income} onChange={(event) => set('income', event.target.value)} /></Field>
        <Field label="Fuel cost"><input className="field" type="number" min="0" value={form.fuelCost} onChange={(event) => set('fuelCost', event.target.value)} /></Field>
        <Actions onCancel={onClose} submitLabel="Save trip" />
      </FormGrid>
    </Modal>
  );
}
