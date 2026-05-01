import { emptyData, QUEUE_KEY, STORAGE_KEY } from './constants';

const arrayKeys = ['students', 'trips', 'expenses', 'incomes', 'routes', 'vehicles', 'payments'];
const numericFields = new Set(['monthlyFee', 'distance', 'fare', 'studentsOnboard', 'income', 'fuelCost', 'amount', 'averageFuelConsumption']);

export const nowIso = () => new Date().toISOString();

export function makeId(prefix = 'id') {
  if (globalThis.crypto?.randomUUID) return `${prefix}_${globalThis.crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function normalizeRecord(record = {}) {
  const next = { ...record };
  for (const field of numericFields) {
    if (field in next) next[field] = safeNumber(next[field]);
  }
  next.updatedAt = next.updatedAt || nowIso();
  return next;
}

export function normalizeData(data) {
  const source = { ...emptyData, ...(data || {}) };
  const next = { ...emptyData, meta: { ...emptyData.meta, ...(source.meta || {}) } };
  for (const key of arrayKeys) {
    next[key] = Array.isArray(source[key]) ? source[key].filter(Boolean).map(normalizeRecord) : [];
  }
  return next;
}

function newer(a, b) {
  return new Date(a?.updatedAt || 0).getTime() >= new Date(b?.updatedAt || 0).getTime() ? a : b;
}

function mergeById(localRows = [], remoteRows = []) {
  const byId = new Map();
  for (const row of [...remoteRows, ...localRows]) {
    if (!row?.id) continue;
    byId.set(row.id, byId.has(row.id) ? newer(row, byId.get(row.id)) : row);
  }
  return [...byId.values()];
}

function tripKey(trip) {
  return trip?.routeId && trip?.date && trip?.time ? `${trip.date}|${trip.time}|${trip.routeId}` : null;
}

function dedupeTrips(rows) {
  const byKey = new Map();
  const loose = [];
  for (const trip of rows) {
    const key = tripKey(trip);
    if (!key) {
      loose.push(trip);
      continue;
    }
    byKey.set(key, byKey.has(key) ? newer(trip, byKey.get(key)) : trip);
  }
  return [...byKey.values(), ...loose];
}

export function mergeData(localData, remoteData) {
  const local = normalizeData(localData);
  const remote = normalizeData(remoteData);
  const merged = { ...emptyData, meta: { ...remote.meta, ...local.meta, lastSync: nowIso() } };
  for (const key of arrayKeys) {
    merged[key] = key === 'trips' ? dedupeTrips(mergeById(local[key], remote[key])) : mergeById(local[key], remote[key]);
  }
  return merged;
}

export function visibleData(data) {
  const next = normalizeData(data);
  for (const key of arrayKeys) {
    next[key] = next[key].filter((row) => !row.deletedAt);
  }
  return next;
}

export function readLocal() {
  try {
    return normalizeData(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return normalizeData(emptyData);
  }
}

export function writeLocal(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeData({ ...data, meta: { ...(data?.meta || {}), lastLocalSave: nowIso() } })));
}

export function queueOfflineData(data) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify({ updatedAt: nowIso(), data: normalizeData(data) }));
}

export function readOfflineQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY));
  } catch {
    return null;
  }
}

export function clearOfflineQueue() {
  localStorage.removeItem(QUEUE_KEY);
}
