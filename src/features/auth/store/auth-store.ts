// Auth Zustand Store
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/auth";
import { authService } from "../services/auth-service";
import { User, AuthState, SignInCredentials, mapFirebaseUser } from "../types";

interface AuthStore extends AuthState {
  // Actions
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  initializeAuthListener: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      isLoading: true,
      isAuthenticated: false,
      error: null,

      // Actions
      signIn: async (credentials: SignInCredentials) => {
        try {
          set({ isLoading: true, error: null });
          const userCredential = await authService.signIn(credentials);
          const user = mapFirebaseUser(userCredential.user);
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            error: error.message,
            isLoading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      signOut: async () => {
        try {
          set({ isLoading: true, error: null });
          await authService.signOut();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      initializeAuthListener: () => {
        onAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser) {
            const user = mapFirebaseUser(firebaseUser);
            get().setUser(user);
          } else {
            get().setUser(null);
          }
        });
      },
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
