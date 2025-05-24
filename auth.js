// auth.js
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';

import { auth, db } from './firebase-config.js';

export {
  auth,
  db,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
