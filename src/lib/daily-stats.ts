import { supabase } from "@/lib/supabase";

export type SaveDailyStatsInput = {
  userId: string;
  date: string;
  totalSolved: number;
  todaySolved: number;
  todaySolvedProblems?: string[];
  dailyTarget: number;
  backlog: number;
  streak: number;
  leetcodeUsername: string | null;
};

export async function saveDailyStats({
  userId,
  date,
  totalSolved,
  todaySolved,
  todaySolvedProblems,
  dailyTarget,
  backlog,
  streak,
  leetcodeUsername,
}: SaveDailyStatsInput): Promise<void> {
  const payloadBase = {
    user_id: userId,
    total_solved: totalSolved,
    solved_today: todaySolved,
    daily_target: dailyTarget,
    backlog,
    streak,
    leetcode_username: leetcodeUsername,
    today_solved_problems: todaySolvedProblems,
  };

  async function saveUsingDateColumn(
    dateColumn: "stat_date" | "date",
    includeSolvedProblems: boolean,
  ) {
    const payloadWithoutOptionalProblems = {
      user_id: payloadBase.user_id,
      total_solved: payloadBase.total_solved,
      solved_today: payloadBase.solved_today,
      daily_target: payloadBase.daily_target,
      backlog: payloadBase.backlog,
      streak: payloadBase.streak,
      leetcode_username: payloadBase.leetcode_username,
    };
    const payload = {
      ...(includeSolvedProblems ? payloadBase : payloadWithoutOptionalProblems),
      [dateColumn]: date,
    };

    const { data: existingRow, error: existingRowError } = await supabase
      .from("daily_stats")
      .select("user_id")
      .eq("user_id", userId)
      .eq(dateColumn, date)
      .maybeSingle();

    if (existingRowError) {
      throw new Error(
        `Failed to check existing daily stats row: ${existingRowError.message}`,
      );
    }

    if (existingRow) {
      const { error: updateError } = await supabase
        .from("daily_stats")
        .update(payload)
        .eq("user_id", userId)
        .eq(dateColumn, date);

      if (updateError) {
        throw new Error(`Failed to update daily stats: ${updateError.message}`);
      }
      return;
    }

    const { error: insertError } = await supabase.from("daily_stats").insert(payload);
    if (insertError) {
      throw new Error(`Failed to insert daily stats: ${insertError.message}`);
    }
  }

  async function saveWithCompatibility(dateColumn: "stat_date" | "date") {
    try {
      await saveUsingDateColumn(dateColumn, true);
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      const mentionsMissingProblemsColumn =
        message.includes("today_solved_problems") &&
        (message.includes("column") || message.includes("schema cache"));
      if (!mentionsMissingProblemsColumn) {
        throw error;
      }

      await saveUsingDateColumn(dateColumn, false);
    }
  }

  try {
    await saveWithCompatibility("stat_date");
  } catch (primaryError) {
    try {
      await saveWithCompatibility("date");
    } catch (fallbackError) {
      const primaryMessage =
        primaryError instanceof Error ? primaryError.message : String(primaryError);
      const fallbackMessage =
        fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      throw new Error(
        `Failed to save daily stats with compatible date columns. Primary: ${primaryMessage}. Fallback: ${fallbackMessage}`,
      );
    }
  }
}
