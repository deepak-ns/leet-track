import type { SolvedProblemRow } from "@/shared/types/database";
import { supabase } from "@/shared/lib/supabase/client";

export async function getSolvedProblemsForUser(
  userId: string,
): Promise<SolvedProblemRow[]> {
  const { data, error } = await supabase
    .from("solved_problems")
    .select(
      "problem_title, problem_slug, problem_difficulty, solved_date, created_at",
    )
    .eq("user_id", userId)
    .order("solved_date", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data as SolvedProblemRow[] | null) ?? [];
}

