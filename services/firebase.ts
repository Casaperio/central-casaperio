import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import { env } from '../env';

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

// Internal state (private) - nullable for lazy initialization
let _app: firebase.app.App | null = null;
let _db: firebase.firestore.Firestore | null = null;
let _auth: firebase.auth.Auth | null = null;
let _storage: firebase.storage.Storage | null = null;
let _isTestMode = false;

/**
 * Initialize Firebase (called explicitly, not on import)
 * Safe to call multiple times - will only initialize once
 */
export function initializeFirebase(): void {
  if (_isTestMode) return; // Skip in test mode
  if (_app) return; // Already initialized

  try {
    // Check if apps are already initialized (important for hot-reload)
    if (!firebase.apps.length) {
      _app = firebase.initializeApp(firebaseConfig);
    } else {
      _app = firebase.app();
    }
    _db = firebase.firestore();
    _auth = firebase.auth();
    _storage = firebase.storage();
  } catch (error) {
    console.error("Firebase initialization error:", error);
    throw error;
  }
}

/**
 * Get Firestore instance (lazy init on first access)
 */
export function getDb(): firebase.firestore.Firestore | null {
  if (!_db && !_isTestMode) initializeFirebase();
  return _db;
}

/**
 * Get Auth instance (lazy init on first access)
 */
export function getAuthInstance(): firebase.auth.Auth | null {
  if (!_auth && !_isTestMode) initializeFirebase();
  return _auth;
}

/**
 * Get Storage instance (lazy init on first access)
 */
export function getStorageInstance(): firebase.storage.Storage | null {
  if (!_storage && !_isTestMode) initializeFirebase();
  return _storage;
}

/**
 * Backward compatibility exports using Proxy
 * These allow existing code to continue using `import { db, auth, storage }`
 * The Proxy lazily initializes Firebase on first property access
 */
export const db = new Proxy({} as firebase.firestore.Firestore, {
  get(_target, prop) {
    const instance = getDb();
    if (!instance) {
      throw new Error('Firebase Firestore not initialized. Call initializeFirebase() first.');
    }
    return (instance as any)[prop];
  }
});

export const auth = new Proxy({} as firebase.auth.Auth, {
  get(_target, prop) {
    const instance = getAuthInstance();
    if (!instance) {
      throw new Error('Firebase Auth not initialized. Call initializeFirebase() first.');
    }
    return (instance as any)[prop];
  }
});

export const storage = new Proxy({} as firebase.storage.Storage, {
  get(_target, prop) {
    const instance = getStorageInstance();
    if (!instance) {
      throw new Error('Firebase Storage not initialized. Call initializeFirebase() first.');
    }
    return (instance as any)[prop];
  }
});

// ============ TEST HELPERS ============

/**
 * Enable test mode (prevents real Firebase initialization)
 * Call this in test setup to prevent Firebase from initializing
 */
export function enableTestMode(): void {
  _isTestMode = true;
}

/**
 * Inject mock Firebase instances for testing
 * Use this in tests to provide mock implementations
 */
export function __setMockFirebase(mocks: {
  db?: any;
  auth?: any;
  storage?: any;
}): void {
  _isTestMode = true;
  if (mocks.db !== undefined) _db = mocks.db;
  if (mocks.auth !== undefined) _auth = mocks.auth;
  if (mocks.storage !== undefined) _storage = mocks.storage;
}

/**
 * Reset Firebase state (for test isolation between tests)
 * Call this in afterEach to ensure clean state
 */
export function __resetFirebase(): void {
  _app = null;
  _db = null;
  _auth = null;
  _storage = null;
  _isTestMode = false;
}
