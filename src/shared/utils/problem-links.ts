import type { ProblemDifficulty, ProblemLink } from "@/shared/types/domain";
import { normalizeDifficulty } from "@/shared/utils/difficulty";
import { toSlugFromTitle } from "@/shared/utils/slug";

export function getProblemTitles(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
}

export function mapProblemLinks(
  titlesValue: unknown,
  slugsValue: unknown,
  difficultiesValue: unknown,
): ProblemLink[] {
  const titles = getProblemTitles(titlesValue);
  const slugs = Array.isArray(slugsValue)
    ? slugsValue.map((value) => (typeof value === "string" ? value.trim() : ""))
    : [];
  const difficulties = Array.isArray(difficultiesValue)
    ? difficultiesValue.map((value) =>
        typeof value === "string" || typeof value === "number" ? value : "",
      )
    : [];

  return titles.map((title, index) => {
    const rawSlug = slugs[index] ?? "";
    const slug = rawSlug || toSlugFromTitle(title);
    const difficulty: ProblemDifficulty | null = normalizeDifficulty(
      difficulties[index] ?? "",
    );

    return {
      title,
      slug: slug || null,
      difficulty,
    };
  });
}

