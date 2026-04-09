import { clearSession, createId, getDrivers, getSession, setDrivers, setSession, subscribe } from './localDb';

function sanitizeUser(driver) {
  return driver ? { uid: driver.id, email: driver.email } : null;
}

export async function registerDriver(email, password) {
  const drivers = getDrivers();
  const existing = drivers.find((driver) => driver.email?.toLowerCase() === email.toLowerCase());

  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const driver = {
    id: createId('driver'),
    email,
    password,
    name: '',
    phone: '',
    verified: false,
    subscriptionActive: false,
    subscriptionExpiresAt: null,
    rating: 0,
    ratingCount: 0,
    isOnline: false,
    currentRideId: null,
    documents: {
      idImageURL: '',
      profileImageURL: '',
    },
    vehicle: {
      model: '',
      plate: '',
      color: '',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  setDrivers([...drivers, driver]);
  setSession(sanitizeUser(driver));
  return { user: sanitizeUser(driver) };
}

export async function loginDriver(email, password) {
  const driver = getDrivers().find(
    (entry) => entry.email?.toLowerCase() === email.toLowerCase() && entry.password === password,
  );

  if (!driver) {
    throw new Error('Invalid email or password.');
  }

  setSession(sanitizeUser(driver));
  return { user: sanitizeUser(driver) };
}

export async function logoutDriver() {
  clearSession();
}

export function onAuthChange(callback) {
  const run = () => callback(getSession());
  run();
  return subscribe(run);
}
