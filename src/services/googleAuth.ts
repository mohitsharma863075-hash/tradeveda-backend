
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import firebaseConfig from '../../firebase-applet-config.json';
import { isNativeApp } from './environment';

const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export async function signInWithGooglePopup(): Promise<{
  email: string;
  name: string;
  avatar?: string;
  idToken?: string;
}> {
  try {
    if (isNativeApp()) {
      // Native Android Google Sign-In using Firebase Authentication.
      const result = await FirebaseAuthentication.signInWithGoogle();
      const user = result.user;

      if (!user?.email) {
        throw new Error(
          'Google account email nahi mila. Dobara sign in karo.'
        );
      }

      const tokenResult = await FirebaseAuthentication.getIdToken();

      if (!tokenResult.token) {
        throw new Error(
          'Firebase ID token nahi mila. Dobara sign in karo.'
        );
      }

      return {
        email: user.email,
        name: user.displayName || user.email.split('@')[0],
        avatar: user.photoUrl || undefined,
        idToken: tokenResult.token,
      };
    }

    // Web browser login.
    const result = await signInWithPopup(auth, googleProvider);
    const user: FirebaseUser = result.user;

    if (!user.email) {
      throw new Error('Google account does not have a verified email.');
    }

    const idToken = await user.getIdToken();

    return {
      email: user.email,
      name: user.displayName || user.email.split('@')[0],
      avatar: user.photoURL || undefined,
      idToken,
    };
  } catch (error: any) {
    console.error('Google Sign-In error:', error);

    if (
      error.code === 'auth/popup-closed-by-user' ||
      error.code === 'auth/cancelled-popup-request'
    ) {
      throw new Error('Google sign-in cancel ho gaya. Dobara try karo.');
    }

    throw error;
  }
}

export async function signOutGoogle(): Promise<void> {
  try {
    if (isNativeApp()) {
      await FirebaseAuthentication.signOut();
    }

    await signOut(auth);
  } catch (error) {
    console.warn('Google sign-out error:', error);
  }
}
