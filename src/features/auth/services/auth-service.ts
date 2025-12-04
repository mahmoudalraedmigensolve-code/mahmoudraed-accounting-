// Auth Service Layer
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  UserCredential,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase/auth";
import { SignInCredentials, SignUpCredentials } from "../types";

export const authService = {
  /**
   * Sign in with email and password
   */
  async signIn(credentials: SignInCredentials): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );
      return userCredential;
    } catch (error: any) {
      throw new Error(error.message || "Failed to sign in");
    }
  },

  /**
   * Sign up with email and password
   */
  async signUp(credentials: SignUpCredentials): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      // Update profile with display name if provided
      if (credentials.displayName && userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: credentials.displayName,
        });
      }

      return userCredential;
    } catch (error: any) {
      throw new Error(error.message || "Failed to sign up");
    }
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      throw new Error(error.message || "Failed to sign out");
    }
  },

  /**
   * Get current user
   */
  getCurrentUser() {
    return auth.currentUser;
  },
};
