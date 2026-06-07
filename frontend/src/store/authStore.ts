import { create } from "zustand";
import {
  getCurrentUser,
  signIn as signInRequest,
  signOut as signOutRequest,
  signUp as signUpRequest,
} from "../api/auth.api";
import type { AuthUser, SignInPayload, SignUpPayload } from "../types/auth";
import axios from "axios";

type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hasCheckedSession: boolean;

  signUp: (payload: SignUpPayload) => Promise<boolean>;
  signIn: (payload: SignInPayload) => Promise<boolean>;
  signOut: () => Promise<void>;
  loadCurrentUser: () => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  hasCheckedSession: false,

  signUp: async (payload) => {
    set({ isLoading: true, error: null });

    try {
      const data = await signUpRequest(payload);

      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        hasCheckedSession: true,
      });

      return true;
    } catch (error) {
      const message =
        axios.isAxiosError(error) && error.response?.status === 409
          ? "An account with this email already exists. Please sign in instead."
          : "Unable to create account. Please try again.";

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: message,
        hasCheckedSession: true,
      });

      return false;
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
        hasCheckedSession: true,
      });

      return true;
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        hasCheckedSession: true,
        error: "Invalid email or password.",
      });

      return false;
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
        hasCheckedSession: true,
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
        hasCheckedSession: true,
      });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        hasCheckedSession: true,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
