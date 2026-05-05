import type { ProblemDifficulty } from "@/shared/types/domain";

export function normalizeDifficulty(value: unknown): ProblemDifficulty | null {
  if (typeof value === "number") {
    if (value === 1) return "Easy";
    if (value === 2) return "Medium";
    if (value === 3) return "Hard";
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "1" || normalized === "easy") return "Easy";
  if (normalized === "2" || normalized === "medium") return "Medium";
  if (normalized === "3" || normalized === "hard") return "Hard";
  return null;
}

