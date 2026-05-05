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
    <section id="history-section" className="surface-panel rounded-[2rem] p-6 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-100">
            {showingUserHistory
              ? "My Solved Problems "
              : selectedFriendName
                ? `${selectedFriendName}'s solved problems`
                : "Solved Problems History"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {!showingUserHistory && (
            <button
              type="button"
              onClick={() => void onLoadUserHistory()}
              className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-900/40 dark:text-sky-400 dark:hover:border-sky-700 dark:hover:bg-sky-900/60"
            >
              View My History
            </button>
          )}
          {(selectedFriendName || showingUserHistory) && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-400">
              {totalCount} problems
            </span>
          )}
        </div>
      </div>

      {friendHistoryLoading || userHistoryLoading ? (
        <div className="mt-6 flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500 dark:border-slate-700" />
          {showingUserHistory ? "Loading your history..." : "Loading friend history..."}
        </div>
      ) : friendHistoryError ? (
        <div className="mt-6 rounded-[1.5rem] border border-red-100 bg-red-50 px-4 py-6 text-sm leading-7 text-red-700 dark:border-red-900/50 dark:bg-red-900/40 dark:text-red-400">
          {friendHistoryError}
        </div>
      ) : userHistoryError ? (
        <div className="mt-6 rounded-[1.5rem] border border-red-100 bg-red-50 px-4 py-6 text-sm leading-7 text-red-700 dark:border-red-900/50 dark:bg-red-900/40 dark:text-red-400">
          {userHistoryError}
        </div>
      ) : selectedFriendName && !groupedHistory.length ? (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-sm leading-7 text-slate-500 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
          No solved problems found for this friend yet.
        </div>
      ) : showingUserHistory && !groupedHistory.length ? (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-sm leading-7 text-slate-500 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
          No solved problems found in your history yet. Keep solving problems to build your history!
        </div>
      ) : selectedFriendName || showingUserHistory ? (
        <div className="mt-6 space-y-6">
          {groupedHistory.map(({ date, entries }) => (
            <div
              key={date}
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-300">
                  {new Date(date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {entries.length} problem{entries.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {entries.map((item) => (
                  <div
                    key={`${date}-${item.problemSlug ?? "noslug"}-${item.createdAt}`}
                    className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        {item.problemSlug ? (
                          <a
                            href={`https://leetcode.com/problems/${item.problemSlug}/`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-semibold text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-600 dark:text-sky-400 dark:decoration-sky-700 dark:hover:text-sky-300"
                          >
                            {item.problemTitle}
                          </a>
                        ) : (
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {item.problemTitle}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
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
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-sm leading-7 text-slate-500 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
          Click a friend&apos;s name in the Friends section above to view their history, or click &quot;View My History&quot; to see your own solved problems.
        </div>
      )}
    </section>
  );
}
