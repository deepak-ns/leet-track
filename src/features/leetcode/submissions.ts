import type {
  NormalizedSubmissionRecord,
  ProblemDifficulty,
  SolvedTodayProblem,
} from "@/shared/types/domain";
import { normalizeDifficulty } from "@/shared/utils/difficulty";
import {
  formatDateInTimeZone,
  getTodayDateKey,
  INDIA_TIME_ZONE,
} from "@/shared/utils/date";
import { toSlugFromTitle } from "@/shared/utils/slug";

export type QuestionBySlugPayload = {
  difficulty?: string | number;
};

function getTimestampMs(submission: NormalizedSubmissionRecord): number | null {
  const rawTimestamp =
    submission.timestamp ??
    submission.time ??
    submission.submittedAt ??
    submission.createdAt;

  if (rawTimestamp === undefined) {
    return null;
  }

  if (typeof rawTimestamp === "number" && Number.isFinite(rawTimestamp)) {
    return rawTimestamp < 1_000_000_000_000
      ? rawTimestamp * 1000
      : rawTimestamp;
  }

  if (typeof rawTimestamp === "string") {
    if (/^\d+$/.test(rawTimestamp.trim())) {
      const asNumber = Number.parseInt(rawTimestamp, 10);
      return asNumber < 1_000_000_000_000 ? asNumber * 1000 : asNumber;
    }

    const parsedDate = Date.parse(rawTimestamp);
    return Number.isNaN(parsedDate) ? null : parsedDate;
  }

  return null;
}

function isAccepted(submission: NormalizedSubmissionRecord): boolean {
  const statusText = (submission.statusDisplay ?? submission.status ?? "")
    .toString()
    .toLowerCase();

  if (!statusText) {
    return true;
  }

  return statusText.includes("accepted") || statusText === "ac";
}

function getSubmissionTitle(
  submission: NormalizedSubmissionRecord,
): string | null {
  const candidates = [
    submission.title,
    submission.questionTitle,
    submission.problemTitle,
    submission.name,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed) return trimmed;
    }
  }

  return null;
}

function getSubmissionSlug(
  submission: NormalizedSubmissionRecord,
): string | null {
  const candidates = [submission.titleSlug, submission.questionSlug];

  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed) return trimmed;
    }
  }

  const title = getSubmissionTitle(submission);
  return title ? toSlugFromTitle(title) : null;
}

function getSubmissionDifficulty(
  submission: NormalizedSubmissionRecord,
): ProblemDifficulty | null {
  return (
    normalizeDifficulty(submission.difficulty) ??
    normalizeDifficulty(submission.diff) ??
    normalizeDifficulty(submission.level)
  );
}

export function extractSubmissionRecords(
  payload: unknown,
): NormalizedSubmissionRecord[] {
  if (Array.isArray(payload)) {
    return payload as NormalizedSubmissionRecord[];
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
      return value as NormalizedSubmissionRecord[];
    }
  }

  return [];
}

export function getSolvedTodayCount(
  submissions: NormalizedSubmissionRecord[],
): { solved_today: number } {
  const todayDate = getTodayDateKey(INDIA_TIME_ZONE);

  const solvedToday = submissions.filter((submission) => {
    if (!isAccepted(submission)) {
      return false;
    }

    const timestampMs = getTimestampMs(submission);
    if (timestampMs === null) {
      return false;
    }

    const submissionDate = formatDateInTimeZone(
      new Date(timestampMs),
      INDIA_TIME_ZONE,
    );
    return submissionDate === todayDate;
  }).length;

  return { solved_today: solvedToday };
}

export function getSolvedTodayProblems(
  submissions: NormalizedSubmissionRecord[],
  options: { limit?: number } = {},
): { problems: string[] } {
  const entries = getSolvedTodayProblemEntries(submissions, options).problems;
  return { problems: entries.map((problem) => problem.title) };
}

export function getSolvedTodayProblemEntries(
  submissions: NormalizedSubmissionRecord[],
  options: { limit?: number } = {},
): { problems: SolvedTodayProblem[] } {
  const todayDate = getTodayDateKey(INDIA_TIME_ZONE);
  const limit = Math.max(1, Math.trunc(options.limit ?? 20));
  const seen = new Set<string>();
  const problems: SolvedTodayProblem[] = [];

  for (const submission of submissions) {
    if (!isAccepted(submission)) continue;

    const timestampMs = getTimestampMs(submission);
    if (timestampMs === null) continue;

    const submissionDate = formatDateInTimeZone(
      new Date(timestampMs),
      INDIA_TIME_ZONE,
    );
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

