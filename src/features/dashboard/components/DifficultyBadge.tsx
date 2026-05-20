import type { ProblemDifficulty } from "@/shared/types/domain";

export function DifficultyBadge({
  difficulty,
}: {
  difficulty: ProblemDifficulty | null;
}) {
  if (!difficulty) return null;

  const className =
    difficulty === "Easy"
      ? "border border-emerald-200/60 bg-emerald-50 text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/25 dark:text-emerald-300"
      : difficulty === "Medium"
        ? "border border-amber-200/70 bg-amber-50 text-amber-900 dark:border-amber-800/45 dark:bg-amber-950/25 dark:text-amber-300"
        : "border border-red-200/60 bg-red-50 text-red-800 dark:border-red-800/45 dark:bg-red-950/25 dark:text-red-300";

  return (
    <span
      className={`rounded-lg px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${className}`}
    >
      {difficulty}
    </span>
  );
}

