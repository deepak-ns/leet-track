import type {
  DashboardStatsViewModel,
  FriendStatsViewModel,
  ProblemLink,
} from "@/shared/types/domain";
import type {
  TodayProblemRow,
  UserDashboardData,
  FriendDashboardData,
} from "@/features/dashboard/repositories/dashboard.repository";
import { normalizeDifficulty } from "@/shared/utils/difficulty";
import { toSlugFromTitle } from "@/shared/utils/slug";

function mapToProblems(rows: TodayProblemRow[]): ProblemLink[] {
  return rows.map((row) => ({
    title: row.problem_title ?? "Unknown",
    slug:
      typeof row.problem_slug === "string" && row.problem_slug.trim()
        ? row.problem_slug.trim()
        : typeof row.problem_title === "string" && row.problem_title.trim()
          ? toSlugFromTitle(row.problem_title.trim())
          : null,
    difficulty: normalizeDifficulty(row.problem_difficulty),
  }));
}

export function mapUserDataToViewModel(
  data: UserDashboardData,
  userMetaName: string | null,
): DashboardStatsViewModel {
  return {
    totalSolved: data.totalSolved,
    todaySolved: data.solvedToday,
    problemsSolvedSinceSignup: data.sinceSignupCount,
    dailyTarget: data.dailyTarget,
    activeFraction: `${data.activeDays}/${data.totalTrackedDays}`,
    todaySolvedProblems: mapToProblems(data.todayProblems),
    userName: data.name ?? userMetaName,
    leetcodeUsername: data.leetcodeUsername,
  };
}

export function mapFriendDataToViewModel(
  data: FriendDashboardData,
): FriendStatsViewModel {
  return {
    id: data.userId,
    name: data.name ?? "Friend",
    todaySolved: data.solvedToday,
    problemsSolvedSinceSignup: data.sinceSignupCount,
    todayProblems: mapToProblems(data.todayProblems),
    activeFraction: `${data.activeDays}/${data.totalTrackedDays}`,
    leetcodeUsername: data.leetcodeUsername,
  };
}
