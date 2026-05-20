"use client";

import { useMemo, useState } from "react";
import type { ProblemLink } from "@/shared/types/domain";
import { DifficultyBadge } from "@/features/dashboard/components/DifficultyBadge";

const PAGE_SIZE = 8;

export function TodayProblemsSection({
  loading,
  todaySolved,
  problems,
}: {
  loading: boolean;
  todaySolved: number;
  problems: ProblemLink[];
}) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(problems.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const shouldPaginate = problems.length > PAGE_SIZE;

  const visibleProblems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return problems.slice(start, start + PAGE_SIZE);
  }, [currentPage, problems]);

  const rangeStart = problems.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, problems.length);

  return (
    <section className="glass-card min-w-0 rounded-[2.5rem] border border-neutral-200/70 p-6 shadow-xl dark:border-neutral-800 sm:p-8">
      <div className="surface-panel min-w-0 rounded-3xl border border-neutral-200/60 p-5 dark:border-neutral-800 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Solved Today
            </p>
            <h2 className="mt-2 text-wrap-balance text-xl font-extrabold tracking-tight text-neutral-950 dark:text-neutral-50">
              Accepted Problems
            </h2>
          </div>
          <span className="max-w-full break-words rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 font-mono text-[11px] font-bold text-emerald-700 tabular-nums dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400">
            {todaySolved} solved
          </span>
        </div>

        {loading ? (
          <div className="mt-6 flex items-center gap-3 font-mono text-xs text-neutral-500 dark:text-neutral-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-200 border-t-blue-600 dark:border-neutral-800 dark:border-t-blue-300" />
            Loading solved problems…
          </div>
        ) : !problems.length ? (
          <div className="mt-6 rounded-2xl border border-dashed border-neutral-200 bg-white/40 px-5 py-8 text-center font-mono text-xs leading-6 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950/15 dark:text-neutral-400">
            No accepted problems solved today. Keep pushing!
          </div>
        ) : (
          <>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200/70 pt-4 dark:border-neutral-800">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500 tabular-nums dark:text-neutral-400">
                Showing {rangeStart}-{rangeEnd} of {problems.length}
              </p>
              {shouldPaginate && (
                <nav className="flex items-center gap-2" aria-label="Accepted Problems Pagination">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(current - 1, 1))}
                    disabled={currentPage === 1}
                    className="rounded-full border border-neutral-200/80 bg-white/70 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-600 transition duration-200 hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-neutral-800 dark:bg-neutral-950/30 dark:text-neutral-300 dark:hover:border-blue-600 dark:hover:text-blue-300 dark:focus-visible:ring-offset-neutral-950"
                  >
                    Previous
                  </button>
                  <span className="font-mono text-[10px] font-bold text-neutral-500 tabular-nums dark:text-neutral-400">
                    {currentPage}/{pageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) => Math.min(current + 1, pageCount))
                    }
                    disabled={currentPage === pageCount}
                    className="rounded-full border border-neutral-200/80 bg-white/70 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-600 transition duration-200 hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-neutral-800 dark:bg-neutral-950/30 dark:text-neutral-300 dark:hover:border-blue-600 dark:hover:text-blue-300 dark:focus-visible:ring-offset-neutral-950"
                  >
                    Next
                  </button>
                </nav>
              )}
            </div>

            <ul className="mt-4 grid min-w-0 gap-3 lg:grid-cols-2" aria-live="polite">
              {visibleProblems.map((problem) => (
                <li
                  key={`${problem.slug ?? "noslug"}-${problem.title}`}
                  className="group relative min-w-0 rounded-2xl border border-neutral-200/70 bg-white/55 px-4 py-3.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-300/80 hover:shadow dark:border-neutral-800 dark:bg-neutral-950/20 dark:hover:border-blue-700/70"
                >
                  <span className="flex min-w-0 items-start justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 dark:bg-emerald-400" />
                      {problem.slug ? (
                        <a
                          href={`https://leetcode.com/problems/${problem.slug}/`}
                          target="_blank"
                          rel="noreferrer"
                          className="block min-w-0 truncate text-sm font-semibold text-neutral-800 underline decoration-neutral-300 underline-offset-4 transition hover:text-blue-700 hover:decoration-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:text-neutral-100 dark:decoration-neutral-700 dark:hover:text-blue-300 dark:hover:decoration-blue-500 dark:focus-visible:ring-offset-neutral-950"
                          title={problem.title}
                        >
                          {problem.title}
                        </a>
                      ) : (
                        <span className="min-w-0 truncate text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                          {problem.title}
                        </span>
                      )}
                    </span>
                    <DifficultyBadge difficulty={problem.difficulty} />
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
