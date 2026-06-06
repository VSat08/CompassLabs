import { Link } from "react-router-dom";

function Home() {
    
  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col justify-center">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-(--cl-color-primary)">
            CompassLabs
          </p>

          <h1 className="text-4xl font-bold leading-tight text-(--cl-color-text) sm:text-5xl">
            Research companies with clarity before you choose your next role.
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-(--cl-color-text-muted)">
            CompassLabs brings company data, culture signals, news, and
            AI-powered insights into one clean workspace for job seekers.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/sign-up"
              className="rounded-(--cl-radius-md) bg-(--cl-color-primary) px-5 py-3 text-center text-sm font-semibold text-white shadow-(--cl-shadow-sm) transition hover:bg-(--cl-color-primary-hover)"
            >
              Start researching
            </Link>

            <Link
              to="/sign-in"
              className="rounded-(--cl-radius-md) border border-(--cl-color-border) bg-(--cl-color-surface) px-5 py-3 text-center text-sm font-semibold text-(--cl-color-text) shadow-(--cl-shadow-sm) transition hover:border-(--cl-color-border-strong)"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <div className="rounded-(--cl-radius-lg) border border-(--cl-color-border) bg-(--cl-color-surface) p-5 shadow-(--cl-shadow-sm)">
            <p className="text-sm font-semibold text-(--cl-color-text)">
              Company profiles
            </p>
            <p className="mt-2 text-sm leading-6 text-(--cl-color-text-muted)">
              Search a company and view structured information from multiple
              sources.
            </p>
          </div>

          <div className="rounded-(--cl-radius-lg) border border-(--cl-color-border) bg-(--cl-color-surface) p-5 shadow-(--cl-shadow-sm)">
            <p className="text-sm font-semibold text-(--cl-color-text)">
              AI insights
            </p>
            <p className="mt-2 text-sm leading-6 text-(--cl-color-text-muted)">
              Convert raw data into concise summaries, pros, cons, and job
              seeker verdicts.
            </p>
          </div>

          <div className="rounded-(--cl-radius-lg) border border-(--cl-color-border) bg-(--cl-color-surface) p-5 shadow-(--cl-shadow-sm)">
            <p className="text-sm font-semibold text-(--cl-color-text)">
              Compare companies
            </p>
            <p className="mt-2 text-sm leading-6 text-(--cl-color-text-muted)">
              Compare options side by side before deciding where to apply or
              interview.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;
