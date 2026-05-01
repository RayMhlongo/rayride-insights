import { Clock, LocateFixed, Play, Route, Square, Trash2, Users, Waves } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Modal from './Modal.jsx';
import {
  calculatePathDistance,
  clearActiveTrip,
  confirmLearnedTrip,
  pointFromPosition,
  prepareTripReview,
  readActiveTrip,
  writeActiveTrip,
} from '../lib/routeLearning';

const CAPTURE_INTERVAL_MS = 6000;
const MAX_ACCEPTED_ACCURACY_METERS = 120;

export default function TripCapture({ app, compact = false }) {
  const [activeTrip, setActiveTrip] = useState(() => readActiveTrip());
  const [pendingReview, setPendingReview] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
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
  const trackingActive = Boolean(activeTrip?.active);

  const startTrip = () => {
    if (!navigator.geolocation) {
      setMessage('GPS is not available on this device.');
      return;
    }
    const trip = { active: true, startedAt: new Date().toISOString(), points: [] };
    setActiveTrip(trip);
    activeRef.current = trip;
    writeActiveTrip(trip);
    setPendingReview(null);
    setMessage('Starting GPS capture. Keep this tab open while driving.');
    capturePoint();
    startPolling();
  };

  const endTrip = () => {
    const trip = activeRef.current;
    stopPolling();
    if (!trip) {
      setMessage('No active trip is running.');
      return;
    }
    try {
      const review = prepareTripReview(app.data, trip);
      const suggestedRouteId = review.suggestion?.route?.id || '';
      setPendingReview(review);
      setSelectedRouteId(suggestedRouteId);
      setSelectedStudents(app.data.students.filter((student) => student.routeId && student.routeId === suggestedRouteId).map((student) => student.id));
      clearActiveTrip();
      setActiveTrip(null);
      activeRef.current = null;
      setMessage('Review the detected route before saving.');
    } catch (error) {
      setMessage(error.message);
    }
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
        const accuracy = position.coords.accuracy || 0;
        if (accuracy > MAX_ACCEPTED_ACCURACY_METERS) {
          setMessage(`GPS accuracy is low (${Math.round(accuracy)}m). Waiting for a cleaner point.`);
          return;
        }
        const point = pointFromPosition(position);
        const current = activeRef.current || { active: true, startedAt: new Date().toISOString(), points: [] };
        const last = current.points.at(-1);
        if (last && Math.abs(last.lat - point.lat) < 0.00001 && Math.abs(last.lng - point.lng) < 0.00001) return;
        const next = { ...current, points: [...current.points, point] };
        activeRef.current = next;
        setActiveTrip(next);
        writeActiveTrip(next);
        setMessage('Tracking active. Insight Rides is collecting reliable GPS points.');
      },
      (error) => {
        const text = error.code === 1
          ? 'GPS permission was denied. Manual trip entry still works.'
          : error.code === 3
            ? 'GPS timed out. Move into open sky or continue with manual trip entry.'
            : error.message || 'GPS is unavailable. Manual trip entry still works.';
        setMessage(text);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );
  };

  const confirmExistingRoute = () => {
    if (!selectedRouteId || !pendingReview) return;
    app.setData((current) => confirmLearnedTrip(current, pendingReview, { routeId: selectedRouteId, studentIds: selectedStudents }));
    setPendingReview(null);
    setMessage('Trip saved to the selected route. Route memory updated.');
  };

  const saveNewRoute = () => {
    if (!pendingReview) return;
    app.setData((current) => confirmLearnedTrip(current, pendingReview, { studentIds: selectedStudents }));
    setPendingReview(null);
    setMessage('Trip saved as a new learned route.');
  };

  const discardTrip = () => {
    setPendingReview(null);
    setMessage('Trip discarded. No route data was saved.');
  };

  const toggleStudent = (studentId) => {
    setSelectedStudents((current) => current.includes(studentId) ? current.filter((id) => id !== studentId) : [...current, studentId]);
  };

  const chooseRoute = (routeId) => {
    setSelectedRouteId(routeId);
    setSelectedStudents(app.data.students.filter((student) => student.routeId && student.routeId === routeId).map((student) => student.id));
  };

  return (
    <section className={`panel animate-in p-4 ${compact ? '' : 'lg:p-5'}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="label">Self-learning route recognition</p>
          <h3 className="mt-1 text-xl font-bold text-navy dark:text-slate-50">Driver Trip Capture</h3>
          <p className="muted mt-1 text-sm">Press start, drive the route, then review before saving.</p>
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
      {trackingActive && <div className="mt-3 flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm font-bold text-success dark:bg-green-950 dark:text-green-200"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-success" /> Tracking Active</div>}
      {message && <p className="mt-3 rounded-xl bg-cyan/10 p-3 text-sm font-semibold text-slate-800 dark:text-cyan">{message}</p>}

      {pendingReview && (
        <ConfirmRouteModal
          app={app}
          review={pendingReview}
          selectedRouteId={selectedRouteId}
          setSelectedRouteId={chooseRoute}
          selectedStudents={selectedStudents}
          toggleStudent={toggleStudent}
          onUseExisting={confirmExistingRoute}
          onSaveNew={saveNewRoute}
          onDiscard={discardTrip}
        />
      )}
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

function ConfirmRouteModal({ app, review, selectedRouteId, setSelectedRouteId, selectedStudents, toggleStudent, onUseExisting, onSaveNew, onDiscard }) {
  const selectedRoute = app.data.routes.find((route) => route.id === selectedRouteId);
  const routeName = review.suggestion?.route?.name || 'New Route';
  const candidateStudents = app.data.students.filter((student) => !student.routeId || student.routeId === selectedRouteId);

  return (
    <Modal title="Confirm Route" onClose={onDiscard}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-cyan/25 bg-cyan/10 p-4">
          <p className="label">Detected route</p>
          <h3 className="mt-1 text-2xl font-bold text-navy dark:text-slate-50">{routeName}</h3>
          {review.suggestion && <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-cyan">This looks like "{review.suggestion.route.name}" - confidence {review.suggestion.confidence}.</p>}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <MiniMetric icon={Waves} label="Distance" value={`${review.distance.toFixed(2)} km`} />
          <MiniMetric icon={Clock} label="Duration" value={`${Math.round(review.durationSeconds / 60)} min`} />
          <MiniMetric icon={Route} label="Stops" value={review.estimatedStops.length || 'Start/end'} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <PointCard title="Start point" point={review.startPoint} />
          <PointCard title="End point" point={review.endPoint} />
        </div>

        <label className="grid gap-1">
          <span className="label">Use existing route</span>
          <select className="field" value={selectedRouteId} onChange={(event) => setSelectedRouteId(event.target.value)}>
            <option value="">Choose a route</option>
            {app.data.routes.map((route) => <option key={route.id} value={route.id}>{route.name}</option>)}
          </select>
        </label>

        {!!candidateStudents.length && (
          <div>
            <p className="label">Students on this trip</p>
            <p className="muted mb-2 text-sm">Optional. After repeated confirmations, unassigned students can be linked automatically.</p>
            <div className="grid max-h-40 gap-2 overflow-auto pr-1 sm:grid-cols-2">
              {candidateStudents.map((student) => (
                <button
                  key={student.id}
                  className={`min-h-11 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${selectedStudents.includes(student.id) ? 'border-cyan bg-cyan/10 text-navy dark:text-cyan' : 'border-line bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'}`}
                  onClick={() => toggleStudent(student.id)}
                >
                  <Users className="mr-2 inline" size={15} /> {student.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-3">
          <button className="btn-primary" disabled={!selectedRoute} onClick={onUseExisting}>Use Existing Route</button>
          <button className="btn-secondary" onClick={onSaveNew}>Save as New Route</button>
          <button className="btn-danger" onClick={onDiscard}><Trash2 size={18} /> Discard Trip</button>
        </div>
      </div>
    </Modal>
  );
}

function PointCard({ title, point }) {
  return (
    <div className="rounded-xl border border-line bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
      <p className="label">{title}</p>
      <p className="mt-1 text-sm font-bold text-navy dark:text-slate-50">{point.lat.toFixed(5)}, {point.lng.toFixed(5)}</p>
    </div>
  );
}
