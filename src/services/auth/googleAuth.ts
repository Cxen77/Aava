/**
 * Google Authentication Adapter for Aava / SAATHI
 * Supports both Native Expo (@react-native-google-signin/google-signin)
 * and Web/Browser fallback using Firebase GoogleAuthProvider.
 */
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  type UserCredential,
} from "firebase/auth";
import { auth, GOOGLE_WEB_CLIENT_ID } from "../firebase";

export interface GoogleAuthResult {
  credential: UserCredential;
  idToken: string;
}

const NATIVE_SIGNIN_MODULE = "@react-native-google-signin/google-signin";

async function getNativeGoogleSignin(): Promise<any> {
  if (typeof navigator !== "undefined" && navigator.product === "ReactNative") {
    try {
      return await import(/* @vite-ignore */ NATIVE_SIGNIN_MODULE);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Configure Google Sign-In for native environments
 */
export async function configureNativeGoogleSignIn(): Promise<void> {
  const nativeModule = await getNativeGoogleSignin();
  if (nativeModule && nativeModule.GoogleSignin) {
    nativeModule.GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: false,
      scopes: ["profile", "email"],
    });
  }
}

/**
 * Perform Native or Web Google Sign-In and authenticate with Firebase
 */
export async function performGoogleSignIn(): Promise<GoogleAuthResult> {
  const nativeModule = await getNativeGoogleSignin();

  if (nativeModule && nativeModule.GoogleSignin) {
    try {
      const { GoogleSignin, statusCodes } = nativeModule;
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken || signInResult.idToken;

      if (!idToken) {
        throw new Error("No ID token returned from Google Sign-In.");
      }

      // Create Firebase credential using native Google ID token
      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, googleCredential);
      const firebaseIdToken = await userCredential.user.getIdToken();

      return {
        credential: userCredential,
        idToken: firebaseIdToken,
      };
    } catch (nativeError: any) {
      const { statusCodes } = nativeModule;
      if (statusCodes && nativeError.code === statusCodes.SIGN_IN_CANCELLED) {
        const err = new Error("Google Sign-In was cancelled.");
        err.name = "SignInCancelledError";
        throw err;
      }
      if (statusCodes && nativeError.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error("Google Play Services is not available or outdated on this device.");
      }
      throw nativeError;
    }
  }

  // Web / Browser environment: Use Firebase Popup
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope("profile");
    provider.addScope("email");
    provider.setCustomParameters({ prompt: "select_account" });

    const userCredential = await signInWithPopup(auth, provider);
    const idToken = await userCredential.user.getIdToken();

    return {
      credential: userCredential,
      idToken,
    };
  } catch (error: any) {
    if (error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request") {
      const err = new Error("Google Sign-In was cancelled.");
      err.name = "SignInCancelledError";
      throw err;
    }
    if (error.code === "auth/network-request-failed") {
      throw new Error("Unable to connect to Google. Please check your internet connection.");
    }
    throw error;
  }
}

/**
 * Sign out from Google Native provider if applicable
 */
export async function performGoogleSignOut(): Promise<void> {
  const nativeModule = await getNativeGoogleSignin();
  if (nativeModule && nativeModule.GoogleSignin) {
    try {
      await nativeModule.GoogleSignin.signOut();
    } catch {}
  }
}
