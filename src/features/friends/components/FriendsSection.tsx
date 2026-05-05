import type {
  FriendSearchResult,
  FriendStatsViewModel,
} from "@/shared/types/domain";
import { DifficultyBadge } from "@/features/dashboard/components/DifficultyBadge";

export function FriendsSection({
  searchTerm,
  searchResults,
  searchLoading,
  showSuggestions,
  friendError,
  friendMessage,
  friendsStats,
  friendsStatsLoading,
  selectedFriendId,
  removingFriendId,
  onSearchChange,
  onSearch,
  onShowSuggestions,
  onHideSuggestions,
  onAddFriend,
  onRemoveFriend,
  onSelectFriend,
}: {
  searchTerm: string;
  searchResults: FriendSearchResult[];
  searchLoading: boolean;
  showSuggestions: boolean;
  friendError: string | null;
  friendMessage: string | null;
  friendsStats: FriendStatsViewModel[];
  friendsStatsLoading: boolean;
  selectedFriendId: string | null;
  removingFriendId: string | null;
  onSearchChange: (value: string) => void;
  onSearch: () => Promise<void>;
  onShowSuggestions: () => void;
  onHideSuggestions: () => void;
  onAddFriend: (friendUserId: string) => Promise<void>;
  onRemoveFriend: (friendUserId: string) => Promise<void>;
  onSelectFriend: (friendId: string, friendName: string | null) => Promise<void>;
}) {
  return (
    <>
      <section className="surface-panel rounded-[2rem] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Add Friend
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-100">
              Search by name or handle
            </h2>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative w-full">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void onSearch();
                  onHideSuggestions();
                }
              }}
              onFocus={() => searchResults.length > 0 && onShowSuggestions()}
              onBlur={() => setTimeout(onHideSuggestions, 200)}
              placeholder="Jane or leetcode_handle"
              className="field-input w-full rounded-2xl px-4 py-3 text-sm"
            />

            {showSuggestions && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      void onAddFriend(user.id);
                      onHideSuggestions();
                    }}
                    className="w-full border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-sky-50 dark:border-slate-700 dark:hover:bg-sky-900/40"
                  >
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {user.name || "Unnamed user"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {user.leetcode_username
                        ? `@${user.leetcode_username}`
                        : "No LeetCode username"}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => void onSearch()}
            disabled={searchLoading}
            className="gradient-button rounded-2xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {searchLoading ? "Searching..." : "Search"}
          </button>
        </div>

        {friendError && (
          <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-3 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/40 dark:text-red-400">
            {friendError}
          </p>
        )}
        {friendMessage && (
          <p className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/40 dark:text-emerald-400">
            {friendMessage}
          </p>
        )}
      </section>

      <section className="surface-panel rounded-[2rem] p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xl font-bold uppercase tracking-[0.18em] text-slate-1000 dark:text-slate-100">
              Friends
            </p>
          </div>
        </div>

        {friendsStatsLoading && (
          <div className="mt-6 flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500 dark:border-slate-700" />
            Loading...
          </div>
        )}

        {!friendsStatsLoading && !friendsStats.length && (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-sm leading-7 text-slate-500 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
            No friends yet. Add friends above to see their stats here.
          </div>
        )}

        {!friendsStatsLoading && friendsStats.length > 0 && (
          <>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Click on a name to view their history of problems solved.
            </p>
            <div className="mt-6 hidden overflow-x-auto rounded-[1.5rem] border border-slate-100 bg-white dark:border-slate-700 dark:bg-slate-800 xl:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Today</th>
                    <th className="px-4 py-3">Since signup</th>
                    <th className="px-4 py-3">Problems</th>
                    <th className="px-4 py-3">Active days</th>
                    <th className="px-4 py-3">Profile</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {friendsStats.map((friend) => (
                    <tr
                      key={friend.id}
                      className={`text-slate-800 transition dark:text-slate-300 ${
                        selectedFriendId === friend.id
                          ? "bg-slate-100/80 dark:bg-slate-700/80"
                          : "hover:bg-slate-50/80 dark:hover:bg-slate-700/50"
                      }`}
                    >
                      <td className="px-4 py-4 font-medium">
                        <button
                          type="button"
                          onClick={() => void onSelectFriend(friend.id, friend.name)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-base font-semibold text-slate-900 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-sky-700 dark:hover:bg-sky-900/40 dark:hover:text-sky-400"
                        >
                          {friend.name}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            friend.todaySolved > 0
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400"
                          }`}
                        >
                          {friend.todaySolved}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-semibold text-rose-700 dark:text-rose-400">
                        {friend.problemsSolvedSinceSignup}
                      </td>
                      <td className="px-4 py-4">
                        {friend.todayProblems.length ? (
                          <div className="flex flex-wrap gap-2.5">
                            {friend.todayProblems.map((problem) => (
                              <a
                                key={`${friend.id}-${problem.slug ?? "noslug"}-${problem.title}`}
                                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-700 dark:hover:bg-sky-900/40 dark:hover:text-sky-400"
                                title={problem.title}
                                href={
                                  problem.slug
                                    ? `https://leetcode.com/problems/${problem.slug}/`
                                    : undefined
                                }
                                target="_blank"
                                rel="noreferrer"
                              >
                                {problem.title}
                                <DifficultyBadge difficulty={problem.difficulty} />
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300 dark:text-slate-500">
                            No problems yet
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-violet-700 dark:text-violet-400">
                          {friend.activeFraction}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {friend.leetcodeUsername ? (
                          <a
                            href={`https://leetcode.com/u/${friend.leetcodeUsername}/`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-sky-600 underline decoration-sky-300 underline-offset-2 hover:text-sky-800 dark:text-sky-400 dark:decoration-sky-700 dark:hover:text-sky-300"
                          >
                            @{friend.leetcodeUsername}
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => void onRemoveFriend(friend.id)}
                          disabled={removingFriendId === friend.id}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:bg-red-900/40 dark:text-red-400 dark:hover:border-red-700 dark:hover:bg-red-900/60"
                        >
                          {removingFriendId === friend.id ? "Removing..." : "Remove"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 grid gap-3 xl:hidden">
              {friendsStats.map((friend) => (
                <article
                  key={friend.id}
                  className={`rounded-[1.5rem] border border-white/70 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 ${
                    selectedFriendId === friend.id
                      ? "border-sky-300 bg-sky-50/40 dark:border-sky-700 dark:bg-sky-900/20"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <button
                        type="button"
                        onClick={() => void onSelectFriend(friend.id, friend.name)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-lg font-semibold text-slate-900 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-sky-700 dark:hover:bg-sky-900/40 dark:hover:text-sky-400"
                      >
                        {friend.name}
                      </button>
                      {friend.leetcodeUsername && (
                        <div className="mt-1">
                          <a
                            href={`https://leetcode.com/u/${friend.leetcodeUsername}/`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-medium text-sky-600 underline decoration-sky-300 underline-offset-2 hover:text-sky-800 dark:text-sky-400 dark:decoration-sky-700 dark:hover:text-sky-300"
                          >
                            @{friend.leetcodeUsername}
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                          friend.todaySolved > 0
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400"
                        }`}
                      >
                        {friend.todaySolved} today
                      </span>
                      <button
                        type="button"
                        onClick={() => void onRemoveFriend(friend.id)}
                        disabled={removingFriendId === friend.id}
                        className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:bg-red-900/40 dark:text-red-400 dark:hover:border-red-700 dark:hover:bg-red-900/60"
                      >
                        {removingFriendId === friend.id ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                        Active days
                      </p>
                      <p className="mt-2 text-xl font-semibold text-violet-700 dark:text-violet-400">
                        {friend.activeFraction}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                        Total Solved Since signup
                      </p>
                      <p className="mt-2 text-xl font-semibold text-rose-700 dark:text-rose-400">
                        {friend.problemsSolvedSinceSignup}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                      Problems
                    </p>
                    {friend.todayProblems.length ? (
                      <div className="mt-2 flex flex-wrap gap-2.5">
                        {friend.todayProblems.map((problem) => (
                          <a
                            key={`${friend.id}-${problem.slug ?? "noslug"}-${problem.title}`}
                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-700 dark:hover:bg-sky-900/40 dark:hover:text-sky-400"
                            href={
                              problem.slug
                                ? `https://leetcode.com/problems/${problem.slug}/`
                                : undefined
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            {problem.title}
                            <DifficultyBadge difficulty={problem.difficulty} />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        No problems solved today yet.
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}

