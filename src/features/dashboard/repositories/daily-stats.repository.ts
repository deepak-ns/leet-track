import { supabase } from "@/shared/lib/supabase/client";

export type SaveDailyStatsInput = {
  userId: string;
  date: string;
  totalSolved: number;
  todaySolved: number;
  dailyTarget: number;
  leetcodeUsername: string | null;
};

async function saveUsingDateColumn(
  payloadBase: Omit<SaveDailyStatsInput, "date">,
  date: string,
  dateColumn: "stat_date" | "date",
): Promise<void> {
  const payload = {
    user_id: payloadBase.userId,
    total_solved: payloadBase.totalSolved,
    solved_today: payloadBase.todaySolved,
    daily_target: payloadBase.dailyTarget,
    leetcode_username: payloadBase.leetcodeUsername,
    [dateColumn]: date,
  };

  const { data: existingRow, error: existingRowError } = await supabase
    .from("daily_stats")
    .select("user_id")
    .eq("user_id", payloadBase.userId)
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
      .eq("user_id", payloadBase.userId)
      .eq(dateColumn, date);

    if (updateError) {
      throw new Error(`Failed to update daily stats: ${updateError.message}`);
    }
    return;
  }

  const { error: insertError } = await supabase
    .from("daily_stats")
    .insert(payload);
  if (insertError) {
    throw new Error(`Failed to insert daily stats: ${insertError.message}`);
  }
}

export async function saveDailyStats(input: SaveDailyStatsInput): Promise<void> {
  try {
    await saveUsingDateColumn(input, input.date, "stat_date");
  } catch (primaryError) {
    try {
      await saveUsingDateColumn(input, input.date, "date");
    } catch (fallbackError) {
      const primaryMessage =
        primaryError instanceof Error ? primaryError.message : String(primaryError);
      const fallbackMessage =
        fallbackError instanceof Error
          ? fallbackError.message
          : String(fallbackError);
      throw new Error(
        `Failed to save daily stats with compatible date columns. Primary: ${primaryMessage}. Fallback: ${fallbackMessage}`,
      );
    }
  }
}

