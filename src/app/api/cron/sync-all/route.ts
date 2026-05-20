import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { createServiceClient } from "@/shared/lib/supabase/service-client";

// Allow up to 60s execution on Vercel (default is 10s on Hobby).
// Increase to 300 on Pro plan if needed.
export const maxDuration = 60;

const LEETCODE_BASE = "http://localhost:3000";
const INDIA_TZ = "Asia/Kolkata";

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
    cache: "no-store",
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
  supabase: ReturnType<typeof createServiceClient>,
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
          // Convert Unix seconds to ISO string so the DB stores the real solve
          // time instead of defaulting to the moment the cron ran.
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

    // 4b. Backfill difficulty for any existing rows where it is NULL.
    // This handles problems that were inserted when the difficulty API was down.
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
        // Skip if difficulty fetch fails; it will be retried on the next cron run
      }
    }

    // 5. Fetch total all-time solved from the LeetCode profile endpoint
    const profileData = await fetchLeetCode<ProfileResponse>(
      `/${encodeURIComponent(username)}/profile`,
    );
    const totalSolved = profileData.totalSolved ?? 0;

    // 6. Count today's solved problems from our DB (source of truth for solved_today)
    const todayIST = getTodayIST();
    const { count: solvedToday } = await supabase
      .from("solved_problems")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("solved_date", todayIST);

    // 7. Upsert today's daily_stats row (check-then-update-or-insert)
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
    console.error(`[cron] Failed to sync user ${username}:`, message);
    return { username, newProblems: 0, error: message };
  }
}

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Schedule the actual sync work to run AFTER the response is sent.
  // This way cronjob.org gets an instant 200 OK and never times out,
  // while Vercel keeps the function alive to complete the background work.
  after(async () => {
    const supabase = createServiceClient();

    // Fetch all registered users who have a LeetCode username
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, leetcode_username, daily_target")
      .not("leetcode_username", "is", null)
      .neq("leetcode_username", "");

    if (error) {
      console.error("[cron] Failed to fetch profiles:", error.message);
      return;
    }

    // Process all users concurrently to minimize total wall-clock time
    const results: SyncResult[] = await Promise.all(
      profiles.map((p) =>
        syncUser(
          supabase,
          p.id,
          p.leetcode_username as string,
          p.daily_target ?? 1,
        ),
      ),
    );

    const summary = {
      totalUsers: profiles.length,
      runAt: new Date().toISOString(),
      results,
    };

    console.log("[cron/sync-all] Run complete:", JSON.stringify(summary));
  });

  // Respond immediately so cronjob.org sees a fast 200 OK
  return NextResponse.json(
    { status: "accepted", message: "Sync started in background" },
    { status: 200 },
  );
}
