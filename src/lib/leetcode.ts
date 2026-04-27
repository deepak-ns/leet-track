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

export async function getQuestionBySlug<T = unknown>(titleSlug: string): Promise<T> {
  return fetchFromLeetcode<T>(`/select?titleSlug=${encodeURIComponent(titleSlug)}`);
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
  difficulty?: string | number;
  diff?: string | number;
  level?: string | number;
};

const FIXED_TIME_ZONE = "Asia/Kolkata";

function formatDateInTimeZone(date: Date, timeZone: string): string {
  // en-CA yields YYYY-MM-DD reliably.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

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
  const todayDate = formatDateInTimeZone(new Date(), FIXED_TIME_ZONE);

  const solvedToday = submissions.filter((submission) => {
    if (!isAccepted(submission)) {
      return false;
    }

    const timestampMs = getTimestampMs(submission);
    if (timestampMs === null) {
      return false;
    }

    const submissionDate = formatDateInTimeZone(new Date(timestampMs), FIXED_TIME_ZONE);
    return submissionDate === todayDate;
  }).length;

  return { solved_today: solvedToday };
}

export type SolvedTodayProblem = {
  slug: string;
  title: string;
  solvedAtMs: number;
  difficulty: "Easy" | "Medium" | "Hard" | null;
};

function normalizeDifficulty(value: unknown): "Easy" | "Medium" | "Hard" | null {
  if (typeof value === "number") {
    if (value === 1) return "Easy";
    if (value === 2) return "Medium";
    if (value === 3) return "Hard";
    return null;
  }
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "1" || normalized === "easy") return "Easy";
  if (normalized === "2" || normalized === "medium") return "Medium";
  if (normalized === "3" || normalized === "hard") return "Hard";
  return null;
}

function getSubmissionDifficulty(
  submission: SubmissionRecord,
): "Easy" | "Medium" | "Hard" | null {
  return (
    normalizeDifficulty(submission.difficulty) ??
    normalizeDifficulty(submission.diff) ??
    normalizeDifficulty(submission.level)
  );
}

type QuestionBySlugPayload = {
  difficulty?: string | number;
};

export async function resolveDifficultyBySlug(
  slug: string,
): Promise<"Easy" | "Medium" | "Hard" | null> {
  try {
    const payload = await getQuestionBySlug<QuestionBySlugPayload>(slug);
    return normalizeDifficulty(payload?.difficulty);
  } catch {
    return null;
  }
}

export async function hydrateProblemDifficulties(
  problems: SolvedTodayProblem[],
): Promise<SolvedTodayProblem[]> {
  const cache = new Map<string, Promise<"Easy" | "Medium" | "Hard" | null>>();

  async function getDifficulty(slug: string) {
    const existing = cache.get(slug);
    if (existing) return existing;
    const promise = resolveDifficultyBySlug(slug);
    cache.set(slug, promise);
    return promise;
  }

  const hydrated = await Promise.all(
    problems.map(async (problem) => {
      const difficulty = await getDifficulty(problem.slug);
      return {
        ...problem,
        difficulty: difficulty ?? problem.difficulty,
      };
    }),
  );

  return hydrated;
}

function getSubmissionSlug(submission: SubmissionRecord): string | null {
  const candidates = [
    submission.titleSlug,
    submission.questionSlug,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed) return trimmed;
    }
  }

  const title = getSubmissionTitle(submission);
  if (!title) return null;
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getSolvedTodayProblems(
  submissions: SubmissionRecord[],
  options: { limit?: number } = {},
): { problems: string[] } {
  const todayDate = formatDateInTimeZone(new Date(), FIXED_TIME_ZONE);
  const limit = Math.max(1, Math.trunc(options.limit ?? 20));

  const seen = new Set<string>();
  const titles: string[] = [];

  // Preserve ordering from the API (typically newest-first).
  for (const submission of submissions) {
    if (!isAccepted(submission)) {
      continue;
    }

    const timestampMs = getTimestampMs(submission);
    if (timestampMs === null) {
      continue;
    }
    const submissionDate = formatDateInTimeZone(new Date(timestampMs), FIXED_TIME_ZONE);
    if (submissionDate !== todayDate) continue;

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

export function getSolvedTodayProblemEntries(
  submissions: SubmissionRecord[],
  options: { limit?: number } = {},
): { problems: SolvedTodayProblem[] } {
  const todayDate = formatDateInTimeZone(new Date(), FIXED_TIME_ZONE);
  const limit = Math.max(1, Math.trunc(options.limit ?? 20));

  const seen = new Set<string>();
  const problems: SolvedTodayProblem[] = [];

  for (const submission of submissions) {
    if (!isAccepted(submission)) continue;

    const timestampMs = getTimestampMs(submission);
    if (timestampMs === null) continue;
    const submissionDate = formatDateInTimeZone(new Date(timestampMs), FIXED_TIME_ZONE);
    if (submissionDate !== todayDate) continue;

    const title = getSubmissionTitle(submission);
    const slug = getSubmissionSlug(submission);
    if (!title || !slug) continue;

    const key = `${slug}::${title}`;
    if (seen.has(key)) continue;
    seen.add(key);

    problems.push({
      slug,
      title,
      solvedAtMs: timestampMs,
      difficulty: getSubmissionDifficulty(submission),
    });
    if (problems.length >= limit) break;
  }

  return { problems };
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
