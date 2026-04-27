import type { User } from "@supabase/supabase-js";
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

export type SyncedDashboardStats = {
  totalSolved: number;
  todaySolved: number;
  todaySolvedProblems: string[];
  dailyTarget: number;
  backlog: number;
  streak: number;
  leetcodeUsername: string | null;
};

type DailyStatsLookupRow = {
  backlog?: number | string;
  streak?: number | string;
  stat_date?: string;
  date?: string;
  created_at?: string;
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

function getRowDate(row: DailyStatsLookupRow): string | undefined {
  return (
    row.stat_date ??
    row.date ??
    (typeof row.created_at === "string" ? row.created_at.slice(0, 10) : undefined)
  );
}

export async function syncUserStats(user: User): Promise<SyncedDashboardStats> {
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const leetcodeUsername =
    typeof metadata.leetcode_username === "string" ? metadata.leetcode_username : null;
  const dailyTarget = Math.max(1, toNumber(metadata.daily_target) ?? 1);
  const previousBacklog = Math.max(0, toNumber(metadata.backlog) ?? 0);
  const previousStreak = Math.max(0, toNumber(metadata.streak) ?? 0);
  const lastProgressDate =
    typeof metadata.last_progress_date === "string" ? metadata.last_progress_date : null;
  const todayDate = new Date().toISOString().slice(0, 10);

  if (!leetcodeUsername) {
    await saveDailyStats({
      userId: user.id,
      date: todayDate,
      totalSolved: 0,
      todaySolved: 0,
      todaySolvedProblems: [],
      dailyTarget,
      backlog: previousBacklog,
      streak: previousStreak,
      leetcodeUsername: null,
    });

    return {
      totalSolved: 0,
      todaySolved: 0,
      todaySolvedProblems: [],
      dailyTarget,
      backlog: previousBacklog,
      streak: previousStreak,
      leetcodeUsername: null,
    };
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

  const baselineDate =
    typeof metadata.baseline_date === "string" ? metadata.baseline_date : null;
  const hasBaselineBacklog = toNumber(metadata.baseline_backlog) !== null;
  const deficitNow = Math.max(dailyTarget - todaySolved, 0);
  const surplusNow = Math.max(todaySolved - dailyTarget, 0);

  let carryoverBacklog = previousBacklog;
  try {
    const { data: lastRows } = await supabase
      .from("daily_stats")
      .select("backlog, stat_date, date, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const rows = (lastRows ?? []) as DailyStatsLookupRow[];
    const yesterdayRow = rows.find((row) => {
      const rowDate = getRowDate(row);
      return rowDate !== undefined && rowDate < todayDate;
    });
    if (yesterdayRow) {
      carryoverBacklog = Math.max(0, toNumber(yesterdayRow.backlog) ?? previousBacklog);
    }
  } catch {
    // Fall back to auth metadata when the recent history query is unavailable.
  }

  const inferredBaselineBacklog =
    lastProgressDate === todayDate && !hasBaselineBacklog
      ? Math.max(carryoverBacklog, Math.max(previousBacklog + surplusNow - deficitNow, 0))
      : carryoverBacklog;
  const baselineBacklog =
    baselineDate === todayDate
      ? Math.max(0, toNumber(metadata.baseline_backlog) ?? inferredBaselineBacklog)
      : inferredBaselineBacklog;
  const baselineStreak =
    baselineDate === todayDate
      ? Math.max(0, toNumber(metadata.baseline_streak) ?? (previousStreak || fallbackStreak))
      : previousStreak || fallbackStreak;

  const progress = updateBacklogAndStreak({
    target: dailyTarget,
    solvedToday: todaySolved,
    previousBacklog: baselineBacklog,
    previousStreak: baselineStreak,
  });

  if (
    baselineDate !== todayDate ||
    progress.backlog !== previousBacklog ||
    progress.streak !== (previousStreak || fallbackStreak)
  ) {
    await supabase.auth.updateUser({
      data: {
        ...metadata,
        backlog: progress.backlog,
        streak: progress.streak,
        last_progress_date: todayDate,
        baseline_date: todayDate,
        baseline_backlog: baselineBacklog,
        baseline_streak: baselineStreak,
      },
    });
  }

  await saveDailyStats({
    userId: user.id,
    date: todayDate,
    totalSolved,
    todaySolved,
    todaySolvedProblems,
    dailyTarget,
    backlog: progress.backlog,
    streak: progress.streak,
    leetcodeUsername,
  });

  return {
    totalSolved,
    todaySolved,
    todaySolvedProblems,
    dailyTarget,
    backlog: progress.backlog,
    streak: progress.streak,
    leetcodeUsername,
  };
}
