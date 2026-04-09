import { getDrivers, subscribe, updateDrivers, updateRides, getRides, createId } from './localDb';

function sortByCreated(items) {
  return [...items].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function subscriptionIsCurrent(driverData) {
  const expiresAt = driverData.subscriptionExpiresAt ? new Date(driverData.subscriptionExpiresAt) : null;
  return Boolean(driverData.subscriptionActive && expiresAt && expiresAt.getTime() > Date.now());
}

export async function createRideRequest(payload) {
  const rideId = createId('ride');
  const ride = {
    id: rideId,
    ...payload,
    createdAt: new Date().toISOString(),
    completedAt: null,
    rating: null,
    status: 'pending',
    driverId: null,
    driverName: null,
    driverPhone: null,
    driverLocation: null,
  };

  updateRides((rides) => sortByCreated([...rides, ride]));
  return rideId;
}

export function subscribeToRide(rideId, callback) {
  const run = () => callback(getRides().find((ride) => ride.id === rideId) || null);
  run();
  return subscribe(run);
}

export function subscribeToPendingRides(callback) {
  const run = () => callback(sortByCreated(getRides().filter((ride) => ride.status === 'pending')));
  run();
  return subscribe(run);
}

export async function acceptRide({ rideId, driver }) {
  const ride = getRides().find((entry) => entry.id === rideId);
  const driverProfile = getDrivers().find((entry) => entry.id === driver.id);

  if (!ride) {
    throw new Error('Ride not found');
  }

  if (!driverProfile) {
    throw new Error('Driver not found');
  }

  if (ride.status !== 'pending') {
    throw new Error('Ride already accepted');
  }

  if (!driverProfile.verified || !subscriptionIsCurrent(driverProfile)) {
    throw new Error('Driver is not eligible to accept rides');
  }

  updateRides((rides) =>
    sortByCreated(
      rides.map((entry) =>
        entry.id === rideId
          ? {
              ...entry,
              status: 'accepted',
              acceptedAt: new Date().toISOString(),
              driverId: driver.id,
              driverName: driver.name,
              driverPhone: driver.phone,
              driverLocation: driver.location ?? null,
              updatedAt: new Date().toISOString(),
            }
          : entry,
      ),
    ),
  );

  updateDrivers((drivers) =>
    drivers.map((entry) =>
      entry.id === driver.id ? { ...entry, currentRideId: rideId, updatedAt: new Date().toISOString() } : entry,
    ),
  );
}

export async function updateRideStatus(rideId, payload) {
  updateRides((rides) =>
    sortByCreated(
      rides.map((ride) =>
        ride.id === rideId ? { ...ride, ...payload, updatedAt: new Date().toISOString() } : ride,
      ),
    ),
  );
}

export async function syncRideDriverLocation(rideId, location) {
  updateRides((rides) =>
    sortByCreated(
      rides.map((ride) =>
        ride.id === rideId
          ? {
              ...ride,
              driverLocation: {
                ...location,
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            }
          : ride,
      ),
    ),
  );
}

export async function completeRide({ rideId, driverId }) {
  updateRides((rides) =>
    sortByCreated(
      rides.map((ride) =>
        ride.id === rideId
          ? {
              ...ride,
              status: 'completed',
              completedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : ride,
      ),
    ),
  );

  updateDrivers((drivers) =>
    drivers.map((driver) =>
      driver.id === driverId ? { ...driver, currentRideId: null, updatedAt: new Date().toISOString() } : driver,
    ),
  );
}

export async function rateRide({ rideId, driverId, rating }) {
  const driver = getDrivers().find((entry) => entry.id === driverId);
  if (!driver) {
    throw new Error('Missing ride or driver');
  }

  const nextRatingCount = (driver.ratingCount || 0) + 1;
  const cumulativeRating = (driver.rating || 0) * (driver.ratingCount || 0) + rating;

  updateRides((rides) =>
    sortByCreated(
      rides.map((ride) =>
        ride.id === rideId ? { ...ride, rating, updatedAt: new Date().toISOString() } : ride,
      ),
    ),
  );

  updateDrivers((drivers) =>
    drivers.map((entry) =>
      entry.id === driverId
        ? {
            ...entry,
            rating: Number((cumulativeRating / nextRatingCount).toFixed(2)),
            ratingCount: nextRatingCount,
            updatedAt: new Date().toISOString(),
          }
        : entry,
    ),
  );
}
