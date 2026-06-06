export type UserPlan = "free" | "pro";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  plan: UserPlan;
  is_verified: boolean;
  created_at: string;
};

export type AuthResponse = {
  user: AuthUser;
  message: string;
};

export type SignUpPayload = {
  name: string;
  email: string;
  password: string;
};

export type SignInPayload = {
  email: string;
  password: string;
};