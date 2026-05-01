import { makeId, nowIso, safeNumber } from './data';
import { dateKey } from './utils';

export const ACTIVE_TRIP_KEY = 'insight-rides-active-gps-trip-v1';

const MATCH_THRESHOLD_METERS = 420;
const DISTANCE_RATIO_THRESHOLD = 0.45;

export function readActiveTrip() {
  try {
    return JSON.parse(localStorage.getItem(ACTIVE_TRIP_KEY));
  } catch {
    return null;
  }
}

export function writeActiveTrip(trip) {
  try {
    localStorage.setItem(ACTIVE_TRIP_KEY, JSON.stringify(trip));
  } catch {
    // If storage is blocked, the in-memory state still keeps the current drive session usable.
  }
}

export function clearActiveTrip() {
  try {
    localStorage.removeItem(ACTIVE_TRIP_KEY);
  } catch {
    // Nothing to do.
  }
}

export function pointFromPosition(position) {
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy,
    timestamp: new Date(position.timestamp || Date.now()).toISOString(),
  };
}

export function completeLearnedTrip(data, activeTrip) {
  const points = compactPath(activeTrip.points || []);
  const endedAt = nowIso();
  const startedAt = activeTrip.startedAt || endedAt;
  const distance = calculatePathDistance(points);
  const durationSeconds = Math.max(Math.round((new Date(endedAt) - new Date(startedAt)) / 1000), 0);
  const match = findMatchingRoute(data.routes, points, distance);
  const updatedAt = nowIso();
  const route = match
    ? evolveRoute(match, points, distance, updatedAt)
    : createLearnedRoute(data.routes, points, distance, updatedAt);
  const routeId = route.id;
  const learnedTrip = {
    id: makeId('trip'),
    date: dateKey(new Date(startedAt)),
    time: `tracked ${new Date(startedAt).toTimeString().slice(0, 5)}`,
    routeId,
    vehicleId: data.vehicles.find((vehicle) => vehicle.active)?.id || '',
    driver: data.vehicles.find((vehicle) => vehicle.active)?.assignedDriver || '',
    studentsOnboard: data.students.filter((student) => student.routeId === routeId).length,
    distance: Number(distance.toFixed(2)),
    income: 0,
    fuelCost: 0,
    durationSeconds,
    routePath: points,
    autoTracked: true,
    updatedAt,
  };

  return {
    ...data,
    routes: data.routes.some((item) => item.id === route.id)
      ? data.routes.map((item) => (item.id === route.id ? route : item))
      : [...data.routes, route],
    trips: [...data.trips, learnedTrip],
  };
}

export function calculatePathDistance(points) {
  if (!Array.isArray(points) || points.length < 2) return 0;
  return points.slice(1).reduce((total, point, index) => total + haversine(points[index], point), 0);
}

function createLearnedRoute(routes, points, distance, updatedAt) {
  const nextNumber = routes.filter((route) => route.learnedRoute).length + 1;
  return {
    id: makeId('route'),
    name: `Auto Route ${nextNumber}`,
    stops: points.map((point) => `${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`).join('\n'),
    distance: Number(distance.toFixed(2)),
    fare: 0,
    vehicleId: '',
    learnedRoute: true,
    pathCoordinates: points,
    averageDistance: Number(distance.toFixed(2)),
    frequency: 1,
    lastUsedAt: updatedAt,
    updatedAt,
  };
}

function evolveRoute(route, points, distance, updatedAt) {
  const frequency = safeNumber(route.frequency, 1) + 1;
  const averageDistance = ((safeNumber(route.averageDistance, route.distance) * (frequency - 1)) + distance) / frequency;
  return {
    ...route,
    stops: points.map((point) => `${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`).join('\n'),
    distance: Number(averageDistance.toFixed(2)),
    learnedRoute: route.learnedRoute ?? true,
    pathCoordinates: blendPaths(route.pathCoordinates || [], points),
    averageDistance: Number(averageDistance.toFixed(2)),
    frequency,
    lastUsedAt: updatedAt,
    updatedAt,
  };
}

function findMatchingRoute(routes, points, distance) {
  const candidates = routes
    .map((route) => ({ route, score: routeSimilarity(route, points, distance) }))
    .filter((candidate) => candidate.score !== null)
    .sort((a, b) => a.score - b.score);
  return candidates[0]?.route || null;
}

function routeSimilarity(route, points, distance) {
  const routePoints = normalizePath(route.pathCoordinates || parseStops(route.stops));
  if (routePoints.length < 2 || points.length < 2) return null;
  const sampled = samplePath(points, 12);
  const routeSample = samplePath(routePoints, 12);
  const averageNearest = sampled.reduce((total, point) => total + nearestDistance(point, routeSample), 0) / sampled.length;
  const routeDistance = safeNumber(route.averageDistance, safeNumber(route.distance, calculatePathDistance(routePoints)));
  const distanceRatio = routeDistance > 0 ? Math.abs(routeDistance - distance) / routeDistance : 0;
  if (averageNearest <= MATCH_THRESHOLD_METERS && distanceRatio <= DISTANCE_RATIO_THRESHOLD) {
    return averageNearest + distanceRatio * 1000;
  }
  return null;
}

function blendPaths(previous, current) {
  if (!previous?.length) return current;
  const prev = samplePath(normalizePath(previous), 20);
  const next = samplePath(current, 20);
  return next.map((point, index) => {
    const old = prev[index] || point;
    return {
      lat: Number(((old.lat + point.lat) / 2).toFixed(6)),
      lng: Number(((old.lng + point.lng) / 2).toFixed(6)),
      timestamp: point.timestamp,
    };
  });
}

function compactPath(points) {
  const normalized = normalizePath(points);
  if (normalized.length <= 80) return normalized;
  return samplePath(normalized, 80);
}

export function normalizePath(points) {
  return (Array.isArray(points) ? points : [])
    .map((point) => ({
      lat: safeNumber(point.lat),
      lng: safeNumber(point.lng),
      timestamp: point.timestamp || nowIso(),
    }))
    .filter((point) => point.lat && point.lng);
}

function samplePath(points, count) {
  if (points.length <= count) return points;
  return [...Array(count)].map((_, index) => points[Math.round((index / (count - 1)) * (points.length - 1))]);
}

function nearestDistance(point, routePoints) {
  return Math.min(...routePoints.map((routePoint) => haversine(point, routePoint) * 1000));
}

function haversine(a, b) {
  const radiusKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const value = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * radiusKm * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function toRad(value) {
  return value * Math.PI / 180;
}

function parseStops(stops = '') {
  return String(stops)
    .split(/\n|;/)
    .map((stop) => {
      const match = stop.match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
      return match ? { lat: Number(match[1]), lng: Number(match[2]), timestamp: nowIso() } : null;
    })
    .filter(Boolean);
}
