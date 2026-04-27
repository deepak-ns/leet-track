"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { syncLeetcodeStatsForUserId, syncUserStats } from "@/lib/stats-sync";
import { supabase } from "@/lib/supabase";

type DashboardStats = {
  totalSolved: number;
  todaySolved: number;
  problemsSolvedSinceSignup: number;
  dailyTarget: number;
  activeFraction: string;
  todaySolvedProblems: {
    title: string;
    slug: string | null;
    difficulty: "Easy" | "Medium" | "Hard" | null;
  }[];
  userName: string | null;
  leetcodeUsername: string | null;
};

type FriendSearchResult = {
  id: string;
  name: string | null;
  leetcode_username: string | null;
};

type FriendProfileRow = {
  id: string;
  name: string | null;
  leetcode_username: string | null;
  daily_target: number | null;
};

type FriendDailyStatsUsernameRow = {
  user_id: string;
  leetcode_username: string | null;
  daily_target: number | null;
  stat_date: string | null;
};

type FriendStatsRow = {
  id: string;
  name: string;
  todaySolved: number;
  problemsSolvedSinceSignup: number;
  todayProblems: {
    title: string;
    slug: string | null;
    difficulty: "Easy" | "Medium" | "Hard" | null;
  }[];
  activeFraction: string;
};

type UserDashboardStatsRow = {
  user_id: string;
  name: string | null;
  total_solved: number | null;
  daily_target: number | null;
  solved_today: number | null;
  today_problem_titles: string[] | null;
  today_problem_slugs: string[] | null;
  today_problem_difficulties: string[] | null;
  problems_solved_since_signup: number | null;
  active_fraction: string | null;
};

type MetricCardProps = {
  label: string;
  value: number | string;
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

function getProblemTitles(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
}

function toSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getProblemLinks(
  titlesValue: unknown,
  slugsValue: unknown,
  difficultiesValue: unknown,
): {
  title: string;
  slug: string | null;
  difficulty: "Easy" | "Medium" | "Hard" | null;
}[] {
  const titles = getProblemTitles(titlesValue);
  const slugs = Array.isArray(slugsValue)
    ? slugsValue.map((v) => (typeof v === "string" ? v.trim() : ""))
    : [];
  const difficulties = Array.isArray(difficultiesValue)
    ? difficultiesValue.map((v) =>
        typeof v === "string" ? v.trim().toLowerCase() : "",
      )
    : [];

  return titles.map((title, index) => {
    const rawSlug = slugs[index] ?? "";
    const slug = rawSlug || toSlugFromTitle(title);
    const difficultyRaw = difficulties[index] ?? "";
    const difficulty =
      difficultyRaw === "easy"
        ? "Easy"
        : difficultyRaw === "medium"
          ? "Medium"
          : difficultyRaw === "hard"
            ? "Hard"
            : null;
    return { title, slug: slug || null, difficulty };
  });
}

function DifficultyBadge({
  difficulty,
}: {
  difficulty: "Easy" | "Medium" | "Hard" | null;
}) {
  if (!difficulty) return null;
  const className =
    difficulty === "Easy"
      ? "bg-emerald-100 text-emerald-700"
      : difficulty === "Medium"
        ? "bg-amber-100 text-amber-700"
        : "bg-rose-100 text-rose-700";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${className}`}
    >
      {difficulty}
    </span>
  );
}

const accentStyles = {
  blue: {
    bar: "from-sky-400 to-blue-600",
    num: "text-blue-700",
    badge: "bg-blue-100 text-blue-700",
    glow: "shadow-sky-500/10",
  },
  green: {
    bar: "from-emerald-400 to-teal-600",
    num: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700",
    glow: "shadow-emerald-500/10",
  },
  amber: {
    bar: "from-amber-300 to-orange-500",
    num: "text-amber-700",
    badge: "bg-amber-100 text-amber-700",
    glow: "shadow-amber-500/10",
  },
  rose: {
    bar: "from-rose-400 to-pink-600",
    num: "text-rose-700",
    badge: "bg-rose-100 text-rose-700",
    glow: "shadow-rose-500/10",
  },
  violet: {
    bar: "from-violet-400 to-indigo-600",
    num: "text-violet-700",
    badge: "bg-violet-100 text-violet-700",
    glow: "shadow-violet-500/10",
  },
};

function MetricCard({
  label,
  value,
  subtitle,
  accent = "blue",
}: MetricCardProps) {
  const s = accentStyles[accent];
  return (
    <div
      className={`metric-shell glass-card rounded-[1.6rem] p-5 shadow-lg ${s.glow}`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${s.bar}`}
      />
      <div
        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${s.badge}`}
      >
        {label}
      </div>
      <p
        className={`mt-4 text-4xl font-semibold tracking-tight tabular-nums ${s.num}`}
      >
        {value}
      </p>
      {subtitle && (
        <p className="mt-2 max-w-[18rem] text-sm leading-6 text-slate-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSolved: 0,
    todaySolved: 0,
    problemsSolvedSinceSignup: 0,
    dailyTarget: 1,
    activeFraction: "0/1",
    todaySolvedProblems: [],
    userName: null,
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
  const [friendIds, setFriendIds] = useState<string[]>([]);

  const loadFriendsStats = useCallback(async (userId: string, date: string) => {
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
      setFriendIds(friendIds);

      if (!friendIds.length) {
        setFriendsStats([]);
        return;
      }

      // On refresh/login, also refresh friends' stats in DB so you see updates even if they don't log in.
      const { data: friendProfiles, error: friendProfilesError } =
        await supabase
          .from("profiles")
          .select("id, name, leetcode_username, daily_target")
          .in("id", friendIds);
      if (friendProfilesError) throw friendProfilesError;

      const profilesById = new Map<string, FriendProfileRow>();
      (friendProfiles ?? []).forEach((row) => {
        const profile = row as FriendProfileRow;
        profilesById.set(profile.id, profile);
      });

      const { data: friendDailyStatsRows, error: friendDailyStatsError } =
        await supabase
          .from("daily_stats")
          .select("user_id, leetcode_username, daily_target, stat_date")
          .in("user_id", friendIds)
          .order("stat_date", { ascending: false });
      if (friendDailyStatsError) throw friendDailyStatsError;

      const dailyStatsById = new Map<string, FriendDailyStatsUsernameRow>();
      (friendDailyStatsRows ?? []).forEach((row) => {
        const stat = row as FriendDailyStatsUsernameRow;
        if (!dailyStatsById.has(stat.user_id)) {
          dailyStatsById.set(stat.user_id, stat);
        }
      });

      // Limit parallelism to avoid LeetCode API throttling.
      const concurrency = 4;
      const queue = friendIds.slice();
      const workers = Array.from({ length: concurrency }, async () => {
        while (queue.length) {
          const friendId = queue.shift();
          if (!friendId) return;
          const profile = profilesById.get(friendId);
          const fallbackStat = dailyStatsById.get(friendId);
          const usernameFromProfile =
            typeof profile?.leetcode_username === "string" &&
            profile.leetcode_username.trim()
              ? profile.leetcode_username.trim()
              : null;
          const usernameFromDailyStats =
            typeof fallbackStat?.leetcode_username === "string" &&
            fallbackStat.leetcode_username.trim()
              ? fallbackStat.leetcode_username.trim()
              : null;
          const username = usernameFromProfile ?? usernameFromDailyStats;
          if (!username) continue;
          const target = Math.max(
            1,
            Math.trunc(
              profile?.daily_target ?? fallbackStat?.daily_target ?? 1,
            ),
          );
          try {
            await syncLeetcodeStatsForUserId({
              userId: friendId,
              leetcodeUsername: username,
              dailyTarget: target,
            });
          } catch {
            // Best-effort refresh; fall back to last stored stats in the view.
          }
        }
      });
      await Promise.all(workers);

      const { data: friendStatsRows, error: friendStatsError } = await supabase
        .from("user_dashboard_stats")
        .select(
          "user_id, name, total_solved, daily_target, solved_today, today_problem_titles, today_problem_slugs, today_problem_difficulties, problems_solved_since_signup, active_fraction",
        )
        .in("user_id", friendIds);
      if (friendStatsError) throw friendStatsError;

      const statsByUserId = new Map<string, UserDashboardStatsRow>();
      (friendStatsRows ?? []).forEach((row) => {
        const stat = row as UserDashboardStatsRow;
        statsByUserId.set(stat.user_id, stat);
      });

      const rows: FriendStatsRow[] = friendIds.map((friendId) => {
        const stat = statsByUserId.get(friendId) ?? null;
        return {
          id: friendId,
          name:
            (typeof stat?.name === "string" && stat.name.trim()
              ? stat.name.trim()
              : null) ?? "Friend",
          todaySolved: toNumber(stat?.solved_today) ?? 0,
          problemsSolvedSinceSignup:
            toNumber(stat?.problems_solved_since_signup) ?? 0,
          todayProblems: getProblemLinks(
            stat?.today_problem_titles,
            stat?.today_problem_slugs,
            stat?.today_problem_difficulties,
          ),
          activeFraction:
            typeof stat?.active_fraction === "string" &&
            stat.active_fraction.trim()
              ? stat.active_fraction.trim()
              : "0/1",
        };
      });

      setFriendsStats(rows);
    } catch (error) {
      setFriendError(
        error instanceof Error ? error.message : "Unable to load friend stats.",
      );
    } finally {
      setFriendsStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setErrorMessage(null);
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error || !user) throw new Error("Unable to load user details.");
        setCurrentUserId(user.id);

        const todayDate = new Date().toISOString().slice(0, 10);
        await loadFriendsStats(user.id, todayDate);

        // Always refresh user's stats on login/refresh.
        await syncUserStats(user);

        const { data: dashboardRow, error: dashboardError } = await supabase
          .from("user_dashboard_stats")
          .select(
            "user_id, name, total_solved, daily_target, solved_today, today_problem_titles, today_problem_slugs, today_problem_difficulties, problems_solved_since_signup, active_fraction",
          )
          .eq("user_id", user.id)
          .maybeSingle();
        if (dashboardError) throw dashboardError;

        const row = (dashboardRow as UserDashboardStatsRow | null) ?? null;
        setStats({
          totalSolved: toNumber(row?.total_solved) ?? 0,
          todaySolved: toNumber(row?.solved_today) ?? 0,
          problemsSolvedSinceSignup:
            toNumber(row?.problems_solved_since_signup) ?? 0,
          dailyTarget: Math.max(1, toNumber(row?.daily_target) ?? 1),
          activeFraction:
            typeof row?.active_fraction === "string" &&
            row.active_fraction.trim()
              ? row.active_fraction.trim()
              : "0/1",
          todaySolvedProblems: getProblemLinks(
            row?.today_problem_titles,
            row?.today_problem_slugs,
            row?.today_problem_difficulties,
          ),
          userName:
            typeof row?.name === "string" && row.name.trim()
              ? row.name.trim()
              : typeof user.user_metadata?.name === "string"
                ? user.user_metadata.name
                : null,
          leetcodeUsername:
            typeof user.user_metadata?.leetcode_username === "string"
              ? user.user_metadata.leetcode_username
              : null,
        });
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load dashboard metrics right now.",
        );
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [loadFriendsStats]);

  const cards = useMemo(
    () => [
      {
        label: "Total Problems Solved",
        value: stats.totalSolved,
        subtitle: stats.leetcodeUsername
          ? `@${stats.leetcodeUsername}`
          : "Add LeetCode username on signup",
        accent: "blue" as const,
      },
      {
        label: "Problems Solved Today",
        value: stats.todaySolved,
        accent: "green" as const,
      },
      {
        label: "Problems Solved Since Signup",
        value: stats.problemsSolvedSinceSignup,
        accent: "rose" as const,
      },
      {
        label: "Daily Target",
        value: stats.dailyTarget,
        subtitle: "Problems/day",
        accent: "amber" as const,
      },
      {
        label: "Active Days",
        value: stats.activeFraction,
        subtitle: "Active days / total days",
        accent: "violet" as const,
      },
    ],
    [stats],
  );

  const focusSummary =
    stats.todaySolved >= stats.dailyTarget
      ? "You have already hit today's target."
      : `${Math.max(stats.dailyTarget - stats.todaySolved, 0)} more problem${
          Math.max(stats.dailyTarget - stats.todaySolved, 0) === 1 ? "" : "s"
        } to reach today's target.`;

  async function handleFriendSearch() {
    const query = searchTerm.trim();
    if (!query) {
      setSearchResults([]);
      setFriendError("Enter a name or LeetCode username.");
      setFriendMessage(null);
      return;
    }
    setSearchLoading(true);
    setFriendError(null);
    setFriendMessage(null);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, leetcode_username")
        .or(`name.ilike.%${query}%,leetcode_username.ilike.%${query}%`)
        .limit(10);
      if (error) throw error;
      let results = (data ?? []) as FriendSearchResult[];
      if (!results.length) {
        const { data: dailyStatUsers, error: dailyStatsError } = await supabase
          .from("daily_stats")
          .select("user_id, leetcode_username")
          .ilike("leetcode_username", `%${query}%`)
          .limit(10);
        if (dailyStatsError) throw dailyStatsError;
        const fallbackResults: FriendSearchResult[] = (dailyStatUsers ?? [])
          .map((row): FriendSearchResult | null => {
            const record = row as {
              user_id?: string;
              leetcode_username?: string | null;
            };
            if (!record.user_id) return null;
            return {
              id: record.user_id,
              name: null,
              leetcode_username: record.leetcode_username ?? null,
            };
          })
          .filter((item): item is FriendSearchResult => item !== null);
        const uniqueById = new Map<string, FriendSearchResult>();
        fallbackResults.forEach((item) => uniqueById.set(item.id, item));
        results = Array.from(uniqueById.values());
      }
      const filtered = currentUserId
        ? results.filter((item) => item.id !== currentUserId)
        : results;
      setSearchResults(filtered);
      if (!filtered.length) {
        setFriendMessage(
          "No users found. Ask your friend to log in once so their profile or stats are created.",
        );
      }
    } catch (error) {
      setFriendError(
        error instanceof Error ? error.message : "Failed to search users.",
      );
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleAddFriend(friendUserId: string) {
    if (!currentUserId) {
      setFriendError("You must be logged in to add friends.");
      return;
    }
    if (friendUserId === currentUserId) {
      setFriendError("You cannot add yourself as a friend.");
      return;
    }
    setAddingFriendId(friendUserId);
    setFriendError(null);
    setFriendMessage(null);
    try {
      const { error } = await supabase
        .from("friends")
        .upsert(
          { user_id: currentUserId, friend_user_id: friendUserId },
          { onConflict: "user_id,friend_user_id" },
        );
      if (error) {
        const { error: fallbackError } = await supabase
          .from("friends")
          .upsert(
            { user_id: currentUserId, friend_id: friendUserId },
            { onConflict: "user_id,friend_id" },
          );
        if (fallbackError) throw fallbackError;
      }
      setFriendMessage("Friend added successfully.");
      await loadFriendsStats(
        currentUserId,
        new Date().toISOString().slice(0, 10),
      );
    } catch (error) {
      setFriendError(
        error instanceof Error ? error.message : "Failed to add friend.",
      );
    } finally {
      setAddingFriendId(null);
    }
  }

  return (
    <div className="saas-shell min-h-screen px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="glass-card rounded-[2rem] p-5 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="eyebrow">TrackLeet</span>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Track momentum, not just totals.
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                Monitor today&apos;s pace, stay on target, and keep your
                progress visible in one responsive workspace.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[23rem]">
              <div className="rounded-[1.5rem] border border-white/70 bg-white/75 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Focus
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {focusSummary}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-950 p-4 text-white">
                <p className="text font-bold uppercase tracking-[0.18em] text-slate-050">
                  {stats.userName ?? "User"}
                </p>

                <p className="mt-2 text-lg font-semibold">
                  {stats.leetcodeUsername
                    ? `@${stats.leetcodeUsername}`
                    : "Add your username"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {errorMessage && (
          <div className="flex items-start gap-3 rounded-[1.5rem] border border-red-100 bg-red-50 px-4 py-3.5">
            <span className="mt-0.5 text-red-500">!</span>
            <p className="text-sm leading-6 text-red-700">{errorMessage}</p>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {cards.map((card) => (
            <MetricCard
              key={card.label}
              label={card.label}
              value={loading ? 0 : card.value}
              subtitle={card.subtitle}
              accent={card.accent}
            />
          ))}
        </section>
        <section className="surface-panel rounded-[2rem] p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xl font-bold uppercase tracking-[0.18em] text-slate-1000">
                Friends
              </p>
            </div>
          </div>

          {friendsStatsLoading && (
            <div className="mt-6 flex items-center gap-3 text-sm text-slate-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500" />
              Loading...
            </div>
          )}

          {!friendsStatsLoading && !friendsStats.length && (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-sm leading-7 text-slate-500">
              No friends yet. Add friends above to see their stats here.
            </div>
          )}

          {!friendsStatsLoading && friendsStats.length > 0 && (
            <>
              <div className="mt-6 hidden overflow-x-auto rounded-[1.5rem] border border-slate-100 bg-white xl:block">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Today</th>
                      <th className="px-4 py-3">Since signup</th>
                      <th className="px-4 py-3">Problems</th>
                      <th className="px-4 py-3">Active days</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {friendsStats.map((friend) => (
                      <tr
                        key={friend.id}
                        className="text-slate-800 transition hover:bg-slate-50/80"
                      >
                        <td className="px-4 py-4 font-medium">{friend.name}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                              friend.todaySolved > 0
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {friend.todaySolved}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-semibold text-rose-700">
                          {friend.problemsSolvedSinceSignup}
                        </td>
                        <td className="px-4 py-4">
                          {friend.todayProblems.length ? (
                            <div className="flex flex-wrap gap-2.5">
                              {friend.todayProblems.map((problem) => (
                                <a
                                  key={`${friend.id}-${problem.slug ?? "noslug"}-${problem.title}`}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-1000 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
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
                                  <DifficultyBadge
                                    difficulty={problem.difficulty}
                                  />
                                </a>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300">
                              No problems yet
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-semibold text-violet-700">
                            {friend.activeFraction}
                          </span>
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
                    className="rounded-[1.5rem] border border-white/70 bg-white/80 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          {friend.name}
                        </h3>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                          friend.todaySolved > 0
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {friend.todaySolved} today
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                          Active days
                        </p>
                        <p className="mt-2 text-xl font-semibold text-violet-700">
                          {friend.activeFraction}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                          Total Solved Since signup
                        </p>
                        <p className="mt-2 text-xl font-semibold text-rose-700">
                          {friend.problemsSolvedSinceSignup}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        Problems
                      </p>
                      {friend.todayProblems.length ? (
                        <div className="mt-2 flex flex-wrap gap-2.5">
                          {friend.todayProblems.map((problem) => (
                            <a
                              key={`${friend.id}-${problem.slug ?? "noslug"}-${problem.title}`}
                              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                              href={
                                problem.slug
                                  ? `https://leetcode.com/problems/${problem.slug}/`
                                  : undefined
                              }
                              target="_blank"
                              rel="noreferrer"
                            >
                              {problem.title}
                              <DifficultyBadge
                                difficulty={problem.difficulty}
                              />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-slate-500">
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

        <section className="surface-panel rounded-[2.3rem] p-6 sm:p-8">
          <div className="surface-panel rounded-[2rem] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Solved Today
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">
                  Accepted problems
                </h2>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                {stats.todaySolved} done
              </span>
            </div>

            {loading ? (
              <div className="mt-6 flex items-center gap-3 text-sm text-slate-500">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500" />
                Loading...
              </div>
            ) : !stats.todaySolvedProblems.length ? (
              <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-sm leading-7 text-slate-500">
                No accepted problems solved today.
              </div>
            ) : (
              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
                {stats.todaySolvedProblems.map((problem) => (
                  <li
                    key={`${problem.slug ?? "noslug"}-${problem.title}`}
                    className="rounded-[1.1rem] border border-slate-200/80 bg-white px-3.5 py-3 text-sm font-medium text-slate-700 shadow-sm sm:rounded-[1.25rem] sm:px-4"
                  >
                    <span className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                      <span className="flex min-w-0 flex-wrap items-center gap-2">
                        {problem.slug ? (
                          <a
                            href={`https://leetcode.com/problems/${problem.slug}/`}
                            target="_blank"
                            rel="noreferrer"
                            className="block min-w-0 rounded-md px-0.5 py-0.5 text-sky-700 underline decoration-sky-300 underline-offset-2 transition hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
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

        <section className="surface-panel rounded-[2rem] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Add Friend
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">
                Search by name or handle
              </h2>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFriendSearch()}
              placeholder="Jane or leetcode_handle"
              className="field-input w-full rounded-2xl px-4 py-3 text-sm"
            />
            <button
              type="button"
              onClick={handleFriendSearch}
              disabled={searchLoading}
              className="gradient-button rounded-2xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {searchLoading ? "Searching..." : "Search"}
            </button>
          </div>

          {friendError && (
            <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-3 py-3 text-sm text-red-600">
              {friendError}
            </p>
          )}
          {friendMessage && (
            <p className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
              {friendMessage}
            </p>
          )}

          {searchResults.length > 0 && (
            <div className="mt-5 space-y-3">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-3 rounded-[1.4rem] border border-white/70 bg-white/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {user.name || "Unnamed user"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {user.leetcode_username
                        ? `@${user.leetcode_username}`
                        : "No LeetCode username"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddFriend(user.id)}
                    disabled={addingFriendId === user.id}
                    className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {addingFriendId === user.id ? "Adding..." : "Add Friend"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
