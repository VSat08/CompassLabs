type AppEnvironment = "local" | "staging" | "production";

const validEnvironments: AppEnvironment[] = ["local", "staging", "production"];

const rawAppEnvironment = import.meta.env.VITE_APP_ENV ?? "local";

const appEnvironment: AppEnvironment = validEnvironments.includes(
  rawAppEnvironment as AppEnvironment,
)
  ? (rawAppEnvironment as AppEnvironment)
  : "local";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const environment = {
  appEnvironment,
  apiBaseUrl,

  isLocal: appEnvironment === "local",
  isStaging: appEnvironment === "staging",
  isProduction: appEnvironment === "production",
};
