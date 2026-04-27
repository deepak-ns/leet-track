import type { User } from "@supabase/supabase-js";
import {
  extractSubmissionRecords,
  getAcceptedSubmissions,
  getSolved,
  getSolvedTodayCount,
  getSolvedTodayProblemEntries,
  getSolvedTodayProblems,
  hydrateProblemDifficulties,
} from "@/lib/leetcode";
import { saveDailyStats } from "@/lib/daily-stats";
import { supabase } from "@/lib/supabase";

const FIXED_TIME_ZONE = "Asia/Kolkata";

function formatDateInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export type SyncedDashboardStats = {
  totalSolved: number;
  todaySolved: number;
  todaySolvedProblems: string[];
  dailyTarget: number;
  leetcodeUsername: string | null;
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

export async function syncLeetcodeStatsForUserId(input: {
  userId: string;
  leetcodeUsername: string;
  dailyTarget: number;
}): Promise<void> {
  const todayDate = formatDateInTimeZone(new Date(), FIXED_TIME_ZONE);

  const [solvedPayload, submissionsPayload] = await Promise.all([
    getSolved(input.leetcodeUsername),
    getAcceptedSubmissions(input.leetcodeUsername),
  ]);

  const totalSolved = getTotalSolved(solvedPayload);
  const submissionRecords = extractSubmissionRecords(submissionsPayload);
  const todaySolved = getSolvedTodayCount(submissionRecords).solved_today;
  const todaySolvedProblemEntries = getSolvedTodayProblemEntries(submissionRecords, {
    limit: 50,
  }).problems;
  const problemsWithDifficulty = await hydrateProblemDifficulties(todaySolvedProblemEntries);

  // Persist today's solved problems (deduped by unique constraint).
  if (problemsWithDifficulty.length > 0) {
    const rows = problemsWithDifficulty.map((problem) => ({
      user_id: input.userId,
      solved_date: todayDate,
      problem_slug: problem.slug,
      problem_title: problem.title,
      problem_difficulty: problem.difficulty,
      created_at: new Date(problem.solvedAtMs).toISOString(),
    }));

    await supabase
      .from("solved_problems")
      .upsert(rows, { onConflict: "user_id,solved_date,problem_slug" });
  }

  await saveDailyStats({
    userId: input.userId,
    date: todayDate,
    totalSolved,
    todaySolved,
    dailyTarget: Math.max(1, Math.trunc(input.dailyTarget)),
    leetcodeUsername: input.leetcodeUsername,
  });
}

export async function syncUserStats(user: User): Promise<SyncedDashboardStats> {
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const leetcodeUsername =
    typeof metadata.leetcode_username === "string" ? metadata.leetcode_username : null;
  const dailyTarget = Math.max(1, toNumber(metadata.daily_target) ?? 1);
  const todayDate = formatDateInTimeZone(new Date(), FIXED_TIME_ZONE);

  if (!leetcodeUsername) {
    await saveDailyStats({
      userId: user.id,
      date: todayDate,
      totalSolved: 0,
      todaySolved: 0,
      dailyTarget,
      leetcodeUsername: null,
    });

    return {
      totalSolved: 0,
      todaySolved: 0,
      todaySolvedProblems: [],
      dailyTarget,
      leetcodeUsername: null,
    };
  }

  await syncLeetcodeStatsForUserId({
    userId: user.id,
    leetcodeUsername,
    dailyTarget,
  });

  const submissionsPayload = await getAcceptedSubmissions(leetcodeUsername);
  const submissionRecords = extractSubmissionRecords(submissionsPayload);
  const todaySolvedProblems = getSolvedTodayProblems(submissionRecords, { limit: 12 }).problems;

  return {
    totalSolved: 0,
    todaySolved: getSolvedTodayCount(submissionRecords).solved_today,
    todaySolvedProblems,
    dailyTarget,
    leetcodeUsername,
  };
}
