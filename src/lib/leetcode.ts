const LEETCODE_API_BASE_URL = "https://alfa-leetcode-api.onrender.com";

type FetchOptions = {
  revalidateSeconds?: number;
};

async function fetchFromLeetcode<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const response = await fetch(`${LEETCODE_API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
    },
    next: options.revalidateSeconds
      ? { revalidate: options.revalidateSeconds }
      : undefined,
  });

  if (!response.ok) {
    throw new Error(
      `LeetCode API request failed (${response.status} ${response.statusText}) for ${path}`,
    );
  }

  return (await response.json()) as T;
}

export async function getProfile<T = unknown>(username: string): Promise<T> {
  return fetchFromLeetcode<T>(`/userProfile/${encodeURIComponent(username)}`);
}

export async function getSolved<T = unknown>(username: string): Promise<T> {
  return fetchFromLeetcode<T>(`/${encodeURIComponent(username)}/solved`);
}

export async function getAcceptedSubmissions<T = unknown>(
  username: string,
): Promise<T> {
  return fetchFromLeetcode<T>(`/${encodeURIComponent(username)}/acSubmission`);
}

export async function getCalendar<T = unknown>(username: string): Promise<T> {
  return fetchFromLeetcode<T>(`/${encodeURIComponent(username)}/calendar`);
}

export type SubmissionRecord = {
  timestamp?: number | string;
  time?: number | string;
  submittedAt?: number | string;
  createdAt?: number | string;
  statusDisplay?: string;
  status?: string;
  title?: string;
  titleSlug?: string;
  questionTitle?: string;
  questionSlug?: string;
  problemTitle?: string;
  name?: string;
};

function getTimestampMs(submission: SubmissionRecord): number | null {
  const rawTimestamp =
    submission.timestamp ??
    submission.time ??
    submission.submittedAt ??
    submission.createdAt;

  if (rawTimestamp === undefined) {
    return null;
  }

  if (typeof rawTimestamp === "number" && Number.isFinite(rawTimestamp)) {
    return rawTimestamp < 1_000_000_000_000 ? rawTimestamp * 1000 : rawTimestamp;
  }

  if (typeof rawTimestamp === "string") {
    const numericTimestampPattern = /^\d+$/;
    if (numericTimestampPattern.test(rawTimestamp.trim())) {
      const asNumber = Number.parseInt(rawTimestamp, 10);
      return asNumber < 1_000_000_000_000 ? asNumber * 1000 : asNumber;
    }

    const parsedDate = Date.parse(rawTimestamp);
    return Number.isNaN(parsedDate) ? null : parsedDate;
  }

  return null;
}

function isAccepted(submission: SubmissionRecord): boolean {
  const statusText = (submission.statusDisplay ?? submission.status ?? "")
    .toString()
    .toLowerCase();

  if (!statusText) {
    // The /acSubmission endpoint already returns accepted submissions.
    return true;
  }

  return statusText.includes("accepted") || statusText === "ac";
}

function getSubmissionTitle(submission: SubmissionRecord): string | null {
  const candidates = [
    submission.title,
    submission.questionTitle,
    submission.problemTitle,
    submission.name,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }

  return null;
}

export function getSolvedTodayCount(submissions: SubmissionRecord[]): {
  solved_today: number;
} {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd = todayStart + 24 * 60 * 60 * 1000;

  const solvedToday = submissions.filter((submission) => {
    if (!isAccepted(submission)) {
      return false;
    }

    const timestampMs = getTimestampMs(submission);
    if (timestampMs === null) {
      return false;
    }

    return timestampMs >= todayStart && timestampMs < todayEnd;
  }).length;

  return { solved_today: solvedToday };
}

export function getSolvedTodayProblems(
  submissions: SubmissionRecord[],
  options: { limit?: number } = {},
): { problems: string[] } {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd = todayStart + 24 * 60 * 60 * 1000;
  const limit = Math.max(1, Math.trunc(options.limit ?? 20));

  const seen = new Set<string>();
  const titles: string[] = [];

  // Preserve ordering from the API (typically newest-first).
  for (const submission of submissions) {
    if (!isAccepted(submission)) {
      continue;
    }

    const timestampMs = getTimestampMs(submission);
    if (timestampMs === null || timestampMs < todayStart || timestampMs >= todayEnd) {
      continue;
    }

    const title = getSubmissionTitle(submission);
    if (!title) {
      continue;
    }

    if (seen.has(title)) {
      continue;
    }

    seen.add(title);
    titles.push(title);

    if (titles.length >= limit) {
      break;
    }
  }

  return { problems: titles };
}

export function extractSubmissionRecords(payload: unknown): SubmissionRecord[] {
  if (Array.isArray(payload)) {
    return payload as SubmissionRecord[];
  }

  if (typeof payload !== "object" || payload === null) {
    return [];
  }

  const source = payload as Record<string, unknown>;
  const candidateKeys = [
    "submission",
    "submissions",
    "recentAcSubmissionList",
    "data",
    "list",
  ];

  for (const key of candidateKeys) {
    const value = source[key];
    if (Array.isArray(value)) {
      return value as SubmissionRecord[];
    }
  }

  return [];
}

export type BacklogUpdateInput = {
  target: number;
  solvedToday: number;
  previousBacklog: number;
  previousStreak: number;
};

export type BacklogUpdateResult = {
  backlog: number;
  streak: number;
  solved_today: number;
};

export function updateBacklogAndStreak({
  target,
  solvedToday,
  previousBacklog,
  previousStreak,
}: BacklogUpdateInput): BacklogUpdateResult {
  const normalizedTarget = Math.max(1, Math.trunc(target));
  const normalizedSolvedToday = Math.max(0, Math.trunc(solvedToday));
  const normalizedPreviousBacklog = Math.max(0, Math.trunc(previousBacklog));
  const normalizedPreviousStreak = Math.max(0, Math.trunc(previousStreak));

  const deficit = Math.max(normalizedTarget - normalizedSolvedToday, 0);
  const surplus = Math.max(normalizedSolvedToday - normalizedTarget, 0);

  // If solved exceeds target, consume older backlog first.
  const backlogAfterSurplus = Math.max(normalizedPreviousBacklog - surplus, 0);
  const backlog = backlogAfterSurplus + deficit;

  const streak =
    normalizedSolvedToday >= normalizedTarget
      ? normalizedPreviousStreak + 1
      : 0;

  return {
    backlog,
    streak,
    solved_today: normalizedSolvedToday,
  };
}
