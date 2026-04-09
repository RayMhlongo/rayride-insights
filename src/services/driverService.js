import {
  Timestamp,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';

export async function saveDriverProfile(driverId, payload) {
  const driverRef = doc(db, 'drivers', driverId);
  const existing = await getDoc(driverRef);
  const basePayload = {
    ...payload,
    updatedAt: serverTimestamp(),
  };

  if (!existing.exists()) {
    await setDoc(driverRef, {
      verified: false,
      subscriptionActive: false,
      subscriptionExpiresAt: null,
      rating: 0,
      ratingCount: 0,
      isOnline: false,
      currentRideId: null,
      createdAt: serverTimestamp(),
      ...basePayload,
    });
    return;
  }

  await updateDoc(driverRef, basePayload);
}

export async function getDriverProfile(driverId) {
  const snapshot = await getDoc(doc(db, 'drivers', driverId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export function subscribeToDriverProfile(driverId, callback) {
  return onSnapshot(doc(db, 'drivers', driverId), (snapshot) => {
    callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
  });
}

export async function updateDriverStatus(driverId, payload) {
  await updateDoc(doc(db, 'drivers', driverId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function activateSubscription(driverId) {
  const expiration = Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  await updateDoc(doc(db, 'drivers', driverId), {
    subscriptionActive: true,
    subscriptionExpiresAt: expiration,
    updatedAt: serverTimestamp(),
  });
}

export async function updateDriverLocation(driverId, location) {
  await updateDoc(doc(db, 'drivers', driverId), {
    location: {
      ...location,
      updatedAt: new Date().toISOString(),
    },
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToAllDrivers(callback) {
  const driversQuery = query(collection(db, 'drivers'), orderBy('updatedAt', 'desc'));
  return onSnapshot(driversQuery, (snapshot) => {
    callback(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() })));
  });
}

export async function setDriverVerification(driverId, verified) {
  await updateDoc(doc(db, 'drivers', driverId), {
    verified,
    updatedAt: serverTimestamp(),
  });
}
