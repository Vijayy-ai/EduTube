// Re-export Firebase authentication functions from utils/firebase.js
import {
  loginWithEmailAndPassword,
  registerWithEmailAndPassword,
  loginWithGoogle,
  resetPassword,
  logoutUser,
  getCurrentUser,
  listenToAuthChanges,
  auth,
  db,
  storage
} from '../utils/firebase';

export {
  loginWithEmailAndPassword,
  registerWithEmailAndPassword,
  loginWithGoogle,
  resetPassword,
  logoutUser,
  getCurrentUser,
  listenToAuthChanges,
  auth,
  db,
  storage
}; 