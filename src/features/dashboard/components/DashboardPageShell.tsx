import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

export function DashboardPageShell({
  userName,
  leetcodeUsername,
  focusSummary,
  onLogout,
  children,
}: {
  userName: string | null;
  leetcodeUsername: string | null;
  focusSummary: string;
  onLogout: () => Promise<void>;
  children: ReactNode;
}) {
  return (
    <div className="saas-shell min-h-screen px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="glass-card rounded-[2rem] p-5 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="eyebrow">TrackLeet</span>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100 sm:text-4xl">
                Track momentum, not just totals.
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
                Monitor today&apos;s pace, stay on target, and keep your
                progress visible in one responsive workspace.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[23rem]">
              <div className="rounded-[1.5rem] border border-white/70 bg-white/75 p-4 dark:border-slate-700 dark:bg-slate-800/75">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Focus
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                  {focusSummary}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-950 p-4 text-white dark:bg-slate-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text font-bold uppercase tracking-[0.18em] text-slate-050 dark:text-slate-100">
                      {userName ?? "User"}
                    </p>

                    <p className="mt-2 text-lg font-semibold">
                      {leetcodeUsername
                        ? `@${leetcodeUsername}`
                        : "Add your username"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <button
                      type="button"
                      onClick={() => void onLogout()}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 dark:border-red-900 dark:bg-red-900/40 dark:text-red-400 dark:hover:border-red-700 dark:hover:bg-red-900/60"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {children}
      </div>
    </div>
  );
}

