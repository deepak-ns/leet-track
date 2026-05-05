import type { User } from "@supabase/supabase-js";
import type {
  DashboardStatsViewModel,
  FriendStatsViewModel,
} from "@/shared/types/domain";
import type {
  FriendDailyStatsRow,
  FriendProfileRow,
  UserDashboardStatsRow,
} from "@/shared/types/database";
import { normalizePositiveInteger, toNumber } from "@/shared/utils/number";
import { mapProblemLinks } from "@/shared/utils/problem-links";

function getPreferredUsername(
  profile: FriendProfileRow | undefined,
  fallbackStat: FriendDailyStatsRow | undefined,
): string | null {
  const fromProfile =
    typeof profile?.leetcode_username === "string" &&
    profile.leetcode_username.trim()
      ? profile.leetcode_username.trim()
      : null;
  const fromDailyStats =
    typeof fallbackStat?.leetcode_username === "string" &&
    fallbackStat.leetcode_username.trim()
      ? fallbackStat.leetcode_username.trim()
      : null;

  return fromProfile ?? fromDailyStats;
}

export function mapDashboardRowToViewModel(
  row: UserDashboardStatsRow | null,
  user: User,
): DashboardStatsViewModel {
  return {
    totalSolved: toNumber(row?.total_solved) ?? 0,
    todaySolved: toNumber(row?.solved_today) ?? 0,
    problemsSolvedSinceSignup: toNumber(row?.problems_solved_since_signup) ?? 0,
    dailyTarget: normalizePositiveInteger(row?.daily_target, 1),
    activeFraction:
      typeof row?.active_fraction === "string" && row.active_fraction.trim()
        ? row.active_fraction.trim()
        : "0/1",
    todaySolvedProblems: mapProblemLinks(
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
  };
}

export function mapFriendStatsToViewModel(input: {
  friendId: string;
  stat: UserDashboardStatsRow | null;
  profile?: FriendProfileRow;
  fallbackStat?: FriendDailyStatsRow;
}): FriendStatsViewModel {
  return {
    id: input.friendId,
    name:
      (typeof input.stat?.name === "string" && input.stat.name.trim()
        ? input.stat.name.trim()
        : null) ?? "Friend",
    todaySolved: toNumber(input.stat?.solved_today) ?? 0,
    problemsSolvedSinceSignup:
      toNumber(input.stat?.problems_solved_since_signup) ?? 0,
    todayProblems: mapProblemLinks(
      input.stat?.today_problem_titles,
      input.stat?.today_problem_slugs,
      input.stat?.today_problem_difficulties,
    ),
    activeFraction:
      typeof input.stat?.active_fraction === "string" &&
      input.stat.active_fraction.trim()
        ? input.stat.active_fraction.trim()
        : "0/1",
    leetcodeUsername: getPreferredUsername(input.profile, input.fallbackStat),
  };
}

export function getFriendTarget(
  profile?: FriendProfileRow,
  fallbackStat?: FriendDailyStatsRow,
): number {
  return normalizePositiveInteger(
    profile?.daily_target ?? fallbackStat?.daily_target,
    1,
  );
}

export function getFriendUsername(
  profile?: FriendProfileRow,
  fallbackStat?: FriendDailyStatsRow,
): string | null {
  return getPreferredUsername(profile, fallbackStat);
}

