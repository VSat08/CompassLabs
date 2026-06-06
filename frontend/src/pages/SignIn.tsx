import {
  ArrowRight,
  BarChart3,
  Lock,
  Mail,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

import { Link } from "react-router-dom";

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <main className="min-h-screen bg-(--cl-color-bg) px-6 py-8">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden lg:block">
          <p className="text-sm font-semibold uppercase tracking-wide text-(--cl-color-primary)">
            CompassLabs
          </p>

          <h1 className="mt-4 max-w-xl text-5xl font-bold leading-tight text-(--cl-color-text)">
            A clearer way to decide where you want to work.
          </h1>

          <p className="mt-5 max-w-lg text-lg leading-8 text-(--cl-color-text-muted)">
            Sign in to continue researching companies, comparing opportunities,
            and saving insights that help you make better career decisions.
          </p>

          <div className="mt-10 max-w-xl rounded-(--cl-radius-lg) border border-(--cl-color-border) bg-(--cl-color-surface) p-5 shadow-(--cl-shadow-md)">
            <div className="flex items-center justify-between border-b border-(--cl-color-border) pb-4">
              <div>
                <p className="text-sm font-semibold text-(--cl-color-text)">
                  Company research snapshot
                </p>
                <p className="mt-1 text-sm text-(--cl-color-text-muted)">
                  Infosys compared with TCS
                </p>
              </div>

              <div className="rounded-full bg-(--cl-color-primary-soft) p-2 text-(--cl-color-primary)">
                <BarChart3 size={20} />
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="flex items-center justify-between rounded-(--cl-radius-md) bg-(--cl-color-surface-soft) px-4 py-3">
                <span className="text-sm text-(--cl-color-text-muted)">
                  Culture signal
                </span>
                <span className="text-sm font-semibold text-(--cl-color-text)">
                  Strong
                </span>
              </div>

              <div className="flex items-center justify-between rounded-(--cl-radius-md) bg-(--cl-color-surface-soft) px-4 py-3">
                <span className="text-sm text-(--cl-color-text-muted)">
                  Growth trajectory
                </span>
                <span className="text-sm font-semibold text-(--cl-color-accent)">
                  Stable
                </span>
              </div>

              <div className="flex items-center gap-3 rounded-(--cl-radius-md) bg-(--cl-color-surface-soft) px-4 py-3">
                <Search size={18} className="text-(--cl-color-primary)" />
                <span className="text-sm text-(--cl-color-text-muted)">
                  Search, compare, bookmark, and return anytime.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md rounded-(--cl-radius-lg) border border-(--cl-color-border) bg-(--cl-color-surface) p-8 shadow-(--cl-shadow-md)">
          <div className="mb-8">
            <div className="mb-5 inline-flex rounded-full bg-(--cl-color-primary-soft) p-3 text-(--cl-color-primary)">
              <ShieldCheck size={24} />
            </div>

            <h2 className="text-3xl font-bold text-(--cl-color-text)">
              Welcome back
            </h2>

            <p className="mt-2 text-sm leading-6 text-(--cl-color-text-muted)">
              Sign in to your CompassLabs workspace.
            </p>
          </div>

          <form className="space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-(--cl-color-text)">
                Email
              </span>

              <div className="mt-2 flex items-center gap-3 rounded-(--cl-radius-md) border border-(--cl-color-border) bg-(--cl-color-surface) px-4 py-3 focus-within:border-(--cl-color-primary)">
                <Mail size={18} className="text-(--cl-color-text-soft)" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
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
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-transparent text-sm text-(--cl-color-text) outline-none placeholder:text-(--cl-color-text-soft)"
                />
              </div>
            </label>

            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-(--cl-radius-md) bg-(--cl-color-primary) px-5 py-3 text-sm font-semibold text-white shadow-(--cl-shadow-sm) transition hover:bg-(--cl-color-primary-hover)"
            >
              Sign in
              <ArrowRight size={18} />
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-(--cl-color-text-muted)">
            New to CompassLabs?{" "}
            <Link
              to="/sign-up"
              className="font-semibold text-(--cl-color-primary) transition hover:text-(--cl-color-primary-hover)"
            >
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default SignIn;
