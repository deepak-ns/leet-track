import type { ProblemDifficulty } from "@/shared/types/domain";

export function DifficultyBadge({
  difficulty,
}: {
  difficulty: ProblemDifficulty | null;
}) {
  if (!difficulty) return null;

  const className =
    difficulty === "Easy"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
      : difficulty === "Medium"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
        : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400";

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${className}`}
    >
      {difficulty}
    </span>
  );
}

