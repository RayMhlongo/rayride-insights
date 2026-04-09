import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from './config';

export function registerDriver(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function loginDriver(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logoutDriver() {
  return signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
