const LEETCODE_API_BASE_URL = "https://alfa-leetcode-api.onrender.com";

/**
 * Validates whether a given LeetCode username exists.
 * Used during signup to verify the username before creating an account.
 */
export async function checkLeetCodeUserExists(
  username: string,
): Promise<boolean> {
  try {
    const response = await fetch(
      `${LEETCODE_API_BASE_URL}/${encodeURIComponent(username)}`,
      { headers: { Accept: "application/json" } },
    );
    if (!response.ok) return false;
    const data = await response.json();
    // Invalid user response contains errors array and matchedUser: null
    if (Array.isArray(data.errors) && data.errors.length > 0) return false;
    if (data.matchedUser === null) return false;
    return typeof data.username === "string" && data.username.trim().length > 0;
  } catch {
    return false;
  }
}
