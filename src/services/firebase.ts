/**
 * Firebase Client SDK Initialization for Aava / SAATHI
 * Configured from official google-services.json
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyAEJInSCtNPcDONj2JggfIk9gg03TFfbXw",
  authDomain: "aava-93398.firebaseapp.com",
  projectId: "aava-93398",
  storageBucket: "aava-93398.firebasestorage.app",
  messagingSenderId: "74698770332",
  appId: "1:74698770332:android:364b1a488a627e6b8b2a59",
};

export const GOOGLE_WEB_CLIENT_ID = "74698770332-70a7d4a31mibv4ftksaoheek22im2s0v.apps.googleusercontent.com";

// Initialize Firebase only once
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
