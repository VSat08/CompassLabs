import { apiClient } from "./client";
import type {
  AuthResponse,
  AuthUser,
  SignInPayload,
  SignUpPayload,
} from "../types/auth";

export async function signUp(payload: SignUpPayload): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/signup", payload);
  return response.data;
}

export async function signIn(payload: SignInPayload): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/signin", payload);
  return response.data;
}

export async function signOut(): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>("/auth/signout");
  return response.data;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiClient.get<AuthUser>("/auth/me");
  return response.data;
}

export async function refreshSession(): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/refresh");
  return response.data;
}
