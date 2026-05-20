import type { HistoryGroup } from "@/shared/types/domain";
import { DifficultyBadge } from "@/features/dashboard/components/DifficultyBadge";

export function HistorySection({
  selectedFriendName,
  showingUserHistory,
  groupedHistory,
  totalCount,
  friendHistoryLoading,
  userHistoryLoading,
  friendHistoryError,
  userHistoryError,
  onLoadUserHistory,
}: {
  selectedFriendName: string | null;
  showingUserHistory: boolean;
  groupedHistory: HistoryGroup[];
  totalCount: number;
  friendHistoryLoading: boolean;
  userHistoryLoading: boolean;
  friendHistoryError: string | null;
  userHistoryError: string | null;
  onLoadUserHistory: () => Promise<void>;
}) {
  return (
    <section id="history-section" className="glass-card min-w-0 rounded-[2.5rem] border border-neutral-200/70 p-6 shadow-xl dark:border-neutral-800 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Activity Log
          </p>
          <h2 className="mt-2 text-wrap-balance text-xl font-extrabold tracking-tight text-neutral-950 dark:text-neutral-50">
            {showingUserHistory
              ? "My Solved Problems"
              : selectedFriendName
                ? `${selectedFriendName}'s Solved Problems`
                : "Solved Problems History"}
          </h2>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          {!showingUserHistory && (
            <button
              type="button"
              onClick={() => void onLoadUserHistory()}
              className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-800 transition-colors duration-200 hover:border-blue-300 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-blue-800/45 dark:bg-blue-950/20 dark:text-blue-300 dark:hover:bg-blue-950/35 dark:focus-visible:ring-offset-neutral-950"
            >
              View My History
            </button>
          )}
          {(selectedFriendName || showingUserHistory) && (
            <span className="max-w-full break-words rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 font-mono text-[11px] font-bold text-neutral-600 tabular-nums dark:border-neutral-800 dark:bg-neutral-950/20 dark:text-neutral-300">
              {totalCount} problems
            </span>
          )}
        </div>
      </div>

      {friendHistoryLoading || userHistoryLoading ? (
        <div className="mt-6 flex items-center gap-3 font-mono text-xs text-neutral-500 dark:text-neutral-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-200 border-t-blue-600 dark:border-neutral-800 dark:border-t-blue-300" />
          {showingUserHistory ? "Loading your history…" : "Loading friend history…"}
        </div>
      ) : friendHistoryError ? (
        <div className="mt-6 rounded-2xl border border-red-200/60 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
          {friendHistoryError}
        </div>
      ) : userHistoryError ? (
        <div className="mt-6 rounded-2xl border border-red-200/60 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
          {userHistoryError}
        </div>
      ) : selectedFriendName && !groupedHistory.length ? (
        <div className="mt-6 rounded-2xl border border-dashed border-neutral-200 bg-white/40 px-5 py-8 text-center font-mono text-xs leading-6 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950/15 dark:text-neutral-400">
          No solved problems found for this friend yet.
        </div>
      ) : showingUserHistory && !groupedHistory.length ? (
        <div className="mt-6 rounded-2xl border border-dashed border-neutral-200 bg-white/40 px-5 py-8 text-center font-mono text-xs leading-6 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950/15 dark:text-neutral-400">
          No solved problems found in your history yet. Keep solving problems to build your history!
        </div>
      ) : selectedFriendName || showingUserHistory ? (
        <div className="mt-6 min-w-0 space-y-6">
          {groupedHistory.map(({ date, entries }) => (
            <div
              key={date}
              className="surface-panel min-w-0 rounded-3xl border border-neutral-200/60 p-5 dark:border-neutral-800 sm:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-mono text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  {new Date(date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <span className="rounded-lg border border-neutral-200/70 bg-neutral-50 px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950/35 dark:text-neutral-400">
                  {entries.length} problem{entries.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-4 grid min-w-0 gap-3 lg:grid-cols-2">
                {entries.map((item) => (
                  <div
                    key={`${date}-${item.problemSlug ?? "noslug"}-${item.createdAt}`}
                    className="group relative min-w-0 rounded-xl border border-neutral-200/70 bg-white/55 px-4 py-3 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-blue-300/80 hover:shadow dark:border-neutral-800 dark:bg-neutral-950/20 dark:hover:border-blue-700/70"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        {item.problemSlug ? (
                          <a
                            href={`https://leetcode.com/problems/${item.problemSlug}/`}
                            target="_blank"
                            rel="noreferrer"
                            className="block min-w-0 truncate text-sm font-semibold text-neutral-800 underline decoration-neutral-300 underline-offset-4 transition-colors duration-200 hover:text-blue-700 hover:decoration-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:text-neutral-100 dark:decoration-neutral-700 dark:hover:text-blue-300 dark:hover:decoration-blue-500 dark:focus-visible:ring-offset-neutral-950"
                          >
                            {item.problemTitle}
                          </a>
                        ) : (
                          <p className="truncate text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                            {item.problemTitle}
                          </p>
                        )}
                        <p className="mt-1 font-mono text-[10px] text-neutral-500 dark:text-neutral-400">
                          Solved at{" "}
                          {new Date(item.createdAt).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <DifficultyBadge difficulty={item.problemDifficulty} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-neutral-200 bg-white/40 px-5 py-8 text-center font-mono text-xs leading-6 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950/15 dark:text-neutral-400">
          Click a friend&apos;s name in the Friends section above to view their history, or click &quot;View My History&quot; to see your own solved problems.
        </div>
      )}
    </section>
  );
}
