import type { UserDashboardStatsRow } from "@/shared/types/database";
import { supabase } from "@/shared/lib/supabase/client";

const DASHBOARD_SELECT =
  "user_id, name, total_solved, daily_target, solved_today, today_problem_titles, today_problem_slugs, today_problem_difficulties, problems_solved_since_signup, active_fraction";

export async function getUserDashboardStats(
  userId: string,
): Promise<UserDashboardStatsRow | null> {
  const { data, error } = await supabase
    .from("user_dashboard_stats")
    .select(DASHBOARD_SELECT)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as UserDashboardStatsRow | null) ?? null;
}

export async function getUsersDashboardStats(
  userIds: string[],
): Promise<UserDashboardStatsRow[]> {
  if (!userIds.length) {
    return [];
  }

  const { data, error } = await supabase
    .from("user_dashboard_stats")
    .select(DASHBOARD_SELECT)
    .in("user_id", userIds);

  if (error) {
    throw error;
  }

  return (data as UserDashboardStatsRow[] | null) ?? [];
}

