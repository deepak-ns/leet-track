"use client";

import { useEffect, useMemo, useState } from "react";
import {
  extractSubmissionRecords,
  getAcceptedSubmissions,
  getCalendar,
  getSolved,
  getSolvedTodayCount,
  getSolvedTodayProblems,
  updateBacklogAndStreak,
} from "@/lib/leetcode";
import { saveDailyStats } from "@/lib/daily-stats";
import { supabase } from "@/lib/supabase";

type DashboardStats = {
  totalSolved: number;
  todaySolved: number;
  todaySolvedProblems: string[];
  dailyTarget: number;
  backlog: number;
  streak: number;
  leetcodeUsername: string | null;
};

type FriendSearchResult = {
  id: string;
  name: string | null;
  leetcode_username: string | null;
};

type FriendStatsRow = {
  id: string;
  name: string;
  todaySolved: number;
  streak: number;
  backlog: number;
  todaySolvedProblems: string[];
};

type MetricCardProps = {
  label: string;
  value: number;
  subtitle?: string;
  accent?: "blue" | "green" | "amber" | "rose" | "violet";
};

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function getTotalSolved(payload: unknown): number {
  if (typeof payload !== "object" || payload === null) return 0;
  const solved = payload as Record<string, unknown>;
  const directTotal =
    toNumber(solved.totalSolved) ??
    toNumber(solved.solvedProblem) ??
    toNumber(solved.solved);
  if (directTotal !== null) return directTotal;
  const easy = toNumber(solved.easySolved) ?? 0;
  const medium = toNumber(solved.mediumSolved) ?? 0;
  const hard = toNumber(solved.hardSolved) ?? 0;
  return easy + medium + hard;
}

function getStreak(payload: unknown): number {
  if (typeof payload !== "object" || payload === null) return 0;
  const calendar = payload as Record<string, unknown>;
  return (
    toNumber(calendar.streak) ??
    toNumber(calendar.currentStreak) ??
    toNumber(calendar.activeDays) ??
    0
  );
}

const accentStyles = {
  blue:   { bar: "bg-blue-500",   num: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-100" },
  green:  { bar: "bg-emerald-500", num: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  amber:  { bar: "bg-amber-400",  num: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-100" },
  rose:   { bar: "bg-rose-500",   num: "text-rose-600",   bg: "bg-rose-50",   border: "border-rose-100" },
  violet: { bar: "bg-violet-500", num: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
};

function MetricCard({ label, value, subtitle, accent = "blue" }: MetricCardProps) {
  const s = accentStyles[accent];
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md`}>
      <div className={`absolute left-0 top-0 h-1 w-full ${s.bar}`} />
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-800">{label}</p>
      <p className={`mt-3 text-4xl font-bold tabular-nums ${s.num}`}>{value}</p>
      {subtitle && <p className="mt-1.5 text-xs text-gray-400">{subtitle}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSolved: 0,
    todaySolved: 0,
    todaySolvedProblems: [],
    dailyTarget: 1,
    backlog: 1,
    streak: 0,
    leetcodeUsername: null,
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<FriendSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [friendMessage, setFriendMessage] = useState<string | null>(null);
  const [friendError, setFriendError] = useState<string | null>(null);
  const [addingFriendId, setAddingFriendId] = useState<string | null>(null);
  const [friendsStats, setFriendsStats] = useState<FriendStatsRow[]>([]);
  const [friendsStatsLoading, setFriendsStatsLoading] = useState(false);

  async function loadFriendsStats(userId: string, date: string) {
    setFriendsStatsLoading(true);
    try {
      const { data: friendLinks, error: linksError } = await supabase
        .from("friends")
        .select("*")
        .eq("user_id", userId);
      if (linksError) throw linksError;

      const friendIds = (friendLinks ?? [])
        .map((item) => {
          const row = item as { friend_user_id?: string; friend_id?: string };
          return row.friend_user_id ?? row.friend_id;
        })
        .filter((id): id is string => Boolean(id));

      if (!friendIds.length) { setFriendsStats([]); return; }

      const [{ data: profiles, error: profilesError }, { data: dailyStats, error: statsError }] =
        await Promise.all([
          supabase.from("profiles").select("id, name, leetcode_username").in("id", friendIds),
          supabase.from("daily_stats").select("*").in("user_id", friendIds),
        ]);
      if (profilesError) throw profilesError;
      if (statsError) throw statsError;

      const statsByUserId = new Map<string, {
        solved_today?: number | string; today_solved?: number | string;
        streak?: number | string; backlog?: number | string;
      }>();
      (dailyStats ?? []).forEach((row) => {
        const stat = row as {
          user_id?: string; stat_date?: string; date?: string; created_at?: string;
          solved_today?: number | string; today_solved?: number | string;
          streak?: number | string; backlog?: number | string;
        };
        const rowDate = stat.stat_date ?? stat.date ?? (typeof stat.created_at === "string" ? stat.created_at.slice(0, 10) : undefined);
        if (stat.user_id && rowDate === date) statsByUserId.set(stat.user_id, stat);
      });

      const rows = (profiles ?? []).map((profile) => {
        const friend = profile as { id: string; name?: string | null; leetcode_username?: string | null };
        const stat = statsByUserId.get(friend.id);
        return {
          id: friend.id,
          name: friend.name ?? "Unnamed user",
          todaySolved: toNumber(stat?.solved_today ?? stat?.today_solved) ?? 0,
          streak: toNumber(stat?.streak) ?? 0,
          backlog: toNumber(stat?.backlog) ?? 0,
          todaySolvedProblems: [],
          leetcode_username: friend.leetcode_username ?? null,
        };
      });

      const friendRowsWithTitles = await Promise.all(
        rows.map(async (row) => {
          const record = row as FriendStatsRow & { leetcode_username?: string | null };
          const username = record.leetcode_username;
          if (!username) return record;
          try {
            const submissionsPayload = await getAcceptedSubmissions(username);
            const submissions = extractSubmissionRecords(submissionsPayload);
            const { problems } = getSolvedTodayProblems(submissions, { limit: 12 });
            return { ...record, todaySolvedProblems: problems };
          } catch { return record; }
        }),
      );

      const sanitized = friendRowsWithTitles.map((row) => {
        const { leetcode_username: _lc, ...rest } = row as FriendStatsRow & { leetcode_username?: string | null };
        void _lc;
        return rest;
      });
      setFriendsStats(sanitized);
    } catch (error) {
      setFriendError(error instanceof Error ? error.message : "Unable to load friend stats.");
    } finally {
      setFriendsStatsLoading(false);
    }
  }

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setErrorMessage(null);
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) throw new Error("Unable to load user details.");
        setCurrentUserId(user.id);

        const metadata = user.user_metadata as Record<string, unknown>;
        const leetcodeUsername = typeof metadata.leetcode_username === "string" ? metadata.leetcode_username : null;
        const dailyTarget = Math.max(1, toNumber(metadata.daily_target) ?? 1);
        const previousBacklog = Math.max(0, toNumber(metadata.backlog) ?? 0);
        const previousStreak = Math.max(0, toNumber(metadata.streak) ?? 0);
        const lastProgressDate = typeof metadata.last_progress_date === "string" ? metadata.last_progress_date : null;
        const todayDate = new Date().toISOString().slice(0, 10);
        await loadFriendsStats(user.id, todayDate);

        if (!leetcodeUsername) {
          await saveDailyStats({ userId: user.id, date: todayDate, totalSolved: 0, todaySolved: 0, dailyTarget, backlog: previousBacklog, streak: previousStreak, leetcodeUsername: null });
          setStats({ totalSolved: 0, todaySolved: 0, todaySolvedProblems: [], dailyTarget, backlog: previousBacklog, streak: previousStreak, leetcodeUsername: null });
          setLoading(false);
          return;
        }

        const [solvedPayload, submissionsPayload, calendarPayload] = await Promise.all([
          getSolved(leetcodeUsername),
          getAcceptedSubmissions(leetcodeUsername),
          getCalendar(leetcodeUsername),
        ]);

        const totalSolved = getTotalSolved(solvedPayload);
        const submissionRecords = extractSubmissionRecords(submissionsPayload);
        const todaySolved = getSolvedTodayCount(submissionRecords).solved_today;
        const todaySolvedProblems = getSolvedTodayProblems(submissionRecords, { limit: 12 }).problems;
        const fallbackStreak = getStreak(calendarPayload);

        const baselineDate = typeof metadata.baseline_date === "string" ? metadata.baseline_date : null;
        const hasBaselineBacklog = toNumber(metadata.baseline_backlog) !== null;
        const deficitNow = Math.max(dailyTarget - todaySolved, 0);
        const surplusNow = Math.max(todaySolved - dailyTarget, 0);

        let carryoverBacklog = previousBacklog;
        try {
          const { data: lastRow } = await supabase
            .from("daily_stats")
            .select("backlog, stat_date, date, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10);
          const rows = (lastRow ?? []) as Array<{ backlog?: number | string; stat_date?: string; date?: string; created_at?: string; }>;
          const yesterdayRow = rows.find((r) => {
            const rowDate = r.stat_date ?? r.date ?? (typeof r.created_at === "string" ? r.created_at.slice(0, 10) : undefined);
            return rowDate !== undefined && rowDate < todayDate;
          });
          if (yesterdayRow) carryoverBacklog = Math.max(0, toNumber(yesterdayRow.backlog) ?? previousBacklog);
        } catch { /* fallback */ }

        const inferredBaselineBacklog = lastProgressDate === todayDate && !hasBaselineBacklog
          ? Math.max(carryoverBacklog, Math.max(previousBacklog + surplusNow - deficitNow, 0))
          : carryoverBacklog;
        const baselineBacklog = baselineDate === todayDate
          ? Math.max(0, toNumber(metadata.baseline_backlog) ?? inferredBaselineBacklog)
          : inferredBaselineBacklog;
        const baselineStreak = baselineDate === todayDate
          ? Math.max(0, toNumber(metadata.baseline_streak) ?? (previousStreak || fallbackStreak))
          : previousStreak || fallbackStreak;

        const progress = updateBacklogAndStreak({ target: dailyTarget, solvedToday: todaySolved, previousBacklog: baselineBacklog, previousStreak: baselineStreak });
        const backlog = progress.backlog;
        const streak = progress.streak;

        if (baselineDate !== todayDate || backlog !== previousBacklog || streak !== (previousStreak || fallbackStreak)) {
          await supabase.auth.updateUser({
            data: { ...metadata, backlog, streak, last_progress_date: todayDate, baseline_date: todayDate, baseline_backlog: baselineBacklog, baseline_streak: baselineStreak },
          });
        }

        await saveDailyStats({ userId: user.id, date: todayDate, totalSolved, todaySolved, dailyTarget, backlog, streak, leetcodeUsername });
        setStats({ totalSolved, todaySolved, todaySolvedProblems, dailyTarget, backlog, streak, leetcodeUsername });
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to load dashboard metrics right now.");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const cards = useMemo(
    () => [
      { label: "Total Solved", value: stats.totalSolved, subtitle: stats.leetcodeUsername ? `@${stats.leetcodeUsername}` : "Add LeetCode username on signup", accent: "blue" as const },
      { label: "Today Solved", value: stats.todaySolved, accent: "green" as const },
      { label: "Remaining Today", value: Math.max(stats.dailyTarget - stats.todaySolved, 0), subtitle: `Target: ${stats.dailyTarget} problems/day`, accent: "amber" as const },
      { label: "Backlog", value: stats.backlog, accent: "rose" as const },
      { label: "Streak", value: stats.streak, subtitle: "Active days streak", accent: "violet" as const },
    ],
    [stats],
  );

  async function handleFriendSearch() {
    const query = searchTerm.trim();
    if (!query) { setSearchResults([]); setFriendError("Enter a name or LeetCode username."); setFriendMessage(null); return; }
    setSearchLoading(true); setFriendError(null); setFriendMessage(null);
    try {
      const { data, error } = await supabase.from("profiles").select("id, name, leetcode_username").or(`name.ilike.%${query}%,leetcode_username.ilike.%${query}%`).limit(10);
      if (error) throw error;
      let results = (data ?? []) as FriendSearchResult[];
      if (!results.length) {
        const { data: dailyStatUsers, error: dailyStatsError } = await supabase.from("daily_stats").select("user_id, leetcode_username").ilike("leetcode_username", `%${query}%`).limit(10);
        if (dailyStatsError) throw dailyStatsError;
        const fallbackResults: FriendSearchResult[] = (dailyStatUsers ?? []).map((row): FriendSearchResult | null => {
          const record = row as { user_id?: string; leetcode_username?: string | null };
          if (!record.user_id) return null;
          return { id: record.user_id, name: null, leetcode_username: record.leetcode_username ?? null };
        }).filter((item): item is FriendSearchResult => item !== null);
        const uniqueById = new Map<string, FriendSearchResult>();
        fallbackResults.forEach((item) => uniqueById.set(item.id, item));
        results = Array.from(uniqueById.values());
      }
      const filtered = currentUserId ? results.filter((item) => item.id !== currentUserId) : results;
      setSearchResults(filtered);
      if (!filtered.length) setFriendMessage("No users found. Ask your friend to log in once so their profile/stats are created.");
    } catch (error) {
      setFriendError(error instanceof Error ? error.message : "Failed to search users.");
      setSearchResults([]);
    } finally { setSearchLoading(false); }
  }

  async function handleAddFriend(friendUserId: string) {
    if (!currentUserId) { setFriendError("You must be logged in to add friends."); return; }
    if (friendUserId === currentUserId) { setFriendError("You cannot add yourself as a friend."); return; }
    setAddingFriendId(friendUserId); setFriendError(null); setFriendMessage(null);
    try {
      const { error } = await supabase.from("friends").upsert({ user_id: currentUserId, friend_user_id: friendUserId }, { onConflict: "user_id,friend_user_id" });
      if (error) {
        const { error: fallbackError } = await supabase.from("friends").upsert({ user_id: currentUserId, friend_id: friendUserId }, { onConflict: "user_id,friend_id" });
        if (fallbackError) throw fallbackError;
      }
      setFriendMessage("Friend added successfully.");
      await loadFriendsStats(currentUserId, new Date().toISOString().slice(0, 10));
    } catch (error) {
      setFriendError(error instanceof Error ? error.message : "Failed to add friend.");
    } finally { setAddingFriendId(null); }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 font-sans">
      <div className="mx-auto w-full max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">LeetTrack</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Track your LeetCode momentum, backlog, and streak — and compare with friends.
            </p>
          </div>
          {stats.leetcodeUsername && (
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
              @{stats.leetcodeUsername}
            </span>
          )}
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <span className="mt-0.5 text-red-500">⚠</span>
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        {/* Metric cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          {cards.map((card) => (
            <MetricCard
              key={card.label}
              label={card.label}
              value={loading ? 0 : card.value}
              subtitle={card.subtitle}
              accent={card.accent}
            />
          ))}
        </div>

        {/* Solved Today */}
        {!loading && (
          <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-lg">✅</span>
              <h2 className="text-base font-semibold text-gray-900">Solved Today</h2>
            </div>
            {!stats.todaySolvedProblems.length ? (
              <p className="text-sm text-gray-400">No accepted problems solved today yet. Keep going!</p>
            ) : (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {stats.todaySolvedProblems.map((title) => (
                  <li
                    key={title}
                    className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-800"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    {title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {loading && (
          <div className="mt-6 flex items-center gap-2 text-sm text-gray-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500" />
            Loading your stats...
          </div>
        )}

        {/* Add Friend */}
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-lg">👥</span>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Add Friend</h2>
              <p className="text-xs text-gray-400">Search by name or LeetCode username</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFriendSearch()}
              placeholder="e.g. Jane or leetcode_handle"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none ring-0 transition placeholder:text-gray-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={handleFriendSearch}
              disabled={searchLoading}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {searchLoading ? "Searching…" : "Search"}
            </button>
          </div>

          {friendError && (
            <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{friendError}</p>
          )}
          {friendMessage && (
            <p className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{friendMessage}</p>
          )}

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 transition hover:bg-gray-100"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{user.name || "Unnamed user"}</p>
                    <p className="text-xs text-gray-400">{user.leetcode_username ? `@${user.leetcode_username}` : "No LeetCode username"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddFriend(user.id)}
                    disabled={addingFriendId === user.id}
                    className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {addingFriendId === user.id ? "Adding…" : "+ Add"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Friends table */}
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-lg">🏆</span>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Friends</h2>
              <p className="text-xs text-gray-400">Name, today solved, streak, and backlog</p>
            </div>
          </div>

          {friendsStatsLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500" />
              Loading friend stats…
            </div>
          )}

          {!friendsStatsLoading && !friendsStats.length && (
            <p className="text-sm text-gray-400">No friends yet. Add friends above to see their stats here.</p>
          )}

          {!friendsStatsLoading && friendsStats.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-widest text-gray-400">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Today</th>
                    <th className="px-4 py-3">Problems</th>
                    <th className="px-4 py-3">Streak</th>
                    <th className="px-4 py-3">Backlog</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {friendsStats.map((friend) => (
                    <tr key={friend.id} className="bg-white text-gray-800 transition hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{friend.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          friend.todaySolved > 0 ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"
                        }`}>
                          {friend.todaySolved}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {friend.todaySolvedProblems.length ? (
                          <div className="flex flex-wrap gap-1.5">
                            {friend.todaySolvedProblems.map((title) => (
                              <span
                                key={`${friend.id}-${title}`}
                                className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs text-gray-600"
                                title={title}
                              >
                                {title}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-violet-600">{friend.streak}</span>
                        <span className="ml-1 text-xs text-gray-400">days</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${friend.backlog > 0 ? "text-rose-500" : "text-gray-400"}`}>
                          {friend.backlog}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}