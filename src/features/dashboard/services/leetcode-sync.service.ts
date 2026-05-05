import type { User } from "@supabase/supabase-js";
import type {
  DashboardStatsViewModel,
  LeetCodeSyncInput,
} from "@/shared/types/domain";
import { getTodayDateKey } from "@/shared/utils/date";
import { normalizePositiveInteger } from "@/shared/utils/number";
import { supabase } from "@/shared/lib/supabase/client";
import {
  extractSubmissionRecords,
  getAcceptedSubmissions,
  getSolved,
  getSolvedTodayCount,
  getSolvedTodayProblemEntries,
  getSolvedTodayProblems,
  getTotalSolved,
  hydrateProblemDifficulties,
} from "@/features/leetcode/service";
import { saveDailyStats } from "@/features/dashboard/repositories/daily-stats.repository";
import { getUserDashboardStats } from "@/features/dashboard/repositories/dashboard.repository";
import { mapDashboardRowToViewModel } from "@/features/dashboard/services/dashboard.mapper";

export async function syncLeetcodeStatsForUserId(
  input: LeetCodeSyncInput,
): Promise<void> {
  const todayDate = getTodayDateKey();

  const [solvedPayload, submissionsPayload] = await Promise.all([
    getSolved(input.leetcodeUsername),
    getAcceptedSubmissions(input.leetcodeUsername),
  ]);

  const totalSolved = getTotalSolved(solvedPayload);
  const submissionRecords = extractSubmissionRecords(submissionsPayload);
  const todaySolved = getSolvedTodayCount(submissionRecords).solved_today;
  const todaySolvedProblemEntries = getSolvedTodayProblemEntries(
    submissionRecords,
    { limit: 50 },
  ).problems;
  const problemsWithDifficulty = await hydrateProblemDifficulties(
    todaySolvedProblemEntries,
  );

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
    dailyTarget: normalizePositiveInteger(input.dailyTarget, 1),
    leetcodeUsername: input.leetcodeUsername,
  });
}

export async function syncUserStats(
  user: User,
): Promise<DashboardStatsViewModel> {
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const leetcodeUsername =
    typeof metadata.leetcode_username === "string"
      ? metadata.leetcode_username
      : null;
  const dailyTarget = normalizePositiveInteger(metadata.daily_target, 1);
  const todayDate = getTodayDateKey();

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
      problemsSolvedSinceSignup: 0,
      dailyTarget,
      activeFraction: "0/1",
      todaySolvedProblems: [],
      userName: typeof metadata.name === "string" ? metadata.name : null,
      leetcodeUsername: null,
    };
  }

  await syncLeetcodeStatsForUserId({
    userId: user.id,
    leetcodeUsername,
    dailyTarget,
  });

  const dashboardRow = await getUserDashboardStats(user.id);
  if (dashboardRow) {
    return mapDashboardRowToViewModel(dashboardRow, user);
  }

  const submissionsPayload = await getAcceptedSubmissions(leetcodeUsername);
  const submissionRecords = extractSubmissionRecords(submissionsPayload);

  return {
    totalSolved: 0,
    todaySolved: getSolvedTodayCount(submissionRecords).solved_today,
    problemsSolvedSinceSignup: 0,
    dailyTarget,
    activeFraction: "0/1",
    todaySolvedProblems: getSolvedTodayProblems(submissionRecords, { limit: 12 })
      .problems
      .map((title) => ({ title, slug: null, difficulty: null })),
    userName: typeof metadata.name === "string" ? metadata.name : null,
    leetcodeUsername,
  };
}
