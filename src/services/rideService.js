import {
  Timestamp,
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/config';

function subscriptionIsCurrent(driverData) {
  const expiresAt = driverData.subscriptionExpiresAt?.toDate
    ? driverData.subscriptionExpiresAt.toDate()
    : driverData.subscriptionExpiresAt
      ? new Date(driverData.subscriptionExpiresAt)
      : null;

  return Boolean(driverData.subscriptionActive && expiresAt && expiresAt.getTime() > Date.now());
}

export async function createRideRequest(payload) {
  const result = await addDoc(collection(db, 'rides'), {
    ...payload,
    createdAt: serverTimestamp(),
    completedAt: null,
    rating: null,
    status: 'pending',
    driverId: null,
    driverName: null,
    driverPhone: null,
    driverLocation: null,
  });

  return result.id;
}

export function subscribeToRide(rideId, callback) {
  return onSnapshot(doc(db, 'rides', rideId), (snapshot) => {
    callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
  });
}

export function subscribeToPendingRides(callback) {
  const ridesQuery = query(
    collection(db, 'rides'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc'),
  );

  return onSnapshot(ridesQuery, (snapshot) => {
    callback(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() })));
  });
}

export async function acceptRide({ rideId, driver }) {
  const rideRef = doc(db, 'rides', rideId);
  const driverRef = doc(db, 'drivers', driver.id);

  await runTransaction(db, async (transaction) => {
    const rideSnap = await transaction.get(rideRef);
    const driverSnap = await transaction.get(driverRef);

    if (!rideSnap.exists()) {
      throw new Error('Ride not found');
    }

    if (!driverSnap.exists()) {
      throw new Error('Driver not found');
    }

    const rideData = rideSnap.data();
    const driverData = driverSnap.data();

    if (rideData.status !== 'pending') {
      throw new Error('Ride already accepted');
    }

    if (!driverData.verified || !subscriptionIsCurrent(driverData)) {
      throw new Error('Driver is not eligible to accept rides');
    }

    // The transaction makes "first driver wins" deterministic even when several drivers tap at once.
    transaction.update(rideRef, {
      status: 'accepted',
      acceptedAt: Timestamp.now(),
      driverId: driver.id,
      driverName: driver.name,
      driverPhone: driver.phone,
      driverLocation: driver.location ?? null,
    });

    transaction.update(driverRef, {
      currentRideId: rideId,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function updateRideStatus(rideId, payload) {
  await updateDoc(doc(db, 'rides', rideId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function syncRideDriverLocation(rideId, location) {
  await updateDoc(doc(db, 'rides', rideId), {
    driverLocation: {
      ...location,
      updatedAt: new Date().toISOString(),
    },
    updatedAt: serverTimestamp(),
  });
}

export async function completeRide({ rideId, driverId }) {
  await updateDoc(doc(db, 'rides', rideId), {
    status: 'completed',
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(doc(db, 'drivers', driverId), {
    currentRideId: null,
    updatedAt: serverTimestamp(),
  });
}

export async function rateRide({ rideId, driverId, rating }) {
  const rideRef = doc(db, 'rides', rideId);
  const driverRef = doc(db, 'drivers', driverId);

  await runTransaction(db, async (transaction) => {
    const rideSnap = await transaction.get(rideRef);
    const driverSnap = await transaction.get(driverRef);

    if (!rideSnap.exists() || !driverSnap.exists()) {
      throw new Error('Missing ride or driver');
    }

    const driverData = driverSnap.data();
    const nextRatingCount = (driverData.ratingCount || 0) + 1;
    const cumulativeRating = (driverData.rating || 0) * (driverData.ratingCount || 0) + rating;

    // Ratings are stored per ride and also rolled into the driver's average for quick dashboard reads.
    transaction.update(rideRef, {
      rating,
      updatedAt: serverTimestamp(),
    });

    transaction.update(driverRef, {
      rating: Number((cumulativeRating / nextRatingCount).toFixed(2)),
      ratingCount: nextRatingCount,
      updatedAt: serverTimestamp(),
    });
  });
}
