import { makeId, nowIso, safeNumber } from './data';
import { dateKey } from './utils';

export const ACTIVE_TRIP_KEY = 'insight-rides-active-gps-trip-v1';

const START_END_THRESHOLD_METERS = 750;
const DISTANCE_RATIO_THRESHOLD = 0.15;
const MIN_TRIP_DISTANCE_KM = 0.2;
const MIN_CAPTURE_POINTS = 2;
const AUTO_ASSIGN_CONFIRMATIONS = 2;

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

export function prepareTripReview(data, activeTrip) {
  const points = compactPath(activeTrip.points || []);
  const endedAt = nowIso();
  const startedAt = activeTrip.startedAt || endedAt;
  const distance = calculatePathDistance(points);
  const durationSeconds = Math.max(Math.round((new Date(endedAt) - new Date(startedAt)) / 1000), 0);
  if (points.length < MIN_CAPTURE_POINTS) throw new Error('This trip needs at least two reliable GPS points before it can be saved.');
  if (distance < MIN_TRIP_DISTANCE_KM) throw new Error('This trip is too short to learn safely. Please use manual trip entry for very short trips.');
  return {
    id: makeId('review'),
    startedAt,
    endedAt,
    points,
    distance,
    durationSeconds,
    startPoint: points[0],
    endPoint: points.at(-1),
    estimatedStops: estimateStops(points),
    suggestion: suggestRoute(data.routes, points, distance),
  };
}

export function confirmLearnedTrip(data, review, options = {}) {
  const points = compactPath(review.points || []);
  const distance = calculatePathDistance(points);
  if (points.length < MIN_CAPTURE_POINTS || distance < MIN_TRIP_DISTANCE_KM) return data;
  const updatedAt = nowIso();
  const selectedRoute = options.routeId ? data.routes.find((route) => route.id === options.routeId) : null;
  const route = selectedRoute
    ? evolveRoute(selectedRoute, points, distance, updatedAt)
    : createLearnedRoute(data.routes, points, distance, updatedAt);
  const routeId = route.id;
  const learnedTrip = {
    id: makeId('trip'),
    date: dateKey(new Date(review.startedAt)),
    time: `tracked ${new Date(review.startedAt).toTimeString().slice(0, 5)}`,
    routeId,
    vehicleId: data.vehicles.find((vehicle) => vehicle.active)?.id || '',
    driver: data.vehicles.find((vehicle) => vehicle.active)?.assignedDriver || '',
    studentsOnboard: options.studentIds?.length || data.students.filter((student) => student.routeId === routeId).length,
    distance: Number(distance.toFixed(2)),
    income: 0,
    fuelCost: 0,
    durationSeconds: review.durationSeconds,
    routePath: points,
    studentIds: options.studentIds || [],
    autoTracked: true,
    confirmedAt: updatedAt,
    updatedAt,
  };
  const trips = [...data.trips, learnedTrip];

  return {
    ...data,
    routes: data.routes.some((item) => item.id === route.id)
      ? data.routes.map((item) => (item.id === route.id ? route : item))
      : [...data.routes, route],
    students: applyStudentRouteLearning(data.students, trips, options.studentIds || [], routeId, updatedAt),
    trips,
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

export function suggestRoute(routes, points, distance) {
  const candidates = routes
    .map((route) => ({ route, score: routeSimilarity(route, points, distance) }))
    .filter((candidate) => candidate.score !== null)
    .sort((a, b) => a.score - b.score);
  const best = candidates[0];
  if (!best) return null;
  const confidence = best.score <= 500 ? 'high' : best.score <= 900 ? 'medium' : 'low';
  return { route: best.route, confidence, score: best.score };
}

function routeSimilarity(route, points, distance) {
  const routePoints = normalizePath(route.pathCoordinates || parseStops(route.stops));
  if (routePoints.length < 2 || points.length < 2) return null;
  const startDistance = haversine(points[0], routePoints[0]) * 1000;
  const endDistance = haversine(points.at(-1), routePoints.at(-1)) * 1000;
  const routeDistance = safeNumber(route.averageDistance, safeNumber(route.distance, calculatePathDistance(routePoints)));
  const distanceRatio = routeDistance > 0 ? Math.abs(routeDistance - distance) / routeDistance : 0;
  if (startDistance <= START_END_THRESHOLD_METERS && endDistance <= START_END_THRESHOLD_METERS && distanceRatio <= DISTANCE_RATIO_THRESHOLD) {
    const frequencyBonus = Math.min(safeNumber(route.frequency) * 12, 120);
    return startDistance * 0.35 + endDistance * 0.35 + distanceRatio * 900 - frequencyBonus;
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

function applyStudentRouteLearning(students, trips, studentIds, routeId, updatedAt) {
  if (!studentIds.length) return students;
  return students.map((student) => {
    if (!studentIds.includes(student.id) || student.routeId) return student;
    const confirmations = trips.filter((trip) => trip.routeId === routeId && trip.studentIds?.includes(student.id)).length;
    if (confirmations < AUTO_ASSIGN_CONFIRMATIONS) return student;
    return {
      ...student,
      routeId,
      routeAutoAssigned: true,
      routeConfidenceCount: confirmations,
      updatedAt,
    };
  });
}

function estimateStops(points) {
  const stops = [];
  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    const slowBefore = haversine(previous, current) * 1000 < 35;
    const slowAfter = haversine(current, next) * 1000 < 35;
    if (slowBefore && slowAfter) stops.push(current);
    if (stops.length >= 5) break;
  }
  return stops;
}

function samplePath(points, count) {
  if (points.length <= count) return points;
  return [...Array(count)].map((_, index) => points[Math.round((index / (count - 1)) * (points.length - 1))]);
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
