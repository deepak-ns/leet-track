import Link from "next/link";

export default function Home() {
  return (
    <div className="saas-shell flex flex-1 items-center justify-center px-4 py-10 sm:px-8 sm:py-16">
      <main className="w-full max-w-5xl rounded-3xl border border-slate-200 bg-white/70 p-6 sm:p-10 lg:p-12">
        <div className="glass-card hover-lift rounded-2xl p-6 sm:p-8 lg:p-10">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-700">
            LeetTrack
          </p>
          <h1 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Build coding consistency with a modern LeetCode accountability workspace.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Track daily progress, manage backlog intelligently, and stay motivated with
            friend comparisons in a clean SaaS-style workspace.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="gradient-button inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/35 transition hover:opacity-90"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
