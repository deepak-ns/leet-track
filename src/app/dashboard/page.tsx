"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  extractSubmissionRecords,
  getAcceptedSubmissions,
  getSolvedTodayCount,
  getSolvedTodayProblems,
  updateBacklogAndStreak,
} from "@/lib/leetcode";
import { syncUserStats } from "@/lib/stats-sync";
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

type DailyStatsRow = {
  user_id?: string;
  stat_date?: string;
  date?: string;
  created_at?: string;
  total_solved?: number | string;
  solved_today?: number | string;
  today_solved?: number | string;
  today_solved_problems?: string[] | null;
  streak?: number | string;
  backlog?: number | string;
  daily_target?: number | string;
  leetcode_username?: string | null;
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

function getProblemTitles(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
}

function getRowDate(stat: DailyStatsRow): string | undefined {
  return (
    stat.stat_date ??
    stat.date ??
    (typeof stat.created_at === "string"
      ? stat.created_at.slice(0, 10)
      : undefined)
  );
}

async function getTodayDailyStatsRow(
  userId: string,
  todayDate: string,
): Promise<DailyStatsRow | null> {
  async function fetchUsingDateColumn(dateColumn: "stat_date" | "date") {
    const { data, error } = await supabase
      .from("daily_stats")
      .select("*")
      .eq("user_id", userId)
      .eq(dateColumn, todayDate)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as DailyStatsRow | null) ?? null;
  }

  try {
    return await fetchUsingDateColumn("stat_date");
  } catch (primaryError) {
    try {
      return await fetchUsingDateColumn("date");
    } catch (fallbackError) {
      const primaryMessage =
        primaryError instanceof Error ? primaryError.message : String(primaryError);
      const fallbackMessage =
        fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      throw new Error(
        `Failed to load today's stats row. Primary: ${primaryMessage}. Fallback: ${fallbackMessage}`,
      );
    }
  }
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

      const [
        { data: profiles, error: profilesError },
        { data: dailyStats, error: statsError },
      ] = await Promise.all([
        supabase.from("profiles").select("id, name").in("id", friendIds),
        supabase.from("daily_stats").select("*").in("user_id", friendIds),
      ]);
      if (profilesError) throw profilesError;
      if (statsError) throw statsError;

      const statsByUserId = new Map<string, DailyStatsRow>();
      const latestStatsByUserId = new Map<string, DailyStatsRow>();
      const previousStatsByUserId = new Map<string, DailyStatsRow>();
      const profileNamesByUserId = new Map<string, string>();

      (dailyStats ?? []).forEach((row) => {
        const stat = row as DailyStatsRow;
        const rowDate = getRowDate(stat);
        if (!stat.user_id || !rowDate) return;

        const latest = latestStatsByUserId.get(stat.user_id);
        const latestDate = latest ? getRowDate(latest) : undefined;
        if (!latestDate || rowDate > latestDate) {
          latestStatsByUserId.set(stat.user_id, stat);
        }

        if (stat.user_id && rowDate === date)
          statsByUserId.set(stat.user_id, stat);
        if (rowDate < date) {
          const previous = previousStatsByUserId.get(stat.user_id);
          const previousDate = previous ? getRowDate(previous) : undefined;
          if (!previousDate || rowDate > previousDate) {
            previousStatsByUserId.set(stat.user_id, stat);
          }
        }
      });

      (profiles ?? []).forEach((profile) => {
        const friend = profile as { id: string; name?: string | null };
        if (friend.name?.trim()) {
          profileNamesByUserId.set(friend.id, friend.name.trim());
        }
      });

      const rows = await Promise.all(
        friendIds.map(async (friendId) => {
          const stat = statsByUserId.get(friendId);
          const latestStat = latestStatsByUserId.get(friendId);
          const previousStat = previousStatsByUserId.get(friendId);
          const profileName = profileNamesByUserId.get(friendId);
          const leetcodeUsername =
            typeof stat?.leetcode_username === "string" &&
            stat.leetcode_username.trim()
              ? stat.leetcode_username.trim()
              : typeof latestStat?.leetcode_username === "string" &&
                  latestStat.leetcode_username.trim()
                ? latestStat.leetcode_username.trim()
                : null;

          const fallbackRow = {
            id: friendId,
            name:
              profileName ??
              (leetcodeUsername ? `@${leetcodeUsername}` : "Friend"),
            todaySolved:
              toNumber(stat?.solved_today ?? stat?.today_solved) ?? 0,
            streak: toNumber(stat?.streak ?? latestStat?.streak) ?? 0,
            backlog: toNumber(stat?.backlog ?? latestStat?.backlog) ?? 0,
            todaySolvedProblems: getProblemTitles(stat?.today_solved_problems),
          };
          if (!leetcodeUsername) {
            return fallbackRow;
          }

          try {
            const submissionsPayload =
              await getAcceptedSubmissions(leetcodeUsername);
            const submissions = extractSubmissionRecords(submissionsPayload);
            const todaySolved = getSolvedTodayCount(submissions).solved_today;
            const todaySolvedProblems = getSolvedTodayProblems(submissions, {
              limit: 12,
            }).problems;
            const progress = updateBacklogAndStreak({
              target: Math.max(
                1,
                toNumber(stat?.daily_target ?? latestStat?.daily_target) ?? 1,
              ),
              solvedToday: todaySolved,
              previousBacklog: Math.max(
                0,
                toNumber(previousStat?.backlog) ?? 0,
              ),
              previousStreak: Math.max(0, toNumber(previousStat?.streak) ?? 0),
            });

            return {
              ...fallbackRow,
              todaySolved,
              streak: progress.streak,
              backlog: progress.backlog,
              todaySolvedProblems,
            };
          } catch {
            return fallbackRow;
          }
        }),
      );
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

        const metadata = user.user_metadata as Record<string, unknown>;
        const todayDate = new Date().toISOString().slice(0, 10);
        await loadFriendsStats(user.id, todayDate);
        const todayRow = await getTodayDailyStatsRow(user.id, todayDate);

        if (todayRow) {
          const row = todayRow as DailyStatsRow;
          const todaySolved = toNumber(row.solved_today ?? row.today_solved) ?? 0;
          const todaySolvedProblems = getProblemTitles(row.today_solved_problems);

          if (todaySolved > 0 && todaySolvedProblems.length === 0) {
            const syncedStats = await syncUserStats(user);
            setStats(syncedStats);
          } else {
            setStats({
              totalSolved: toNumber(row.total_solved) ?? 0,
              todaySolved,
              todaySolvedProblems,
              dailyTarget: Math.max(
                1,
                toNumber(row.daily_target ?? metadata.daily_target) ?? 1,
              ),
              backlog: Math.max(0, toNumber(row.backlog) ?? 0),
              streak: Math.max(0, toNumber(row.streak) ?? 0),
              leetcodeUsername:
                typeof row.leetcode_username === "string"
                  ? row.leetcode_username
                  : typeof metadata.leetcode_username === "string"
                    ? metadata.leetcode_username
                    : null,
            });
          }
        } else {
          const syncedStats = await syncUserStats(user);
          setStats(syncedStats);
        }
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

  useEffect(() => {
    if (!currentUserId) return;

    const todayDate = new Date().toISOString().slice(0, 10);
    const channel = supabase
      .channel(`dashboard-live-${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_stats" },
        (payload) => {
          const changedUserId =
            typeof payload.new === "object" &&
            payload.new &&
            "user_id" in payload.new
              ? String((payload.new as { user_id?: string }).user_id ?? "")
              : typeof payload.old === "object" &&
                  payload.old &&
                  "user_id" in payload.old
                ? String((payload.old as { user_id?: string }).user_id ?? "")
                : "";

          if (!changedUserId) return;
          if (changedUserId === currentUserId) {
            void (async () => {
              const todayRow = await getTodayDailyStatsRow(
                currentUserId,
                todayDate,
              );
              if (!todayRow) return;

              const row = todayRow as DailyStatsRow;
              setStats((current) => ({
                ...current,
                totalSolved: toNumber(row.total_solved) ?? current.totalSolved,
                todaySolved:
                  toNumber(row.solved_today ?? row.today_solved) ??
                  current.todaySolved,
                todaySolvedProblems: getProblemTitles(
                  row.today_solved_problems,
                ),
                dailyTarget: Math.max(
                  1,
                  toNumber(row.daily_target) ?? current.dailyTarget,
                ),
                backlog: Math.max(0, toNumber(row.backlog) ?? current.backlog),
                streak: Math.max(0, toNumber(row.streak) ?? current.streak),
                leetcodeUsername:
                  typeof row.leetcode_username === "string"
                    ? row.leetcode_username
                    : current.leetcodeUsername,
              }));
            })();
            return;
          }

          if (friendIds.includes(changedUserId)) {
            void loadFriendsStats(currentUserId, todayDate);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friends" },
        (payload) => {
          const ownerId =
            typeof payload.new === "object" &&
            payload.new &&
            "user_id" in payload.new
              ? String((payload.new as { user_id?: string }).user_id ?? "")
              : typeof payload.old === "object" &&
                  payload.old &&
                  "user_id" in payload.old
                ? String((payload.old as { user_id?: string }).user_id ?? "")
                : "";

          if (ownerId === currentUserId) {
            void loadFriendsStats(currentUserId, todayDate);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, friendIds, loadFriendsStats]);

  const cards = useMemo(
    () => [
      {
        label: "Total Solved",
        value: stats.totalSolved,
        subtitle: stats.leetcodeUsername
          ? `@${stats.leetcodeUsername}`
          : "Add LeetCode username on signup",
        accent: "blue" as const,
      },
      {
        label: "Today Solved",
        value: stats.todaySolved,
        accent: "green" as const,
      },
      {
        label: "Remaining Today",
        value: Math.max(stats.dailyTarget - stats.todaySolved, 0),
        subtitle: `Target: ${stats.dailyTarget} problems/day`,
        accent: "amber" as const,
      },
      { label: "Backlog", value: stats.backlog, accent: "rose" as const },
      {
        label: "Streak",
        value: stats.streak,
        subtitle: "Active days streak",
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
              <span className="eyebrow">Dashboard</span>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Track momentum, not just totals.
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                Monitor today&apos;s pace, manage carryover backlog, and keep
                your progress visible in one responsive workspace.
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
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Handle
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {stats.leetcodeUsername
                    ? `@${stats.leetcodeUsername}`
                    : "Add your username"}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  LeetCode identity synced to dashboard
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

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
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
                Loading your stats...
              </div>
            ) : !stats.todaySolvedProblems.length ? (
              <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-sm leading-7 text-slate-500">
                No accepted problems solved today yet. Keep going.
              </div>
            ) : (
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {stats.todaySolvedProblems.map((title) => (
                  <li
                    key={title}
                    className="rounded-[1.25rem] border border-white/70 bg-white/75 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm"
                  >
                    <span className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                      <span>{title}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="surface-panel rounded-[2rem] p-5 sm:p-6">
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
          </div>
        </section>

        <section className="surface-panel rounded-[2rem] p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Friends
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">
                Leaderboard snapshot
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Compare today solved, streak, and backlog in one place.
              </p>
            </div>
          </div>

          {friendsStatsLoading && (
            <div className="mt-6 flex items-center gap-3 text-sm text-slate-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500" />
              Loading friend stats...
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
                      <th className="px-4 py-3">Problems</th>
                      <th className="px-4 py-3">Streak</th>
                      <th className="px-4 py-3">Backlog</th>
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
                        <td className="px-4 py-4">
                          {friend.todaySolvedProblems.length ? (
                            <div className="flex flex-wrap gap-1.5">
                              {friend.todaySolvedProblems.map((title) => (
                                <span
                                  key={`${friend.id}-${title}`}
                                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600"
                                  title={title}
                                >
                                  {title}
                                </span>
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
                            {friend.streak}
                          </span>
                          <span className="ml-1 text-xs text-slate-400">
                            days
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`font-semibold ${friend.backlog > 0 ? "text-rose-600" : "text-slate-500"}`}
                          >
                            {friend.backlog}
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
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">
                          Friend stats
                        </p>
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
                          Streak
                        </p>
                        <p className="mt-2 text-xl font-semibold text-violet-700">
                          {friend.streak}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                          Backlog
                        </p>
                        <p
                          className={`mt-2 text-xl font-semibold ${friend.backlog > 0 ? "text-rose-600" : "text-slate-500"}`}
                        >
                          {friend.backlog}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        Problems
                      </p>
                      {friend.todaySolvedProblems.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {friend.todaySolvedProblems.map((title) => (
                            <span
                              key={`${friend.id}-${title}`}
                              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600"
                            >
                              {title}
                            </span>
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
      </div>
    </div>
  );
}
