// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuración REAL de Firebase (la que te aparece en la consola)
const firebaseConfig = {
  apiKey: "AIzaSyBCNC9W7Jds6hoFKnrSQFFVKKvoAfL4sCg",
  authDomain: "utppedidos-2d630.firebaseapp.com",
  projectId: "utppedidos-2d630",
  storageBucket: "utppedidos-2d630.firebasestorage.app",
  messagingSenderId: "885914953869",
  appId: "1:885914953869:web:46d6feb6aed1dc5b755ac4",
  measurementId: "G-L9ENZKBTRM"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;