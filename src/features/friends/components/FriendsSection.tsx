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
  onSelectFriend: (
    friendId: string,
    friendName: string | null,
  ) => Promise<void>;
}) {
  return (
    <>
      {/* Search & Add Friends Section */}
      <section
        style={{ zIndex: 10 }}
        className="glass-card min-w-0 rounded-[2.5rem] border border-neutral-200/70 p-6 shadow-xl dark:border-neutral-800 sm:p-8"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Add Friend
            </p>

            <h2 className="mt-2 text-wrap-balance text-xl font-extrabold tracking-tight text-neutral-950 dark:text-neutral-50">
              Search by Name or Handle
            </h2>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative w-full">
            <label htmlFor="friend-search" className="sr-only">
              Search Friends by Name or LeetCode Handle
            </label>

            <input
              id="friend-search"
              type="text"
              name="friend_search"
              autoComplete="off"
              spellCheck={false}
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
              placeholder="Enter name or LeetCode handle…"
              className="field-input w-full rounded-2xl px-4 py-3.5 text-sm"
            />

            {showSuggestions && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-64 overflow-y-auto rounded-2xl border border-neutral-200 bg-white/95 shadow-xl backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/95">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      void onAddFriend(user.id);
                      onHideSuggestions();
                    }}
                    className="w-full border-b border-neutral-100 px-4 py-3 text-left transition-colors duration-200 last:border-b-0 hover:bg-blue-50/70 focus-visible:bg-blue-50/80 focus-visible:outline-none dark:border-neutral-800/70 dark:hover:bg-blue-950/20 dark:focus-visible:bg-blue-950/25"
                  >
                    <p className="text-sm font-semibold text-neutral-950 dark:text-neutral-50">
                      {user.name || "Unnamed user"}
                    </p>

                    <p className="mt-0.5 font-mono text-[10px] text-neutral-500 dark:text-neutral-400">
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
            className="gradient-button shrink-0 rounded-2xl px-6 py-3.5 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
          >
            {searchLoading ? "Searching…" : "Search"}
          </button>
        </div>

        {friendError && (
          <p
            className="mt-4 rounded-2xl border border-red-200/60 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300"
            aria-live="polite"
          >
            {friendError}
          </p>
        )}

        {friendMessage && (
          <p
            className="mt-4 rounded-2xl border border-emerald-200/60 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
            aria-live="polite"
          >
            {friendMessage}
          </p>
        )}
      </section>

      {/* Friends Scoreboard Table */}
      <section className="glass-card min-w-0 rounded-[2.5rem] border border-neutral-200/70 p-6 shadow-xl dark:border-neutral-800 sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Scoreboard
            </p>

            <h2 className="mt-2 text-wrap-balance text-xl font-extrabold tracking-tight text-neutral-950 dark:text-neutral-50">
              Friends Standings
            </h2>
          </div>
        </div>

        {friendsStatsLoading && (
          <div className="mt-6 flex items-center gap-3 font-mono text-xs text-neutral-500 dark:text-neutral-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-200 border-t-blue-600 dark:border-neutral-800 dark:border-t-blue-300" />
            Loading scoreboard…
          </div>
        )}

        {!friendsStatsLoading && !friendsStats.length && (
          <div className="mt-6 rounded-2xl border border-dashed border-neutral-200 bg-white/40 px-5 py-8 text-center font-mono text-xs leading-6 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950/15 dark:text-neutral-400">
            No friends tracking yet. Search and add friends above to build your
            scoreboard!
          </div>
        )}

        {!friendsStatsLoading && friendsStats.length > 0 && (
          <>
            <p className="mt-2 text-pretty text-xs font-medium text-neutral-600 dark:text-neutral-300">
              Select a friend to inspect their detailed solved history below.
            </p>

            <div className="mt-6 space-y-3 sm:hidden">
              {friendsStats.map((friend) => {
                const isSelected = selectedFriendId === friend.id;

                return (
                  <article
                    key={friend.id}
                    className={`rounded-2xl border p-4 transition ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/55 ring-1 ring-blue-500 dark:bg-blue-950/15"
                        : "border-neutral-200/70 bg-white/40 dark:border-neutral-800 dark:bg-neutral-950/15"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          void onSelectFriend(friend.id, friend.name)
                        }
                        className={`inline-flex max-w-full items-center gap-1 rounded-xl border px-3 py-1.5 text-sm font-bold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950 ${
                          isSelected
                            ? "border-blue-700 bg-blue-700 text-white shadow-md dark:border-blue-400 dark:bg-blue-400 dark:text-neutral-950"
                            : "border-neutral-200 bg-white/70 text-neutral-800 hover:border-blue-300 dark:border-neutral-800 dark:bg-neutral-900/45 dark:text-neutral-100 dark:hover:border-blue-700"
                        }`}
                      >
                        <span className="truncate">{friend.name}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => void onRemoveFriend(friend.id)}
                        disabled={removingFriendId === friend.id}
                        className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-red-700 transition-colors duration-200 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:border-red-900/35 dark:bg-red-950/20 dark:text-red-300 dark:focus-visible:ring-offset-neutral-950"
                      >
                        {removingFriendId === friend.id ? "..." : "Remove"}
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-neutral-200/70 bg-white/60 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950/20">
                        <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                          Today
                        </p>
                        <span
                          className={`mt-1 inline-flex items-center rounded-lg px-2.5 py-0.5 font-mono text-[11px] font-bold tabular-nums ${
                            friend.todaySolved > 0
                              ? "border border-emerald-200/60 bg-emerald-50 text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/25 dark:text-emerald-300"
                              : "bg-neutral-50 text-neutral-500 dark:bg-neutral-950/20 dark:text-neutral-400"
                          }`}
                        >
                          {friend.todaySolved}
                        </span>
                      </div>

                      <div className="rounded-xl border border-neutral-200/70 bg-white/60 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950/20">
                        <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                          Since Signup
                        </p>
                        <p className="mt-1 font-mono text-base font-extrabold tabular-nums text-neutral-900 dark:text-neutral-100">
                          {friend.problemsSolvedSinceSignup}
                        </p>
                      </div>

                      <div className="rounded-xl border border-neutral-200/70 bg-white/60 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950/20">
                        <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                          Active Days
                        </p>
                        <p className="mt-1 font-mono text-base font-extrabold tabular-nums text-blue-700 dark:text-blue-300">
                          {friend.activeFraction}
                        </p>
                      </div>

                      <div className="rounded-xl border border-neutral-200/70 bg-white/60 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950/20">
                        <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                          Profile
                        </p>
                        {friend.leetcodeUsername ? (
                          <a
                            href={`https://leetcode.com/u/${friend.leetcodeUsername}/`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 block truncate font-mono text-xs font-semibold text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:text-blue-300 dark:focus-visible:ring-offset-neutral-950"
                          >
                            @{friend.leetcodeUsername}
                          </a>
                        ) : (
                          <span className="mt-1 block text-xs text-neutral-400 dark:text-neutral-500">
                            -
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-neutral-200/70 bg-white/60 p-3 dark:border-neutral-800 dark:bg-neutral-950/20">
                      <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        Problems solved in the last 24 hours
                      </p>

                      {friend.todayProblems.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {friend.todayProblems.map((problem) => (
                            <a
                              key={`${friend.id}-${problem.slug ?? "noslug"}-${problem.title}`}
                              href={
                                problem.slug
                                  ? `https://leetcode.com/problems/${problem.slug}/`
                                  : undefined
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-lg border border-neutral-200/70 bg-white/40 px-2 py-1 text-xs text-neutral-700 transition-colors duration-200 hover:border-blue-300 hover:bg-blue-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-neutral-800 dark:bg-neutral-950/15 dark:text-neutral-300 dark:hover:border-blue-700 dark:focus-visible:ring-offset-neutral-950"
                            >
                              <span className="min-w-0 truncate">
                                {problem.title}
                              </span>
                              <DifficultyBadge
                                difficulty={problem.difficulty}
                              />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="mt-2 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
                          No problems yet
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-neutral-200/70 dark:border-neutral-800 sm:block">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200/70 dark:border-neutral-800">
                    {[
                      "Name",
                      "Today",
                      "Since Signup",
                      "Problems solved in the last 24 hours",
                      "Active Days",
                      "Profile",
                      "Actions",
                    ].map((col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-left font-mono text-[9px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {friendsStats.map((friend) => {
                    const isSelected = selectedFriendId === friend.id;

                    return (
                      <tr
                        key={friend.id}
                        className={`border-b border-neutral-200/70 last:border-b-0 dark:border-neutral-800 ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/55 ring-1 ring-blue-500 dark:bg-blue-950/15"
                            : "bg-white/35 dark:bg-neutral-950/15"
                        }`}
                      >
                        {/* Name */}
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() =>
                              void onSelectFriend(friend.id, friend.name)
                            }
                            className={`inline-flex max-w-full items-center gap-1 rounded-xl border px-3 py-1.5 text-sm font-bold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950 ${
                              isSelected
                                ? "border-blue-700 bg-blue-700 text-white shadow-md dark:border-blue-400 dark:bg-blue-400 dark:text-neutral-950"
                                : "border-neutral-200 bg-white/70 text-neutral-800 hover:border-blue-300 dark:border-neutral-800 dark:bg-neutral-900/45 dark:text-neutral-100 dark:hover:border-blue-700"
                            }`}
                          >
                            <span className="truncate">{friend.name}</span>
                          </button>
                        </td>

                        {/* Today */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center rounded-lg px-2.5 py-0.5 font-mono text-[11px] font-bold tabular-nums ${
                              friend.todaySolved > 0
                                ? "border border-emerald-200/60 bg-emerald-50 text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/25 dark:text-emerald-300"
                                : "bg-neutral-50 text-neutral-500 dark:bg-neutral-950/20 dark:text-neutral-400"
                            }`}
                          >
                            {friend.todaySolved}
                          </span>
                        </td>

                        {/* Since Signup */}
                        <td className="px-4 py-3.5 font-mono text-base font-extrabold tabular-nums text-neutral-900 dark:text-neutral-100">
                          {friend.problemsSolvedSinceSignup}
                        </td>

                        {/* Problems solved in the last 24 hours */}
                        <td className="px-4 py-3.5">
                          {friend.todayProblems.length ? (
                            <div className="flex flex-wrap gap-2">
                              {friend.todayProblems.map((problem) => (
                                <a
                                  key={`${friend.id}-${problem.slug ?? "noslug"}-${problem.title}`}
                                  href={
                                    problem.slug
                                      ? `https://leetcode.com/problems/${problem.slug}/`
                                      : undefined
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-lg border border-neutral-200/70 bg-white/40 px-2 py-1 text-xs text-neutral-700 transition-colors duration-200 hover:border-blue-300 hover:bg-blue-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-neutral-800 dark:bg-neutral-950/15 dark:text-neutral-300 dark:hover:border-blue-700 dark:focus-visible:ring-offset-neutral-950"
                                >
                                  <span className="min-w-0 truncate">
                                    {problem.title}
                                  </span>

                                  <DifficultyBadge
                                    difficulty={problem.difficulty}
                                  />
                                </a>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                              No problems yet
                            </span>
                          )}
                        </td>

                        {/* Active Days */}
                        <td className="px-4 py-3.5 font-mono text-base font-extrabold tabular-nums text-blue-700 dark:text-blue-300">
                          {friend.activeFraction}
                        </td>

                        {/* Profile */}
                        <td className="px-4 py-3.5">
                          {friend.leetcodeUsername ? (
                            <a
                              href={`https://leetcode.com/u/${friend.leetcodeUsername}/`}
                              target="_blank"
                              rel="noreferrer"
                              className="block max-w-full truncate font-mono text-xs font-semibold text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:text-blue-300 dark:focus-visible:ring-offset-neutral-950"
                            >
                              @{friend.leetcodeUsername}
                            </a>
                          ) : (
                            <span className="text-xs text-neutral-400 dark:text-neutral-500">
                              —
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => void onRemoveFriend(friend.id)}
                            disabled={removingFriendId === friend.id}
                            className="rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-red-700 transition-colors duration-200 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:border-red-900/35 dark:bg-red-950/20 dark:text-red-300 dark:focus-visible:ring-offset-neutral-950"
                          >
                            {removingFriendId === friend.id ? "…" : "Remove"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  );
}
