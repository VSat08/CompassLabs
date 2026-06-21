import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import SearchBar from "../components/SearchBar";

function Workspace() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const isLoading = useAuthStore((state) => state.isLoading);

  const handleSignOut = async () => {
    await signOut();
    navigate("/sign-in", { replace: true });
  };

  return (
    <main className="min-h-screen bg-(--cl-color-bg) px-6 py-10">
      <section className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-(--cl-color-primary)">
              CompassLabs
            </p>
            <h1 className="mt-3 text-3xl font-bold text-(--cl-color-text)">
              Workspace
            </h1>
            <p className="mt-2 text-sm text-(--cl-color-text-muted)">
              Signed in as {user?.email}
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={isLoading}
            className="rounded-(--cl-radius-md) border border-(--cl-color-border) bg-(--cl-color-surface) px-5 py-3 text-sm font-semibold text-(--cl-color-text) shadow-(--cl-shadow-sm) transition hover:border-(--cl-color-border-strong) disabled:cursor-not-allowed disabled:opacity-60"
          >
            Sign out
          </button>
        </div>

        <div className="mt-12">
          <SearchBar />
        </div>
      </section>
    </main>
  );
}

export default Workspace;
