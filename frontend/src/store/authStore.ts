import { create } from "zustand";
import {
  getCurrentUser,
  signIn as signInRequest,
  signOut as signOutRequest,
  signUp as signUpRequest,
} from "../api/auth.api";
import type { AuthUser, SignInPayload, SignUpPayload } from "../types/auth";

type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  signUp: (payload: SignUpPayload) => Promise<void>;
  signIn: (payload: SignInPayload) => Promise<void>;
  signOut: () => Promise<void>;
  loadCurrentUser: () => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  signUp: async (payload) => {
    set({ isLoading: true, error: null });

    try {
      const data = await signUpRequest(payload);

      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: "Unable to create account. Please try again.",
      });
    }
  },

  signIn: async (payload) => {
    set({ isLoading: true, error: null });

    try {
      const data = await signInRequest(payload);

      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: "Invalid email or password.",
      });
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });

    try {
      await signOutRequest();
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  loadCurrentUser: async () => {
    set({ isLoading: true, error: null });

    try {
      const user = await getCurrentUser();

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
