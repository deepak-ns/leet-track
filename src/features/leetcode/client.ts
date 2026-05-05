const LEETCODE_API_BASE_URL = "https://alfa-leetcode-api.onrender.com";

type FetchOptions = {
  revalidateSeconds?: number;
};

export async function fetchFromLeetcode<T>(
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

export async function getQuestionBySlug<T = unknown>(
  titleSlug: string,
): Promise<T> {
  return fetchFromLeetcode<T>(
    `/select?titleSlug=${encodeURIComponent(titleSlug)}`,
  );
}

export async function checkLeetCodeUserExists(
  username: string,
): Promise<boolean> {
  try {
    const response = await fetch(
      `${LEETCODE_API_BASE_URL}/${encodeURIComponent(username)}`,
    );
    if (!response.ok) return false;

    const data = await response.json();
    if (data.errors && data.errors.length > 0) return false;
    if (data.matchedUser === null) return false;

    return (
      typeof data.username === "string" && data.username.trim().length > 0
    );
  } catch {
    return false;
  }
}

