import { createId, getDrivers, subscribe, updateDrivers } from './localDb';

function sortByUpdated(items) {
  return [...items].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
}

function normalizeDriver(driverId, payload, existing = null) {
  const now = new Date().toISOString();

  return {
    id: existing?.id || driverId || createId('driver'),
    email: payload.email ?? existing?.email ?? '',
    password: existing?.password ?? '',
    name: payload.name ?? existing?.name ?? '',
    phone: payload.phone ?? existing?.phone ?? '',
    verified: existing?.verified ?? false,
    subscriptionActive: existing?.subscriptionActive ?? false,
    subscriptionExpiresAt: existing?.subscriptionExpiresAt ?? null,
    rating: existing?.rating ?? 0,
    ratingCount: existing?.ratingCount ?? 0,
    isOnline: existing?.isOnline ?? false,
    currentRideId: existing?.currentRideId ?? null,
    documents: {
      idImageURL: payload.documents?.idImageURL ?? existing?.documents?.idImageURL ?? '',
      profileImageURL: payload.documents?.profileImageURL ?? existing?.documents?.profileImageURL ?? '',
    },
    vehicle: {
      model: payload.vehicle?.model ?? existing?.vehicle?.model ?? '',
      plate: payload.vehicle?.plate ?? existing?.vehicle?.plate ?? '',
      color: payload.vehicle?.color ?? existing?.vehicle?.color ?? '',
    },
    location: payload.location ?? existing?.location ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export async function saveDriverProfile(driverId, payload) {
  updateDrivers((drivers) => {
    const existing = drivers.find((driver) => driver.id === driverId);
    const nextDriver = normalizeDriver(driverId, payload, existing);

    if (!existing) {
      return sortByUpdated([...drivers, nextDriver]);
    }

    return sortByUpdated(drivers.map((driver) => (driver.id === driverId ? nextDriver : driver)));
  });
}

export async function getDriverProfile(driverId) {
  return getDrivers().find((driver) => driver.id === driverId) || null;
}

export function subscribeToDriverProfile(driverId, callback) {
  const run = () => callback(getDrivers().find((driver) => driver.id === driverId) || null);
  run();
  return subscribe(run);
}

export async function updateDriverStatus(driverId, payload) {
  updateDrivers((drivers) =>
    sortByUpdated(
      drivers.map((driver) =>
        driver.id === driverId
          ? { ...driver, ...payload, updatedAt: new Date().toISOString() }
          : driver,
      ),
    ),
  );
}

export async function activateSubscription(driverId) {
  updateDrivers((drivers) =>
    sortByUpdated(
      drivers.map((driver) =>
        driver.id === driverId
          ? {
              ...driver,
              subscriptionActive: true,
              subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : driver,
      ),
    ),
  );
}

export async function updateDriverLocation(driverId, location) {
  updateDrivers((drivers) =>
    sortByUpdated(
      drivers.map((driver) =>
        driver.id === driverId
          ? {
              ...driver,
              location: {
                ...location,
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            }
          : driver,
      ),
    ),
  );
}

export function subscribeToAllDrivers(callback) {
  const run = () => callback(sortByUpdated(getDrivers()));
  run();
  return subscribe(run);
}

export async function setDriverVerification(driverId, verified) {
  updateDrivers((drivers) =>
    sortByUpdated(
      drivers.map((driver) =>
        driver.id === driverId ? { ...driver, verified, updatedAt: new Date().toISOString() } : driver,
      ),
    ),
  );
}
