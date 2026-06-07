import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";

function SignUp() {
  const navigate = useNavigate();
  const signUp = useAuthStore((state) => state.signUp);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/workspace", { replace: true });
    }
  }, [isAuthenticated, navigate]);


  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

const success = await signUp({
  name: name.trim(),
  email: email.trim(),
  password,
});    

    if (success) {
      navigate("/workspace", { replace: true });
    }
  };

  useEffect(() => {
    clearError();
  }, [clearError]);

  return (
    <main className="min-h-screen bg-(--cl-color-bg) px-6 py-8">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="mx-auto w-full max-w-md rounded-(--cl-radius-lg) border border-(--cl-color-border) bg-(--cl-color-surface) p-8 shadow-(--cl-shadow-md)">
          <div className="mb-8">
            <div className="mb-5 inline-flex rounded-full bg-(--cl-color-primary-soft) p-3 text-(--cl-color-primary)">
              <Building2 size={24} />
            </div>

            <h1 className="text-3xl font-bold text-(--cl-color-text)">
              Create your account
            </h1>

            <p className="mt-2 text-sm leading-6 text-(--cl-color-text-muted)">
              Start your company research workspace with CompassLabs.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-(--cl-color-text)">
                Name
              </span>

              <div className="mt-2 flex items-center gap-3 rounded-(--cl-radius-md) border border-(--cl-color-border) bg-(--cl-color-surface) px-4 py-3 focus-within:border-(--cl-color-primary)">
                <User size={18} className="text-(--cl-color-text-soft)" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    clearError();
                  }}
                  placeholder="Your name"
                  className="w-full bg-transparent text-sm text-(--cl-color-text) outline-none placeholder:text-(--cl-color-text-soft)"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-(--cl-color-text)">
                Email
              </span>

              <div className="mt-2 flex items-center gap-3 rounded-(--cl-radius-md) border border-(--cl-color-border) bg-(--cl-color-surface) px-4 py-3 focus-within:border-(--cl-color-primary)">
                <Mail size={18} className="text-(--cl-color-text-soft)" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    clearError();
                  }}
                  placeholder="you@example.com"
                  className="w-full bg-transparent text-sm text-(--cl-color-text) outline-none placeholder:text-(--cl-color-text-soft)"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-(--cl-color-text)">
                Password
              </span>

              <div className="mt-2 flex items-center gap-3 rounded-(--cl-radius-md) border border-(--cl-color-border) bg-(--cl-color-surface) px-4 py-3 focus-within:border-(--cl-color-primary)">
                <Lock size={18} className="text-(--cl-color-text-soft)" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  required
                  minLength={8}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    clearError();
                  }}
                  placeholder="Create a secure password"
                  className="w-full bg-transparent text-sm text-(--cl-color-text) outline-none placeholder:text-(--cl-color-text-soft)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="text-(--cl-color-text-soft) transition hover:text-(--cl-color-text)"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {error ? (
              <p className="rounded-(--cl-radius-md) bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-(--cl-radius-md) bg-(--cl-color-primary) px-5 py-3 text-sm font-semibold text-white shadow-(--cl-shadow-sm) transition hover:bg-(--cl-color-primary-hover) disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Creating account..." : "Create account"}
              <ArrowRight size={18} />
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-(--cl-color-text-muted)">
            Already have an account?{" "}
            <Link
              onClick={clearError}
              to="/sign-in"
              className="font-semibold text-(--cl-color-primary) transition hover:text-(--cl-color-primary-hover)"
            >
              Sign in
            </Link>
          </p>
        </div>

        <div className="hidden lg:block">
          <p className="text-sm font-semibold uppercase tracking-wide text-(--cl-color-primary)">
            Start with clarity
          </p>

          <h2 className="mt-4 max-w-xl text-5xl font-bold leading-tight text-(--cl-color-text)">
            Build a smarter way to research every company.
          </h2>

          <p className="mt-5 max-w-lg text-lg leading-8 text-(--cl-color-text-muted)">
            CompassLabs helps job seekers collect signals from company data,
            news, culture, and AI analysis before making career decisions.
          </p>

          <div className="mt-10 grid max-w-xl gap-4">
            <div className="flex gap-4 rounded-(--cl-radius-lg) border border-(--cl-color-border) bg-(--cl-color-surface) p-5 shadow-(--cl-shadow-sm)">
              <CheckCircle2
                size={22}
                className="mt-0.5 text-(--cl-color-accent)"
              />
              <div>
                <p className="text-sm font-semibold text-(--cl-color-text)">
                  Save your research
                </p>
                <p className="mt-1 text-sm leading-6 text-(--cl-color-text-muted)">
                  Keep companies, comparisons, and insights attached to your
                  account.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-(--cl-radius-lg) border border-(--cl-color-border) bg-(--cl-color-surface) p-5 shadow-(--cl-shadow-sm)">
              <CheckCircle2
                size={22}
                className="mt-0.5 text-(--cl-color-accent)"
              />
              <div>
                <p className="text-sm font-semibold text-(--cl-color-text)">
                  Compare opportunities
                </p>
                <p className="mt-1 text-sm leading-6 text-(--cl-color-text-muted)">
                  Understand tradeoffs between companies before you apply or
                  interview.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-(--cl-radius-lg) border border-(--cl-color-border) bg-(--cl-color-surface) p-5 shadow-(--cl-shadow-sm)">
              <CheckCircle2
                size={22}
                className="mt-0.5 text-(--cl-color-accent)"
              />
              <div>
                <p className="text-sm font-semibold text-(--cl-color-text)">
                  Return anytime
                </p>
                <p className="mt-1 text-sm leading-6 text-(--cl-color-text-muted)">
                  Your workspace stays ready as your job search evolves.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default SignUp;
