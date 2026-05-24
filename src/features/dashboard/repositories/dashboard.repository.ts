import { supabase } from "@/shared/lib/supabase/client";

export type TodayProblemRow = {
  problem_title: string | null;
  problem_slug: string | null;
  problem_difficulty: string | null;
};

export type UserDashboardData = {
  name: string | null;
  leetcodeUsername: string | null;
  dailyTarget: number;
  totalSolved: number;
  solvedToday: number;
  todayProblems: TodayProblemRow[];
  sinceSignupCount: number;
  activeDays: number;
  totalTrackedDays: number;
};

export type FriendDashboardData = {
  userId: string;
  name: string | null;
  leetcodeUsername: string | null;
  solvedToday: number;
  todayProblems: TodayProblemRow[];
  sinceSignupCount: number;
  activeDays: number;
  totalTrackedDays: number;
};

/**
 * Returns the number of calendar days from the signup date up to and including today.
 * e.g. signed up yesterday → 2, signed up today → 1.
 */
function daysSinceSignup(createdAt: string | null): number {
  if (!createdAt) return 1;

  const signup = new Date(createdAt);
  const today = new Date();

  // Reset both to local midnight
  signup.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - signup.getTime();

  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

export async function getUserDashboardData(
  userId: string,
  today: string,
): Promise<UserDashboardData> {
  const [
    profileResult,
    latestStatResult,
    todayProblemsResult,
    allSolvedResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("name, leetcode_username, daily_target, created_at")
      .eq("id", userId)
      .maybeSingle(),

    // Get the most recent daily_stats row (not strictly today's).
    // total_solved is the LeetCode all-time count — we always want the latest available,
    // not 0 just because today's cron hasn't run yet.
    // We include stat_date so we can decide whether solved_today is current.
    supabase
      .from("daily_stats")
      .select("total_solved, solved_today, stat_date")
      .eq("user_id", userId)
      .order("stat_date", { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from("solved_problems")
      .select("problem_title, problem_slug, problem_difficulty")
      .eq("user_id", userId)
      .eq("solved_date", today),

    // Fetch all solved_problems rows with just solved_date.
    // We compute both sinceSignupCount (total rows) and activeDays (distinct dates)
    // from this single result — more accurate than daily_stats which only exists
    // since the cron started.
    supabase
      .from("solved_problems")
      .select("solved_date")
      .eq("user_id", userId),
  ]);

  const stat = latestStatResult.data;
  // Only treat solved_today as today's count if the latest row IS today's row.
  // If the cron hasn't run yet today, the latest row is from a previous day,
  // so solved_today for today is 0.
  const solvedToday = stat?.stat_date === today ? (stat.solved_today ?? 0) : 0;

  // Only count problems solved on or after the signup date.
  // The LeetCode API returns the last 20 submissions regardless of signup date,
  // so without this filter pre-signup solves would inflate both counts.
  const signupDate = profileResult.data?.created_at?.slice(0, 10) ?? "";
  const allSolvedDates = (allSolvedResult.data ?? [])
    .map((r: { solved_date: string | null }) => r.solved_date)
    .filter((d): d is string => !!d && d >= signupDate);
  const sinceSignupCount = allSolvedDates.length;
  const activeDays = new Set(allSolvedDates).size;

  return {
    name: profileResult.data?.name ?? null,
    leetcodeUsername: profileResult.data?.leetcode_username ?? null,
    dailyTarget: profileResult.data?.daily_target ?? 1,
    totalSolved: stat?.total_solved ?? 0,
    solvedToday,
    todayProblems: (todayProblemsResult.data ?? []) as TodayProblemRow[],
    sinceSignupCount,
    activeDays,
    totalTrackedDays: daysSinceSignup(profileResult.data?.created_at ?? null),
  };
}

export async function getFriendsDashboardData(
  friendIds: string[],
  today: string,
): Promise<FriendDashboardData[]> {
  if (!friendIds.length) return [];
  const last24HoursIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [
    profilesResult,
    todayStatsResult,
    todayProblemsResult,
    allSolvedResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, leetcode_username, created_at")
      .in("id", friendIds),

    supabase
      .from("daily_stats")
      .select("user_id, solved_today")
      .in("user_id", friendIds)
      .eq("stat_date", today),

    supabase
      .from("solved_problems")
      .select("user_id, problem_title, problem_slug, problem_difficulty, created_at")
      .in("user_id", friendIds)
      .gte("created_at", last24HoursIso),

    // Fetch all solved_problems with solved_date for these friends.
    // Used to compute both sinceSignupCount and activeDays per friend,
    // which is more accurate than counting daily_stats rows.
    supabase
      .from("solved_problems")
      .select("user_id, solved_date")
      .in("user_id", friendIds),
  ]);

  // Build a signup date map per friend so we can filter out pre-signup solves.
  // The LeetCode API returns the last 20 submissions regardless of signup date,
  // so without this filter pre-signup solves would inflate both counts.
  const signupDateByUser = new Map<string, string>();
  for (const row of profilesResult.data ?? []) {
    const r = row as { id: string; created_at: string | null };
    if (r.created_at) {
      signupDateByUser.set(r.id, r.created_at.slice(0, 10));
    }
  }

  // Count total rows per friend (sinceSignupCount) and
  // distinct solved_date values per friend (activeDays) from the same data,
  // only including problems solved on or after each friend's signup date.
  const sinceSignupCounts = new Map<string, number>();
  const activeDateSets = new Map<string, Set<string>>();

  for (const row of allSolvedResult.data ?? []) {
    const r = row as { user_id: string; solved_date: string | null };
    if (!r.solved_date) continue;
    const signupDate = signupDateByUser.get(r.user_id) ?? "";
    if (r.solved_date < signupDate) continue;
    sinceSignupCounts.set(
      r.user_id,
      (sinceSignupCounts.get(r.user_id) ?? 0) + 1,
    );
    if (!activeDateSets.has(r.user_id))
      activeDateSets.set(r.user_id, new Set());
    activeDateSets.get(r.user_id)!.add(r.solved_date);
  }

  // Group problems solved in the last 24 hours by user_id
  const problemsByUser = new Map<string, TodayProblemRow[]>();
  for (const row of todayProblemsResult.data ?? []) {
    const uid = (row as { user_id: string } & TodayProblemRow).user_id;
    if (!problemsByUser.has(uid)) problemsByUser.set(uid, []);
    problemsByUser.get(uid)!.push({
      problem_title: (row as TodayProblemRow & { user_id: string })
        .problem_title,
      problem_slug: (row as TodayProblemRow & { user_id: string }).problem_slug,
      problem_difficulty: (row as TodayProblemRow & { user_id: string })
        .problem_difficulty,
    });
  }

  // Map today's solved_today by user_id
  const todayStatByUser = new Map<string, number>();
  for (const row of todayStatsResult.data ?? []) {
    const r = row as { user_id: string; solved_today: number };
    todayStatByUser.set(r.user_id, r.solved_today ?? 0);
  }

  // Map profile info by id
  const profileById = new Map<
    string,
    {
      name: string | null;
      leetcode_username: string | null;
      created_at: string | null;
    }
  >();
  for (const row of profilesResult.data ?? []) {
    const r = row as {
      id: string;
      name: string | null;
      leetcode_username: string | null;
      created_at: string | null;
    };
    profileById.set(r.id, {
      name: r.name,
      leetcode_username: r.leetcode_username,
      created_at: r.created_at,
    });
  }

  return friendIds.map((friendId) => {
    const profile = profileById.get(friendId);
    return {
      userId: friendId,
      name: profile?.name ?? null,
      leetcodeUsername: profile?.leetcode_username ?? null,
      solvedToday: todayStatByUser.get(friendId) ?? 0,
      todayProblems: problemsByUser.get(friendId) ?? [],
      sinceSignupCount: sinceSignupCounts.get(friendId) ?? 0,
      activeDays: activeDateSets.get(friendId)?.size ?? 0,
      totalTrackedDays: daysSinceSignup(profile?.created_at ?? null),
    };
  });
}
