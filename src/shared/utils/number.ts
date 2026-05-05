export function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

export function normalizePositiveInteger(
  value: unknown,
  fallback = 1,
): number {
  return Math.max(1, Math.trunc(toNumber(value) ?? fallback));
}

