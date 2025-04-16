import { FirebaseOptions, FirebaseApp, initializeApp, getApp } from 'firebase/app';
// import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const config: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};


let app: FirebaseApp;
const defaultAppName = '[DEFAULT]'; // as per firebase docs.
export const getFirebaseApp = (name?: string, cf: FirebaseOptions = config) => {
  // handle HMR also, so to avoid emulator hang.
  // extending global type.
  // let globalE = global as typeof globalThis & { emulatorStarted?: boolean};
  // if(!isDev) {
  try {
    // Don't use ?? operator, as it will not work with '' string.
    app = getApp(name || defaultAppName);
  } catch {
    app = initializeApp(cf, name || defaultAppName);
    console.log('Firebase initialize app: ', cf);
  }
  // }

  // Multi-tenancy not supported. So, disabling emulator.
  // for dev mode only, start emulator.
  // if(isBrowser && isDev && !globalE.emulatorStarted) {
  //   app = initializeApp(cf);
  //   // initialize auth emulator.
  //   const auth = getAuth();
  //   console.log(
  //     'WARNING: You are using the Auth Emulator, which is intended for local testing only.  Do not use with production credentials.'
  //   );
  //   connectAuthEmulator(auth, 'http://127.0.0.1:9099', {
  //     disableWarnings: true,
  //   });
  //   // initialize firestore (db) emulator
  //   // const db = getFirestore();
  //   // connectFirestoreEmulator(db, 'localhost', 8080);
  //   // handling HMR.
  //   globalE.emulatorStarted = true;
  // }

  return app;
};
