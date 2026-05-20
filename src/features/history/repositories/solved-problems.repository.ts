import type { SolvedProblemRow } from "@/shared/types/database";
import { supabase } from "@/shared/lib/supabase/client";

export async function getSolvedProblemsForUser(
  userId: string,
): Promise<SolvedProblemRow[]> {
  // Fetch signup date first so we can exclude problems solved before the user
  // joined the site. The LeetCode API backfills up to 20 past submissions
  // regardless of signup date, so this filter is necessary.
  const { data: profile } = await supabase
    .from("profiles")
    .select("created_at")
    .eq("id", userId)
    .maybeSingle();

  const signupDate = profile?.created_at?.slice(0, 10) ?? "";

  const { data, error } = await supabase
    .from("solved_problems")
    .select(
      "problem_title, problem_slug, problem_difficulty, solved_date, created_at",
    )
    .eq("user_id", userId)
    .gte("solved_date", signupDate)
    .order("solved_date", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data as SolvedProblemRow[] | null) ?? [];
}
