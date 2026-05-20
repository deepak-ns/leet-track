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
    <div className="saas-shell min-h-screen px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="glass-card overflow-hidden rounded-[2.5rem] border border-neutral-200/70 p-6 shadow-xl dark:border-neutral-800 sm:p-8">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/45 to-transparent" />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="eyebrow">TrackLeet</span>
              <h1 className="mt-4 text-wrap-balance text-3xl font-extrabold tracking-tight text-neutral-950 dark:text-neutral-50 sm:text-4xl">
                Track momentum,{" "}
                <span className="bg-gradient-to-r from-blue-700 via-sky-600 to-emerald-600 bg-clip-text text-transparent dark:from-blue-300 dark:via-sky-300 dark:to-emerald-300">
                  not just totals.
                </span>
              </h1>
              <p className="mt-3 text-wrap-pretty text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                Monitor today&apos;s pace, stay on target, and keep your
                progress visible in one responsive workspace.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:min-w-[24rem]">
              {/* Focus Summary Box */}
              <div className="flex flex-col justify-between rounded-3xl border border-neutral-200/70 bg-white/45 p-5 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/35">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Focus
                </span>
                <p className="mt-2 text-xs font-semibold leading-5 text-neutral-700 dark:text-neutral-200">
                  {focusSummary}
                </p>
              </div>

              {/* User Profile Info Box */}
              <div className="rounded-3xl border border-neutral-950 bg-neutral-950 p-5 text-neutral-50 shadow-lg dark:border-neutral-800 dark:bg-black">
                <div className="flex h-full flex-col justify-between gap-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        {userName ?? "User"}
                      </p>
                      <p className="mt-1 truncate font-mono text-sm font-bold text-blue-300">
                        {leetcodeUsername
                           ? `@${leetcodeUsername}`
                          : "No username set"}
                      </p>
                    </div>
                    <ThemeToggle />
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => void onLogout()}
                      aria-label="Log out of account"
                      className="w-full rounded-xl border border-red-900/45 bg-red-950/25 px-3.5 py-2 text-center font-mono text-xs font-bold uppercase tracking-wider text-red-300 transition duration-200 hover:bg-red-900/35 hover:text-red-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:w-auto"
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

