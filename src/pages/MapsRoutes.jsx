import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Bus, Car, ChevronDown, LocateFixed, MapPinned, Route as RouteIcon, Users } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import TripCapture from '../components/TripCapture.jsx';
import { normalizePath } from '../lib/routeLearning';

const DEFAULT_CENTER = [-26.2041, 28.0473];
const DEFAULT_ZOOM = 11;
const routeColors = ['#00d7ff', '#7c3aed', '#22c55e', '#f59e0b', '#ef4444', '#14b8a6'];

const markerIcon = (type) => L.divIcon({
  className: '',
  html: `<span class="map-marker map-marker-${type}"></span>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

export default function MapsRoutes({ app }) {
  const { data } = app;
  const [visible, setVisible] = useState({ students: true, vehicles: true, routes: true });
  const [focusedRouteId, setFocusedRouteId] = useState('');
  const [controlsOpen, setControlsOpen] = useState(false);

  const routeMap = useMemo(() => new Map(data.routes.map((route) => [route.id, route])), [data.routes]);
  const mapData = useMemo(() => buildMapData(data), [data]);
  const focusedRoute = mapData.routes.find((route) => route.id === focusedRouteId);
  const center = focusedRoute?.points?.[0] || DEFAULT_CENTER;

  return (
    <div className="space-y-4">
      <PageHeader title="Maps & Routes" description="OpenStreetMap view of learned routes, pickups, and assigned vehicles." />
      <TripCapture app={app} compact />

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="panel order-2 p-4 xl:order-1">
          <button className="flex w-full items-center justify-between gap-3 text-left xl:pointer-events-none" onClick={() => setControlsOpen((current) => !current)}>
            <div>
              <h2 className="text-xl font-bold text-navy dark:text-slate-50">Map Controls</h2>
              <p className="muted text-sm">Toggle layers and focus learned routes.</p>
            </div>
            <ChevronDown className={`transition xl:hidden ${controlsOpen ? 'rotate-180' : ''}`} size={20} />
          </button>

          <div className={`${controlsOpen ? 'block' : 'hidden'} xl:block`}>
          <div className="mt-4 grid grid-cols-3 gap-2 xl:grid-cols-1">
            <Toggle active={visible.students} icon={Users} label="Students" onClick={() => setVisible((current) => ({ ...current, students: !current.students }))} />
            <Toggle active={visible.vehicles} icon={Car} label="Vehicles" onClick={() => setVisible((current) => ({ ...current, vehicles: !current.vehicles }))} />
            <Toggle active={visible.routes} icon={RouteIcon} label="Routes" onClick={() => setVisible((current) => ({ ...current, routes: !current.routes }))} />
          </div>

          <div className="mt-5 space-y-2">
            <p className="label">Routes</p>
            <button className={`btn-secondary w-full justify-start ${!focusedRouteId ? 'ring-2 ring-cyan/20' : ''}`} onClick={() => setFocusedRouteId('')}>
              <MapPinned size={18} /> Show all routes
            </button>
            {mapData.routes.map((route) => (
              <button key={route.id} className={`btn-secondary w-full justify-start ${focusedRouteId === route.id ? 'ring-2 ring-cyan/40' : ''}`} onClick={() => setFocusedRouteId(route.id)}>
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: route.color }} />
                {route.name}
              </button>
            ))}
            {!mapData.routes.length && <p className="muted text-sm">Add routes to see route lines here.</p>}
          </div>
          </div>
        </aside>

        <section className="panel order-1 overflow-hidden xl:order-2">
          <div className="h-[72vh] min-h-[560px] w-full overflow-hidden rounded-2xl md:h-[calc(100vh-150px)]">
            <MapContainer center={center} zoom={DEFAULT_ZOOM} scrollWheelZoom className="h-full w-full">
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapFocus center={center} routeId={focusedRouteId} />

              {visible.routes && mapData.routes.map((route) => {
                const active = !focusedRouteId || focusedRouteId === route.id;
                return (
                  <Polyline
                    key={route.id}
                    positions={route.points}
                    pathOptions={{ color: route.color, weight: active ? 6 : 3, opacity: active ? 0.9 : 0.25 }}
                  />
                );
              })}

              {visible.routes && mapData.routes.flatMap((route) => [
                <Marker key={`${route.id}-start`} position={route.points[0]} icon={markerIcon('start')}>
                  <Popup><RoutePopup title={`${route.name} start`} route={route} onFocus={() => setFocusedRouteId(route.id)} /></Popup>
                </Marker>,
                <Marker key={`${route.id}-end`} position={route.points.at(-1)} icon={markerIcon('end')}>
                  <Popup><RoutePopup title={`${route.name} end`} route={route} onFocus={() => setFocusedRouteId(route.id)} /></Popup>
                </Marker>,
              ])}

              {visible.students && mapData.students.map((student) => {
                const route = routeMap.get(student.routeId);
                return (
                  <Marker key={student.id} position={student.position} icon={markerIcon('student')}>
                    <Popup>
                      <MarkerPopup
                        title={student.name}
                        subtitle={student.school || 'School not set'}
                        lines={[student.pickupAddress || 'Pickup address not set', route?.name || 'No route assigned']}
                        navigateQuery={student.pickupAddress}
                        onFocus={() => student.routeId && setFocusedRouteId(student.routeId)}
                      />
                    </Popup>
                  </Marker>
                );
              })}

              {visible.vehicles && mapData.vehicles.map((vehicle) => {
                const route = routeMap.get(vehicle.routeId);
                return (
                  <Marker key={vehicle.id} position={vehicle.position} icon={markerIcon('vehicle')}>
                    <Popup>
                      <MarkerPopup
                        title={vehicle.registration || vehicle.model || 'Vehicle'}
                        subtitle={vehicle.assignedDriver || 'Driver not assigned'}
                        lines={[route?.name || 'No route assigned', vehicle.active ? 'Active vehicle' : 'Inactive vehicle']}
                        navigateQuery={route?.stops || route?.name}
                        onFocus={() => vehicle.routeId && setFocusedRouteId(vehicle.routeId)}
                      />
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </section>
      </div>
    </div>
  );
}

function Toggle({ active, icon: Icon, label, onClick }) {
  return (
    <button className={`${active ? 'btn-primary' : 'btn-secondary'} w-full`} onClick={onClick}>
      <Icon size={18} /> {label}
    </button>
  );
}

function MapFocus({ center, routeId }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, routeId ? 13 : DEFAULT_ZOOM, { duration: 0.45 });
  }, [center, map, routeId]);
  return null;
}

function RoutePopup({ title, route, onFocus }) {
  return (
    <div className="min-w-48 space-y-2">
      <p className="font-bold">{title}</p>
      <p className="text-sm">{route.distance || 0} km estimated</p>
      <button className="map-popup-btn" onClick={onFocus}>Focus route</button>
    </div>
  );
}

function MarkerPopup({ title, subtitle, lines, navigateQuery, onFocus }) {
  const openNavigation = () => {
    const query = encodeURIComponent(navigateQuery || title);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-w-56 space-y-2">
      <div>
        <p className="font-bold">{title}</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">{subtitle}</p>
      </div>
      {lines.map((line) => <p key={line} className="text-sm">{line}</p>)}
      <div className="grid grid-cols-2 gap-2">
        <button className="map-popup-btn" onClick={openNavigation}><LocateFixed size={14} /> Navigate</button>
        <button className="map-popup-btn" onClick={onFocus}><Bus size={14} /> Focus route</button>
      </div>
    </div>
  );
}

function buildMapData(data) {
  const mostUsedRoute = [...data.routes].sort((a, b) => (b.frequency || 0) - (a.frequency || 0))[0];
  const routes = data.routes.map((route, index) => {
    const routeStudents = data.students.filter((student) => student.routeId === route.id);
    const learnedPoints = normalizePath(route.pathCoordinates);
    const stopPoints = parseStops(route.stops);
    const studentPoints = routeStudents.map((student, studentIndex) => getRecordPosition(student, studentIndex, index));
    const fallback = [seedPosition(route.id || route.name, index, 8), seedPosition(`${route.id}-end`, index + 3, 16)];
    const points = learnedPoints.length >= 2 ? learnedPoints : stopPoints.length >= 2 ? stopPoints : studentPoints.length >= 2 ? studentPoints : fallback;
    return { ...route, points, color: routeColors[index % routeColors.length] };
  });
  const mostUsedMapRoute = routes.find((route) => route.id === mostUsedRoute?.id);

  const students = data.students.map((student, index) => ({
    ...student,
    routeId: student.routeId || mostUsedRoute?.id || '',
    position: student.routeId
      ? getRecordPosition(student, index, routeIndex(data.routes, student.routeId))
      : pointAlongRoute(mostUsedMapRoute, index, data.students.length) || getRecordPosition(student, index, 0),
  }));

  const vehicles = data.vehicles.map((vehicle, index) => {
    const assignedRoute = data.routes.find((route) => route.vehicleId === vehicle.id);
    const route = routes.find((item) => item.id === assignedRoute?.id);
    return {
      ...vehicle,
      routeId: assignedRoute?.id || mostUsedRoute?.id || '',
      position: route?.points?.at(-1) || pointAlongRoute(mostUsedMapRoute, index + 1, data.vehicles.length + 1) || seedPosition(vehicle.id || vehicle.registration, index, 18),
    };
  });

  return { routes, students, vehicles };
}

function pointAlongRoute(route, index, total) {
  if (!route?.points?.length) return null;
  const safeTotal = Math.max(total, 1);
  const routeIndex = Math.min(Math.round(((index + 1) / (safeTotal + 1)) * (route.points.length - 1)), route.points.length - 1);
  const point = route.points[routeIndex];
  const lat = Array.isArray(point) ? point[0] : point.lat;
  const lng = Array.isArray(point) ? point[1] : point.lng;
  const jitter = (index % 5) * 0.00035;
  return [lat + jitter, lng - jitter];
}

function routeIndex(routes, routeId) {
  return Math.max(routes.findIndex((route) => route.id === routeId), 0);
}

function parseStops(stops = '') {
  return String(stops)
    .split(/\n|;/)
    .map((stop) => parseLatLng(stop))
    .filter(Boolean);
}

function getRecordPosition(record, index, groupIndex) {
  return parseLatLng(record.pickupAddress) || parseLatLng(record.address) || parseLatLng(record.location) || seedPosition(record.id || record.name, index + groupIndex, 6 + groupIndex * 2);
}

function parseLatLng(value = '') {
  const match = String(value).match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lat, lng];
}

function seedPosition(seed = '', index = 0, radiusKm = 10) {
  const hash = [...String(seed || index)].reduce((total, char) => total + char.charCodeAt(0), 0);
  const angle = ((hash + index * 47) % 360) * (Math.PI / 180);
  const radius = radiusKm + ((hash % 7) * 0.45);
  const latOffset = (Math.cos(angle) * radius) / 111;
  const lngOffset = (Math.sin(angle) * radius) / (111 * Math.cos(DEFAULT_CENTER[0] * Math.PI / 180));
  return [DEFAULT_CENTER[0] + latOffset, DEFAULT_CENTER[1] + lngOffset];
}
