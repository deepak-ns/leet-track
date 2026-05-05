import type {
  HistoryGroup,
  SolvedProblemHistoryItem,
} from "@/shared/types/domain";
import type { SolvedProblemRow } from "@/shared/types/database";
import { normalizeDifficulty } from "@/shared/utils/difficulty";
import { getSolvedProblemsForUser } from "@/features/history/repositories/solved-problems.repository";

export function mapSolvedProblemRow(
  row: SolvedProblemRow,
): SolvedProblemHistoryItem {
  return {
    solvedDate: row.solved_date ?? "",
    createdAt: row.created_at ?? "",
    problemTitle: row.problem_title ?? "Untitled problem",
    problemSlug:
      typeof row.problem_slug === "string" && row.problem_slug.trim()
        ? row.problem_slug.trim()
        : null,
    problemDifficulty: normalizeDifficulty(row.problem_difficulty),
  };
}

export function groupSolvedHistory(
  history: SolvedProblemHistoryItem[],
): HistoryGroup[] {
  return Array.from(
    history.reduce((groups, item) => {
      const key = item.solvedDate || "Unknown date";
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)?.push(item);
      return groups;
    }, new Map<string, SolvedProblemHistoryItem[]>()),
  ).map(([date, entries]) => ({ date, entries }));
}

export async function loadSolvedHistory(
  userId: string,
): Promise<SolvedProblemHistoryItem[]> {
  const rows = await getSolvedProblemsForUser(userId);
  return rows
    .map(mapSolvedProblemRow)
    .filter((item) => item.problemTitle.length > 0);
}
