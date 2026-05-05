import type { ProblemLink } from "@/shared/types/domain";
import { DifficultyBadge } from "@/features/dashboard/components/DifficultyBadge";

export function TodayProblemsSection({
  loading,
  todaySolved,
  problems,
}: {
  loading: boolean;
  todaySolved: number;
  problems: ProblemLink[];
}) {
  return (
    <section className="surface-panel rounded-[2.3rem] p-6 sm:p-8">
      <div className="surface-panel rounded-[2rem] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Solved Today
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-100">
              Accepted problems
            </h2>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
            {todaySolved} done
          </span>
        </div>

        {loading ? (
          <div className="mt-6 flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500 dark:border-slate-700" />
            Loading...
          </div>
        ) : !problems.length ? (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-sm leading-7 text-slate-500 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
            No accepted problems solved today.
          </div>
        ) : (
          <ul className="mt-6 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
            {problems.map((problem) => (
              <li
                key={`${problem.slug ?? "noslug"}-${problem.title}`}
                className="rounded-[1.1rem] border border-slate-200/80 bg-white px-3.5 py-3 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:rounded-[1.25rem] sm:px-4"
              >
                <span className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    {problem.slug ? (
                      <a
                        href={`https://leetcode.com/problems/${problem.slug}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="block min-w-0 rounded-md px-0.5 py-0.5 text-sky-700 underline decoration-sky-300 underline-offset-2 transition hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 dark:text-sky-400 dark:decoration-sky-700 dark:hover:text-sky-300"
                        title={problem.title}
                      >
                        {problem.title}
                      </a>
                    ) : (
                      <span>{problem.title}</span>
                    )}
                    <DifficultyBadge difficulty={problem.difficulty} />
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
