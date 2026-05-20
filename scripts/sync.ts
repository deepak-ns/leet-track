import { createClient } from "@supabase/supabase-js";

const LEETCODE_BASE = process.env.LEETCODE_BASE_URL!;
const INDIA_TZ = "Asia/Kolkata";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function getDateIST(timestampSeconds: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(timestampSeconds * 1000));
}

function getTodayIST(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function fetchLeetCode<T>(path: string): Promise<T> {
  const res = await fetch(`${LEETCODE_BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`LeetCode API error ${res.status} for path: ${path}`);
  }
  return res.json() as Promise<T>;
}

type AcSubmission = {
  title: string;
  titleSlug: string;
  timestamp: string;
};

type AcSubmissionResponse = {
  count: number;
  submission: AcSubmission[];
};

type ProfileResponse = {
  totalSolved: number;
};

type QuestionResponse = {
  difficulty: string | null;
};

type SyncResult = {
  username: string;
  newProblems: number;
  error?: string;
};

async function syncUser(
  userId: string,
  username: string,
  dailyTarget: number,
): Promise<SyncResult> {
  try {
    // 1. Fetch the last 20 accepted submissions
    const submData = await fetchLeetCode<AcSubmissionResponse>(
      `/${encodeURIComponent(username)}/acSubmission`,
    );
    const submissions: AcSubmission[] = submData.submission ?? [];

    // 2. Fetch all existing solved problems for this user to check for duplicates
    const { data: existingRows } = await supabase
      .from("solved_problems")
      .select("problem_slug, solved_date")
      .eq("user_id", userId);

    const existingSet = new Set<string>(
      (existingRows ?? []).map(
        (r: { problem_slug: string | null; solved_date: string | null }) =>
          `${r.solved_date ?? ""}::${r.problem_slug ?? ""}`,
      ),
    );

    // 3. Filter submissions that are not yet in the DB
    const newSubmissions: Array<
      AcSubmission & { date: string; solvedAt: string }
    > = [];
    for (const sub of submissions) {
      const ts = parseInt(sub.timestamp, 10);
      if (isNaN(ts)) continue;
      const date = getDateIST(ts);
      const key = `${date}::${sub.titleSlug}`;
      if (!existingSet.has(key)) {
        newSubmissions.push({
          ...sub,
          date,
          solvedAt: new Date(ts * 1000).toISOString(),
        });
      }
    }

    // 4. For each new submission: fetch difficulty, then insert into solved_problems
    for (const sub of newSubmissions) {
      let difficulty: string | null = null;
      try {
        const qData = await fetchLeetCode<QuestionResponse>(
          `/select?titleSlug=${encodeURIComponent(sub.titleSlug)}`,
        );
        difficulty = qData.difficulty ?? null;
      } catch {
        // Continue without difficulty if the question API fails
      }

      await supabase.from("solved_problems").insert({
        user_id: userId,
        solved_date: sub.date,
        problem_slug: sub.titleSlug,
        problem_title: sub.title,
        problem_difficulty: difficulty,
        created_at: sub.solvedAt,
      });
    }

    // 4b. Backfill difficulty for any existing rows where it is NULL
    const { data: nullDiffRows } = await supabase
      .from("solved_problems")
      .select("id, problem_slug")
      .eq("user_id", userId)
      .is("problem_difficulty", null)
      .not("problem_slug", "is", null);

    for (const row of nullDiffRows ?? []) {
      const r = row as { id: string; problem_slug: string };
      try {
        const qData = await fetchLeetCode<QuestionResponse>(
          `/select?titleSlug=${encodeURIComponent(r.problem_slug)}`,
        );
        if (qData.difficulty) {
          await supabase
            .from("solved_problems")
            .update({ problem_difficulty: qData.difficulty })
            .eq("id", r.id);
        }
      } catch {
        // Skip if difficulty fetch fails
      }
    }

    // 5. Fetch total all-time solved from the LeetCode profile endpoint
    const profileData = await fetchLeetCode<ProfileResponse>(
      `/${encodeURIComponent(username)}/profile`,
    );
    const totalSolved = profileData.totalSolved ?? 0;

    // 6. Count today's solved problems from our DB
    const todayIST = getTodayIST();
    const { count: solvedToday } = await supabase
      .from("solved_problems")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("solved_date", todayIST);

    // 7. Upsert today's daily_stats row
    const statPayload = {
      user_id: userId,
      stat_date: todayIST,
      total_solved: totalSolved,
      solved_today: solvedToday ?? 0,
      daily_target: dailyTarget,
      leetcode_username: username,
    };

    const { data: existingStat } = await supabase
      .from("daily_stats")
      .select("id")
      .eq("user_id", userId)
      .eq("stat_date", todayIST)
      .maybeSingle();

    if (existingStat) {
      await supabase
        .from("daily_stats")
        .update(statPayload)
        .eq("user_id", userId)
        .eq("stat_date", todayIST);
    } else {
      await supabase.from("daily_stats").insert(statPayload);
    }

    return { username, newProblems: newSubmissions.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[sync] Failed to sync user ${username}:`, message);
    return { username, newProblems: 0, error: message };
  }
}

async function main() {
  console.log("[sync] Starting...");

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, leetcode_username, daily_target")
    .not("leetcode_username", "is", null)
    .neq("leetcode_username", "");

  if (error) {
    console.error("[sync] Failed to fetch profiles:", error.message);
    process.exit(1);
  }

  console.log(`[sync] Found ${profiles.length} users`);

  const results: SyncResult[] = await Promise.all(
    profiles.map((p) =>
      syncUser(p.id, p.leetcode_username as string, p.daily_target ?? 1),
    ),
  );

  console.log(
    "[sync] Complete:",
    JSON.stringify(
      { totalUsers: profiles.length, runAt: new Date().toISOString(), results },
      null,
      2,
    ),
  );
}

main();
