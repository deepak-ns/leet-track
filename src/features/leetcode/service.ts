import type {
  ProblemLink,
  ProblemDifficulty,
  SolvedTodayProblem,
} from "@/shared/types/domain";
import {
  checkLeetCodeUserExists,
  getAcceptedSubmissions,
  getCalendar,
  getProfile,
  getQuestionBySlug,
  getSolved,
} from "@/features/leetcode/client";
import { extractSubmissionRecords, getSolvedTodayCount, getSolvedTodayProblemEntries, getSolvedTodayProblems, type QuestionBySlugPayload } from "@/features/leetcode/submissions";
import { normalizeDifficulty } from "@/shared/utils/difficulty";
import { toNumber } from "@/shared/utils/number";

export { checkLeetCodeUserExists, getAcceptedSubmissions, getCalendar, getProfile, getSolved };
export { extractSubmissionRecords, getSolvedTodayCount, getSolvedTodayProblemEntries, getSolvedTodayProblems };

export async function resolveDifficultyBySlug(
  slug: string,
): Promise<ProblemDifficulty | null> {
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
  const cache = new Map<string, Promise<ProblemDifficulty | null>>();

  async function getDifficulty(slug: string) {
    const existing = cache.get(slug);
    if (existing) return existing;
    const promise = resolveDifficultyBySlug(slug);
    cache.set(slug, promise);
    return promise;
  }

  return Promise.all(
    problems.map(async (problem) => ({
      ...problem,
      difficulty: (await getDifficulty(problem.slug)) ?? problem.difficulty,
    })),
  );
}

export async function hydrateMissingProblemLinkDifficulties(
  problems: ProblemLink[],
): Promise<ProblemLink[]> {
  const cache = new Map<string, Promise<ProblemDifficulty | null>>();

  async function getDifficulty(slug: string) {
    const existing = cache.get(slug);
    if (existing) return existing;
    const promise = resolveDifficultyBySlug(slug);
    cache.set(slug, promise);
    return promise;
  }

  return Promise.all(
    problems.map(async (problem) => {
      if (problem.difficulty || !problem.slug) {
        return problem;
      }

      return {
        ...problem,
        difficulty: await getDifficulty(problem.slug),
      };
    }),
  );
}

export function getTotalSolved(payload: unknown): number {
  if (typeof payload !== "object" || payload === null) return 0;

  const solved = payload as Record<string, unknown>;
  const directTotal =
    toNumber(solved.totalSolved) ??
    toNumber(solved.solvedProblem) ??
    toNumber(solved.solved);

  if (directTotal !== null) return directTotal;

  const easy = toNumber(solved.easySolved) ?? 0;
  const medium = toNumber(solved.mediumSolved) ?? 0;
  const hard = toNumber(solved.hardSolved) ?? 0;
  return easy + medium + hard;
}
