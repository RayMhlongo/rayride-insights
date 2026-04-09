const STORAGE_KEYS = {
  drivers: 'rayride-drivers',
  rides: 'rayride-rides',
  session: 'rayride-session',
};

const listeners = new Set();

function read(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
  emit();
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getDrivers() {
  return read(STORAGE_KEYS.drivers, []);
}

export function setDrivers(drivers) {
  write(STORAGE_KEYS.drivers, drivers);
}

export function updateDrivers(updater) {
  const nextDrivers = updater(getDrivers());
  setDrivers(nextDrivers);
  return nextDrivers;
}

export function getRides() {
  return read(STORAGE_KEYS.rides, []);
}

export function setRides(rides) {
  write(STORAGE_KEYS.rides, rides);
}

export function updateRides(updater) {
  const nextRides = updater(getRides());
  setRides(nextRides);
  return nextRides;
}

export function getSession() {
  return read(STORAGE_KEYS.session, null);
}

export function setSession(session) {
  write(STORAGE_KEYS.session, session);
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEYS.session);
  emit();
}

export function subscribe(listener) {
  listeners.add(listener);

  const handleStorage = (event) => {
    if (Object.values(STORAGE_KEYS).includes(event.key)) {
      listener();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
  };
}
