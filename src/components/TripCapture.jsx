import { Clock, LocateFixed, Play, Square, Waves } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  calculatePathDistance,
  clearActiveTrip,
  completeLearnedTrip,
  pointFromPosition,
  readActiveTrip,
  writeActiveTrip,
} from '../lib/routeLearning';

const CAPTURE_INTERVAL_MS = 6000;

export default function TripCapture({ app, compact = false }) {
  const [activeTrip, setActiveTrip] = useState(() => readActiveTrip());
  const [message, setMessage] = useState('');
  const intervalRef = useRef(null);
  const activeRef = useRef(activeTrip);

  useEffect(() => {
    activeRef.current = activeTrip;
  }, [activeTrip]);

  useEffect(() => {
    if (activeTrip?.active && !intervalRef.current) startPolling();
    return stopPolling;
  }, []);

  const points = activeTrip?.points || [];
  const distance = calculatePathDistance(points);
  const duration = activeTrip?.startedAt ? Math.max(Math.round((Date.now() - new Date(activeTrip.startedAt).getTime()) / 60000), 0) : 0;

  const startTrip = () => {
    if (!navigator.geolocation) {
      setMessage('GPS is not available on this device.');
      return;
    }
    const trip = { active: true, startedAt: new Date().toISOString(), points: [] };
    setActiveTrip(trip);
    activeRef.current = trip;
    writeActiveTrip(trip);
    setMessage('Starting GPS capture...');
    capturePoint();
    startPolling();
  };

  const endTrip = () => {
    const trip = activeRef.current;
    stopPolling();
    if (!trip?.points?.length || trip.points.length < 2) {
      setMessage('Keep the trip running until at least two GPS points are captured.');
      return;
    }
    app.setData((current) => completeLearnedTrip(current, trip));
    clearActiveTrip();
    setActiveTrip(null);
    activeRef.current = null;
    setMessage('Trip saved. Route memory updated automatically.');
  };

  const startPolling = () => {
    if (intervalRef.current || !navigator.geolocation) return;
    intervalRef.current = window.setInterval(capturePoint, CAPTURE_INTERVAL_MS);
  };

  const stopPolling = () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const capturePoint = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = pointFromPosition(position);
        const current = activeRef.current || { active: true, startedAt: new Date().toISOString(), points: [] };
        const last = current.points.at(-1);
        if (last && Math.abs(last.lat - point.lat) < 0.00001 && Math.abs(last.lng - point.lng) < 0.00001) return;
        const next = { ...current, points: [...current.points, point] };
        activeRef.current = next;
        setActiveTrip(next);
        writeActiveTrip(next);
        setMessage('GPS tracking active. Routes learn automatically.');
      },
      (error) => setMessage(error.message || 'GPS permission is needed to learn routes.'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );
  };

  return (
    <section className={`panel animate-in p-4 ${compact ? '' : 'lg:p-5'}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="label">Self-learning route recognition</p>
          <h3 className="mt-1 text-xl font-bold text-navy dark:text-slate-50">Driver Trip Capture</h3>
          <p className="muted mt-1 text-sm">Press start, drive the route, then end. Insight Rides learns the route pattern.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:w-72">
          <button className="btn-primary" disabled={Boolean(activeTrip?.active)} onClick={startTrip}><Play size={18} /> Start Trip</button>
          <button className="btn-danger" disabled={!activeTrip?.active} onClick={endTrip}><Square size={18} /> End Trip</button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MiniMetric icon={LocateFixed} label="GPS points" value={points.length} />
        <MiniMetric icon={Waves} label="Distance" value={`${distance.toFixed(2)} km`} />
        <MiniMetric icon={Clock} label="Duration" value={`${duration} min`} />
      </div>
      {message && <p className="mt-3 rounded-xl bg-cyan/10 p-3 text-sm font-semibold text-slate-800 dark:text-cyan">{message}</p>}
    </section>
  );
}

function MiniMetric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-line bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
        <Icon size={16} />
        <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-lg font-bold text-navy dark:text-slate-50">{value}</p>
    </div>
  );
}
